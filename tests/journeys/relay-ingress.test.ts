import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {WebSocketServer} from 'ws';
import type {ClientFrame} from '../../api/laptop-link-v1.js';
import {compose} from '../../src/app/compose.js';
import {identityFixture} from '../integration/fixtures/identity.js';
import {tlsFixture} from '../integration/fixtures/tls.js';
import {ingressFixture} from '../integration/fixtures/ingress.js';
import {laptopPeer} from '../integration/fixtures/laptop-peer.js';
import {localSession,localStep} from '../integration/fixtures/local-sidecar.js';

test('relay_peer_cleanup_terminates_a_socket_that_does_not_answer_close',async()=>{
 const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
 const address=server.address();assert.ok(address&&typeof address!=='string');
 const connected=once(server,'connection');
 const peer=await laptopPeer(`ws://127.0.0.1:${address.port}`,'synthetic');
 const [remote]=await connected;remote.pause();
 try{
  const bounded=await Promise.race([
   peer.close(50).then(()=>true),
   new Promise<false>(resolve=>setTimeout(()=>resolve(false),200)),
  ]);
  assert.equal(bounded,true,'cleanup must complete when the remote never acknowledges close');
  assert.notEqual(peer.socket.readyState,peer.socket.OPEN);
 }finally{peer.socket.terminate();remote.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('relay_peer_close_wait_reports_bounded_failure_and_reaches_cleanup',async()=>{
 const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
 const address=server.address();assert.ok(address&&typeof address!=='string');
 const connected=once(server,'connection');
 const peer=await laptopPeer(`ws://127.0.0.1:${address.port}`,'synthetic');
 const [remote]=await connected;remote.pause();let cleaned=false;
 try{
  await assert.rejects(peer.waitForClose(50),/peer_close_timeout/);
 }finally{
  await peer.close(50);remote.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));cleaned=true;
 }
 assert.equal(cleaned,true);assert.equal(peer.socket.readyState,peer.socket.CLOSED);
});

test('relay_ingress_forwards_authenticated_wss_and_rejects_missing_authority',async()=>{
 const f=await identityFixture(),tls=await tlsFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 let ingress:Awaited<ReturnType<typeof ingressFixture>>|undefined,peer:Awaited<ReturnType<typeof laptopPeer>>|undefined;
 try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');
  ingress=await ingressFixture(address.port,tls);
  const native=await f.login(),phone=await f.login();
  const code=await app.links.issueCode(native.principal,'Synthetic ingress laptop');
  await app.links.claim(phone.principal,randomUUID(),code.code);
  assert.equal((await fetch(ingress.base+'/v1/nylra/laptops')).status,401);
  const hello:ClientFrame={type:'hello',protocolVersion:1,producerId:randomUUID(),lastAck:0};
  await assert.rejects(laptopPeer(ingress.base.replace('https:','wss:')+'/v1/nylra/laptop-link','invalid',
   undefined,{ca:tls.cert,handshakeTimeout:5000}),/Unexpected server response: 401/);
  peer=await laptopPeer(ingress.base.replace('https:','wss:')+'/v1/nylra/laptop-link',native.handle,
   s=>s.send(JSON.stringify(hello)),{ca:tls.cert,handshakeTimeout:5000});
  assert.equal((await peer.next()).type,'ready');
  peer.send({type:'batch',entries:[{seq:1,event:{...localSession,at:f.now.toISOString()}}]});
  assert.equal((await peer.next()).ackThrough,1);
  const closed=peer.waitForClose();void closed.catch(()=>{});
  await f.devices.revoke(phone.principal,native.principal.deviceId);
  peer.send({type:'batch',entries:[{seq:2,event:{...localStep,at:f.now.toISOString()}}]});
  assert.equal((await closed)[0],1008);
 }finally{await peer?.close();await ingress?.close();await app.stop();await tls.close();await f.close();}
});

test('relay_ingress_delivers_small_sse_event_before_heartbeat_or_stream_close',async()=>{
 const f=await identityFixture(),tls=await tlsFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 const controller=new AbortController();let ingress:Awaited<ReturnType<typeof ingressFixture>>|undefined;
 try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');
  ingress=await ingressFixture(address.port,tls);
  const native=await f.login(),phone=await f.login();
  const code=await app.links.issueCode(native.principal,'Synthetic SSE laptop');
  await app.links.claim(phone.principal,randomUUID(),code.code);
  const lease=await app.links.open(native.principal,randomUUID(),0);
  await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]);
  const listing=await app.sessions.list(phone.principal),id=listing.sessions[0]!.sessionId;
  const snapshot=await app.sessions.snapshot(phone.principal,id);
  const deadline=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch(`${ingress.base}/v1/nylra/sessions/${id}/events?after=${snapshot.cursor}`,
    {headers:{authorization:`Bearer ${phone.handle}`},signal:controller.signal});
   assert.equal(response.status,200);assert.match(response.headers.get('content-type')??'',/text\/event-stream/);
   const reader=response.body!.getReader();
   await app.sessions.ingest(native.principal,lease,[{seq:2,event:{...localStep,at:f.now.toISOString()}}]);
   let received='';while(!received.includes('\n\n')){const next=await reader.read();assert.equal(next.done,false);received+=new TextDecoder().decode(next.value);}
   assert.match(received,new RegExp(`^id: ${snapshot.cursor+1}\\n`,'m'));
   assert.match(received,/event: step_added/);
   await reader.cancel();
  }finally{clearTimeout(deadline);}
 }finally{controller.abort();await ingress?.close();await app.stop();await tls.close();await f.close();}
});
