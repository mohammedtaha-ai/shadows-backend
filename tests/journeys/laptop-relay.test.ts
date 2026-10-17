import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import type {ClientFrame} from '../../api/laptop-link-v1.js';
import {identityFixture} from '../integration/fixtures/identity.js';
import {tlsFixture} from '../integration/fixtures/tls.js';
import {laptopPeer} from '../integration/fixtures/laptop-peer.js';
import {localSession,localStep} from '../integration/fixtures/local-sidecar.js';
import {compose} from '../../src/app/compose.js';

test('laptop_relay_generated_peer_https_wss_lost_ack_epoch_snapshot_stream_and_revoke',async()=>{
 const f=await identityFixture(),tls=await tlsFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now,tls:{key:tls.key,cert:tls.cert}});
 const controller=new AbortController();try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');const base=`https://127.0.0.1:${address.port}`;
  const native=await f.login(),phone=await f.login();
  const request=async(path:string,handle:string,body?:unknown,method=body?'POST':'GET')=>fetch(base+path,{method,headers:{authorization:`Bearer ${handle}`,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const issue=await request('/v1/nylra/laptops/pairing-code',native.handle,{name:'TLS synthetic laptop'});assert.equal(issue.status,200);const pairing=await issue.json() as {code:string};
  const claimed=await request('/v1/nylra/laptops/claim',phone.handle,{commandId:randomUUID(),code:pairing.code});assert.equal(claimed.status,200);const laptop=await claimed.json() as {laptopId:string};
  const artifact=JSON.parse(await readFile('api/laptop-link-v1.schema.json','utf8'));
  const validator=(name:string)=>app.server.validatorCompiler!({schema:{$ref:`#/definitions/${name}`,definitions:artifact.definitions},method:'POST',url:'/synthetic-peer',httpPart:'body'});
  const client=validator('ClientFrame'),server=validator('ServerFrame');
  const producer=randomUUID(),hello:ClientFrame={type:'hello',protocolVersion:1,producerId:producer,lastAck:0};
  assert.ok(client(hello));const socketUrl=base.replace('https:','wss:')+'/v1/nylra/laptop-link';
  const peer=await laptopPeer(socketUrl,native.handle,s=>s.send(JSON.stringify(hello)),{ca:tls.cert});assert.ok(server(await peer.next()));
  const entries=[{seq:1,event:{...localSession,at:f.now.toISOString()}},{seq:2,event:{...localStep,at:f.now.toISOString()}}];
  const frame={type:'batch',entries};assert.ok(client(frame));
  const ingest=app.sessions.ingest;let committed!:()=>void,release!:()=>void;const committedBatch=new Promise<void>(r=>{committed=r;}),barrier=new Promise<void>(r=>{release=r;});
  app.sessions.ingest=async(...args)=>{const result=await ingest(...args);committed();await barrier;return result;};
  peer.send(frame);await committedBatch;const gone=once(peer.socket,'close');peer.socket.terminate();await gone;release();app.sessions.ingest=ingest;
  const recovered=await laptopPeer(socketUrl,native.handle,s=>s.send(JSON.stringify(hello)),{ca:tls.cert});const ready=await recovered.next();assert.ok(server(ready));assert.equal(ready.ackThrough,2);
  recovered.send(frame);assert.equal((await recovered.next()).ackThrough,2);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM sessions_steps')).rows[0].n,1);assert.equal((await f.pool.query('SELECT count(*)::int n FROM sessions_events')).rows[0].n,2);
  const listed=await (await request('/v1/nylra/sessions',phone.handle)).json() as {sessions:{sessionId:string}[]};const id=listed.sessions[0]!.sessionId;
  const snapshot=await (await request(`/v1/nylra/sessions/${id}`,phone.handle)).json() as {cursor:number;steps:unknown[]};assert.equal(snapshot.steps.length,1);
  const stream=await fetch(`${base}/v1/nylra/sessions/${id}/events?after=${snapshot.cursor}`,{headers:{authorization:`Bearer ${phone.handle}`},signal:controller.signal});assert.equal(stream.status,200);const reader=stream.body!.getReader();
  recovered.send({type:'batch',entries:[{seq:3,event:{...localStep,localStepId:'next',at:f.now.toISOString()}}]});assert.equal((await recovered.next()).ackThrough,3);
  assert.match(new TextDecoder().decode((await reader.read()).value),/^id: 3\n/m);
  const newest=await laptopPeer(socketUrl,native.handle,s=>s.send(JSON.stringify({...hello,lastAck:3})),{ca:tls.cert});assert.equal((await newest.next()).ackThrough,3);
  const oldClose=once(recovered.socket,'close');recovered.send(frame);assert.equal((await oldClose)[0],1008);
  const unlink=await request(`/v1/nylra/laptops/${laptop.laptopId}`,phone.handle,undefined,'DELETE');assert.equal(unlink.status,200);
  const refusal=once(newest.socket,'close');newest.send(frame);assert.equal((await refusal)[0],1008);
  while(!(await reader.read()).done){}
  assert.equal((await request(`/v1/nylra/sessions/${id}`,phone.handle)).status,404);
  await f.devices.revoke(native.principal,phone.principal.deviceId);assert.equal((await request('/v1/nylra/laptops',phone.handle)).status,401);
 }finally{controller.abort();await app.stop();await tls.close();await f.close();}
});
