import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import WebSocket from 'ws';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import {laptopPeer} from './fixtures/laptop-peer.js';
import {localSession} from './fixtures/local-sidecar.js';

test('laptop_link_listener_race_protocol_epoch_and_current_revocation',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');const url=`ws://127.0.0.1:${address.port}/v1/nylra/laptop-link`;
  const denied=new WebSocket(url);denied.on('error',()=>{});const [,response]=await once(denied,'unexpected-response');assert.equal(response.statusCode,401);response.resume();denied.terminate();
  const native=await f.login(),phone=await f.login();
  const code=await app.links.issueCode(native.principal,'A');await app.links.claim(phone.principal,randomUUID(),code.code);
  const producer=randomUUID(),hello={type:'hello',protocolVersion:1,producerId:producer,lastAck:0};
  const peer=await laptopPeer(url,native.handle,socket=>{socket.send(JSON.stringify(hello));socket.send(JSON.stringify({type:'batch',entries:[{seq:1,event:{...localSession,at:f.now.toISOString()}}]}));});
  assert.equal((await peer.next()).type,'ready');assert.equal((await peer.next()).ackThrough,1);
  const newer=await laptopPeer(url,native.handle,s=>s.send(JSON.stringify(hello)));const ready=await newer.next();assert.ok(ready.epoch>1);assert.equal(ready.ackThrough,1);
  const oldClose=once(peer.socket,'close');peer.send({type:'batch',entries:[{seq:2,event:{...localSession,at:f.now.toISOString()}}]});assert.equal((await oldClose)[0],1008);
  assert.equal((await app.links.list(phone.principal)).laptops[0]!.status,'online');
  await f.devices.revoke(phone.principal,native.principal.deviceId);const closed=once(newer.socket,'close');newer.send({type:'batch',entries:[{seq:2,event:{...localSession,at:f.now.toISOString()}}]});assert.equal((await closed)[0],1008);
  const second=await f.login(),c=await app.links.issueCode(second.principal,'B');await app.links.claim(phone.principal,randomUUID(),c.code);
  for(const [input,want] of [[{type:'hello',protocolVersion:2,producerId:randomUUID(),lastAck:0},1002],['{',1002],['x'.repeat(65537),1009]]) {
   const p=await laptopPeer(url,second.handle);const close=once(p.socket,'close');p.socket.send(typeof input==='string'?input:JSON.stringify(input));assert.equal((await close)[0],want);
  }
 }finally{await app.stop();await f.close();}
});

test('laptop_link_idle_and_pending_send_reauthorize_and_bound_queue',async t=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');const url=`ws://127.0.0.1:${address.port}/v1/nylra/laptop-link`;
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');await app.links.claim(phone.principal,randomUUID(),code.code);
  const hello={type:'hello',protocolVersion:1,producerId:randomUUID(),lastAck:0};
  t.mock.timers.enable({apis:['setInterval']});
  const peer=await laptopPeer(url,native.handle,s=>s.send(JSON.stringify(hello)));await peer.next();
await f.identity.logout(native.principal);
  const close=once(peer.socket,'close');t.mock.timers.tick(15000);assert.equal((await close)[0],1008);t.mock.timers.reset();
  const second=await f.login(),c=await app.links.issueCode(second.principal,'B');await app.links.claim(phone.principal,randomUUID(),c.code);
  const queued=await laptopPeer(url,second.handle);const queueClose=once(queued.socket,'close');
  // Hold the first service authorization while five frames arrive together.
  const original=f.oidc.isSessionActive;let release!:()=>void;let entered!:()=>void;
  const waiting=new Promise<void>(r=>{entered=r;});const barrier=new Promise<void>(r=>{release=r;});
  f.oidc.isSessionActive=async()=>{entered();await barrier;return true;};
  queued.send({...hello,producerId:randomUUID()});await waiting;
  for(let i=0;i<5;i++)queued.send({type:'batch',entries:[{seq:i+1,event:{...localSession,at:f.now.toISOString()}}]});
  assert.equal((await queueClose)[0],1013);release();f.oidc.isSessionActive=original;
 }finally{t.mock.timers.reset();await app.stop();await f.close();}
});

test('laptop_link_refuses_pending_ack_after_revoke_and_slow_output',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  await app.start();const a=app.server.server.address();assert.ok(a&&typeof a!=='string');const url=`ws://127.0.0.1:${a.port}/v1/nylra/laptop-link`;
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');const laptop=await app.links.claim(phone.principal,randomUUID(),code.code);
  const hello={type:'hello',protocolVersion:1,producerId:randomUUID(),lastAck:0};const peer=await laptopPeer(url,native.handle,s=>s.send(JSON.stringify(hello)));await peer.next();
  const ingest=app.sessions.ingest;let entered!:()=>void,release!:()=>void;const waiting=new Promise<void>(r=>{entered=r;}),barrier=new Promise<void>(r=>{release=r;});
  app.sessions.ingest=async(...args)=>{const result=await ingest(...args);entered();await barrier;return result;};
  peer.send({type:'batch',entries:[{seq:1,event:{...localSession,at:f.now.toISOString()}}]});await waiting;
  await app.links.unlink(phone.principal,laptop.laptopId);const close=once(peer.socket,'close');release();assert.equal((await peer.next()).code,'unauthorized');assert.equal((await close)[0],1008);
  app.sessions.ingest=ingest;
  const c=await app.links.issueCode(native.principal,'B');await app.links.claim(phone.principal,randomUUID(),c.code);
  const slow=await laptopPeer(url,native.handle,s=>s.send(JSON.stringify({...hello,producerId:randomUUID()})));await slow.next();
  // Deterministic transport backpressure boundary; actual network saturation is not claimed.
  const serverSocket=[...app.server.websocketServer.clients].find(s=>s.readyState===s.OPEN)!;
  Object.defineProperty(serverSocket,'bufferedAmount',{get:()=>1048576,configurable:true});
  const closed=once(slow.socket,'close');slow.send({type:'batch',entries:[{seq:1,event:{...localSession,at:f.now.toISOString()}}]});assert.equal((await closed)[0],1013);
 }finally{await app.stop();await f.close();}
});
