import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import {localSession,localStep} from './fixtures/local-sidecar.js';
import {laptopPeer} from './fixtures/laptop-peer.js';
import Fastify,{type FastifyReply} from 'fastify';
import {fastifySSE} from '@fastify/sse';
import {serveEvents} from '../../src/transports/http/nylra-sse.js';
import {AccountEvent} from '../../src/transports/http/nylra-schema.js';
import {createExpiry} from '../../src/app/expiry.js';

async function setup(){
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'Review');await app.links.claim(phone.principal,randomUUID(),code.code);
 const producer=randomUUID(),lease=await app.links.open(native.principal,producer,0);
 return {f,app,native,phone,producer,lease,async close(){await app.stop();await f.close();}};
}

test('review_session_state_preserves_latest_step_in_both_journals',async()=>{
 const s=await setup();const {f,app,native,phone,lease}=s;try{
  const at=f.now.toISOString();await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at}},{seq:2,event:{...localStep,at}},{seq:3,event:{...localSession,at,state:'waiting'}}]);
  const row=(await app.sessions.list(phone.principal)).sessions[0]!;const snapshot=await app.sessions.snapshot(phone.principal,row.sessionId);
  const events=await app.sessions.events(phone.principal,row.sessionId,2,100);const last=events.events[0]!;
  assert.equal(last.type,'session_updated');assert.deepEqual(last.type==='session_updated'?last.session.lastStep:null,snapshot.session.lastStep);
  const account=await f.db.transaction().execute(tx=>app.activity.read(tx,phone.principal.accountId,0,100));
  const latest=account.events.at(-1)!.payload.session as {lastStep:unknown};assert.deepEqual(latest.lastStep,snapshot.session.lastStep);
 }finally{await s.close();}
});

test('review_session_list_includes_recent_update_outside_uuid_window',async()=>{
 const s=await setup();const {f,app,native,phone,lease}=s;try{
  const at=f.now.toISOString();let seq=0;
  for(let start=0;start<201;start+=20)await app.sessions.ingest(native.principal,lease,Array.from({length:Math.min(20,201-start)},(_,i)=>({seq:++seq,event:{...localSession,localSessionId:`session-${start+i}`,at}})));
  const list=await app.sessions.list(phone.principal),included=new Set(list.sessions.map(v=>v.sessionId));
  const omitted=(await f.pool.query('SELECT id,local_id FROM sessions_sessions')).rows.find(r=>!included.has(r.id))!;
  f.advance(1000);await app.sessions.ingest(native.principal,lease,[{seq:++seq,event:{...localSession,localSessionId:omitted.local_id,at:f.now.toISOString()}}]);
  const fresh=await app.sessions.list(phone.principal);assert.equal(fresh.sessions.length,200);assert.equal(fresh.sessions[0]!.sessionId,omitted.id);
 }finally{await s.close();}
});

test('review_ready_recovers_lost_drop_and_refuses_missing_receipt_history',async()=>{
 const s=await setup();const {f,app,native,producer,lease}=s;try{
  await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}},{seq:2,event:{...localStep,at:new Date(f.now.getTime()-8*86400000).toISOString()}}]);
  await app.start();const a=app.server.server.address();assert.ok(a&&typeof a!=='string');
  const peer=await laptopPeer(`ws://127.0.0.1:${a.port}/v1/nylra/laptop-link`,native.handle,socket=>socket.send(JSON.stringify({type:'hello',protocolVersion:1,producerId:producer,lastAck:1})));
  const ready=await peer.next();assert.equal(ready.ackThrough,2);assert.deepEqual(ready.dropped,[{seq:2,code:'event_expired'}]);await peer.close();
  await f.pool.query('UPDATE links_ingress_receipts SET expires_at=$1 WHERE seq=2',[new Date(f.now.getTime()-1000)]);
  await assert.rejects(app.links.open(native.principal,producer,1),/resnapshot_required/);
 }finally{await s.close();}
});

