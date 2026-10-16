import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {localSession,localStep} from './fixtures/local-sidecar.js';

test('session_projection_expiry_invalid_timestamps_and_concurrent_unlink',async()=>{
 const f=await identityFixture();try{
  assert.equal((await f.pool.query("SELECT to_regclass('sessions_events') AS name")).rows[0].name,'sessions_events');
  const {relayServices}=await import('./fixtures/relay.js');const {links,sessions}=relayServices(f);
  const native=await f.login(),phone=await f.login(),code=await links.issueCode(native.principal,'A');await links.claim(phone.principal,randomUUID(),code.code);
  const lease=await links.open(native.principal,randomUUID(),0),at=f.now.toISOString();await sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at}}]);
  const cloud=(await sessions.list(phone.principal)).sessions[0]!;
  for(const wrong of [{...localStep,at,tool:'Bash',path:'echo SYNTHETIC_SECRET=123'}, {...localStep,at,summary:'echo SYNTHETIC_SECRET=123'}, {...localStep,at:'2026-02-31T00:00:00Z'}, {...localStep,at:new Date(f.now.getTime()+300001).toISOString()}])
   await assert.rejects(sessions.ingest(native.principal,lease,[{seq:2,event:wrong}]),/request_invalid/);
  const expired=await sessions.ingest(native.principal,lease,[{seq:2,event:{...localStep,at:new Date(f.now.getTime()-8*86400000).toISOString()}}]);
  assert.deepEqual(expired.dropped,[{seq:2,code:'event_expired'}]);assert.equal((await sessions.snapshot(phone.principal,cloud.sessionId)).steps.length,0);
  const outcomes=await Promise.allSettled([sessions.ingest(native.principal,lease,[{seq:3,event:{...localStep,at}}]),links.unlink(phone.principal,lease.laptopId)]);
  assert.equal(outcomes[1]!.status,'fulfilled');
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM sessions_steps')).rows[0].n,0);
  assert.equal(JSON.stringify((await f.pool.query('SELECT * FROM activity_events')).rows).includes('SYNTHETIC_SECRET'),false);
 }finally{await f.close();}
});

test('session_local_identity_is_laptop_scoped_and_expired_replay_refuses',async()=>{
 const f=await identityFixture();try{
  const {relayServices}=await import('./fixtures/relay.js');const {links,sessions}=relayServices(f);
  const phone=await f.login(),a=await f.login(),b=await f.login();const leases=[];
  for(const native of [a,b]){const code=await links.issueCode(native.principal,'Laptop');await links.claim(phone.principal,randomUUID(),code.code);leases.push(await links.open(native.principal,randomUUID(),0));}
  for(const [i,native] of [a,b].entries())await sessions.ingest(native.principal,leases[i]!,[{seq:1,event:{...localSession,at:f.now.toISOString()}},{seq:2,event:{...localStep,at:f.now.toISOString()}}]);
  const list=await sessions.list(phone.principal);assert.equal(list.sessions.length,2);assert.equal(new Set(list.sessions.map(s=>s.sessionId)).size,2);
  const id=list.sessions[0]!.sessionId;
  await f.pool.query('UPDATE sessions_events SET expires_at=$1 WHERE session_id=$2 AND seq=1',[new Date(f.now.getTime()-1000),id]);
  await assert.rejects(sessions.events(phone.principal,id,0,100),/resnapshot_required/);
  assert.deepEqual((await sessions.events(phone.principal,id,1,100)).events.map(e=>e.seq),[2]);
  await f.pool.query('UPDATE links_ingress_receipts SET expires_at=$1 WHERE laptop_id=$2',[new Date(f.now.getTime()-1000),leases[0]!.laptopId]);
  await assert.rejects(sessions.ingest(a.principal,leases[0]!,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]),/resnapshot_required/);
 }finally{await f.close();}
});