test('review_expiry_purges_inactive_payloads_without_account_reads',async()=>{
 const s=await setup();const {f,app,native,lease}=s;try{
  await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}},{seq:2,event:{...localStep,at:f.now.toISOString()}}]);
  for(const table of ['sessions_sessions','sessions_steps','sessions_events','activity_events','links_ingress_receipts'])await f.pool.query(`UPDATE ${table} SET expires_at=$1`,[new Date(f.now.getTime()-1000)]);
  assert.equal(typeof (app as {expire?:unknown}).expire,'function','application owns idle expiry');
  await app.expire();
  for(const table of ['sessions_steps','sessions_events','activity_events','links_ingress_receipts'])assert.equal((await f.pool.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n,0,table);
  const row=(await f.pool.query('SELECT payload,high_water,floor FROM sessions_sessions')).rows[0];assert.equal(row.payload,null);assert.equal(row.high_water,'2');assert.equal(row.floor,'2');
 }finally{await s.close();}
});

test('review_ready_refuses_expired_outstanding_receipt_before_advancing_epoch',async()=>{
 const s=await setup();try{
  await s.app.sessions.ingest(s.native.principal,s.lease,[{seq:1,event:{...localSession,at:s.f.now.toISOString()}}]);
  await s.f.pool.query('UPDATE links_ingress_receipts SET expires_at=$1',[new Date(s.f.now.getTime()-1000)]);
  await assert.rejects(s.app.links.open(s.native.principal,s.producer,0),/resnapshot_required/);
  assert.equal((await s.f.pool.query('SELECT epoch FROM links_laptops')).rows[0].epoch,'1');
 }finally{await s.close();}
});

test('review_expiry_scheduler_is_nonoverlapping_and_drains_before_stop',async t=>{
 t.mock.timers.enable({apis:['setInterval']});let calls=0,release!:()=>void;
 const barrier=new Promise<void>(r=>{release=r;});
 const scheduler=createExpiry([{async expire(){if(++calls>1)await barrier;}}]);
 try{
  await scheduler.start();assert.equal(calls,1);
  t.mock.timers.tick(60000);await Promise.resolve();assert.equal(calls,2);
  t.mock.timers.tick(180000);await Promise.resolve();assert.equal(calls,2);
  let stopped=false;const stopping=scheduler.stop().then(()=>{stopped=true;});await Promise.resolve();assert.equal(stopped,false);
  release();await stopping;t.mock.timers.tick(120000);assert.equal(calls,2);
 }finally{release();await scheduler.stop();t.mock.timers.reset();}
});

async function stalledSse(t:TestContext,action:'revoke'|'disconnect'){
 const f=await identityFixture(),server=Fastify({logger:false}),controller=new AbortController();let reply:FastifyReply|undefined,finished=false;
 let entered!:()=>void;const waiting=new Promise<void>(r=>{entered=r;});
 try{
  const a=await f.login(),b=await f.login();await server.register(fastifySSE,{heartbeatInterval:0});
  t.mock.timers.enable({apis:['setInterval']});
  server.get('/events',{sse:'manual'},async(_request,r)=>{
   reply=r;const write=r.raw.write.bind(r.raw);r.raw.write=((chunk:any,...rest:any[])=>{if(String(chunk).includes('data:')){entered();return false;}return (write as any)(chunk,...rest);}) as typeof r.raw.write;
   try{await serveEvents(r,0,AccountEvent,async()=>({events:[{type:'laptop_unlinked',seq:1,laptopId:randomUUID()}],highWater:1}),async()=>{await f.db.transaction().execute(tx=>f.identity.authorizeTransaction(tx,a.principal));});}finally{finished=true;}
  });
  const base=await server.listen({host:'127.0.0.1',port:0});const response=await fetch(base+'/events',{signal:controller.signal});assert.equal(response.status,200);await waiting;
  if(action==='revoke'){await f.devices.revoke(b.principal,a.principal.deviceId);t.mock.timers.tick(15000);}else controller.abort();
  const deadline=Date.now()+1000;while(!finished&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
  assert.equal(finished,true,'stalled send must release its handler without drain');
 }finally{controller.abort();reply?.raw.emit('drain');reply?.sse.close();t.mock.timers.reset();await server.close();await f.close();}
}
test('review_sse_stalled_send_cancels_on_revoke',t=>stalledSse(t,'revoke'));
test('review_sse_stalled_send_cancels_on_disconnect',t=>stalledSse(t,'disconnect'));
