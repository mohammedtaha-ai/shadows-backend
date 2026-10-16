import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {localSession,localStep} from './fixtures/local-sidecar.js';

test('lost_ack_replays_without_second_step_or_event',async()=>{
 const f=await identityFixture();try{
  assert.equal((await f.pool.query("SELECT to_regclass('sessions_steps') AS name")).rows[0].name,'sessions_steps');
  const {relayServices}=await import('./fixtures/relay.js');const {links,sessions}=relayServices(f);
  const native=await f.login(),phone=await f.login();const code=await links.issueCode(native.principal,'A');await links.claim(phone.principal,randomUUID(),code.code);
  const producer=randomUUID();const lease=await links.open(native.principal,producer,0);
  const batch=[{seq:1,event:{...localSession,at:f.now.toISOString()}},{seq:2,event:{...localStep,at:f.now.toISOString()}}];
  const first=await sessions.ingest(native.principal,lease,batch);assert.equal(first.ackThrough,2);
  const cloud=(await sessions.list(phone.principal)).sessions[0]!;assert.notEqual(cloud.sessionId,localSession.localSessionId);
  const count=async()=>({steps:(await f.pool.query('SELECT count(*)::int n FROM sessions_steps')).rows[0].n,events:(await f.pool.query('SELECT count(*)::int n FROM sessions_events')).rows[0].n,account:(await f.pool.query('SELECT count(*)::int n FROM activity_events')).rows[0].n});
  const before=await count();assert.equal(before.steps,1);assert.equal(before.events,2);
  await sessions.ingest(native.principal,lease,batch);assert.deepEqual(await count(),before);
  const next=await links.open(native.principal,producer,0);assert.equal(next.ackThrough,2);
  await sessions.ingest(native.principal,next,batch);assert.deepEqual((await count()).steps,1);
  await assert.rejects(sessions.ingest(native.principal,lease,[{seq:3,event:{...localStep,localStepId:'old',at:f.now.toISOString()}}]),/unauthorized/);
  const snapshot=await sessions.snapshot(phone.principal,cloud.sessionId);assert.equal(snapshot.steps.length,1);assert.equal(snapshot.steps[0]!.summary,'Read');
  f.setSubject('foreign');const foreign=await f.login();await assert.rejects(sessions.snapshot(foreign.principal,cloud.sessionId),/not_found/);
  await links.unlink(phone.principal,lease.laptopId);await assert.rejects(sessions.snapshot(phone.principal,cloud.sessionId),/not_found/);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM sessions_steps')).rows[0].n,0);
 }finally{await f.close();}
});

test('changed_payload_under_same_position_refuses_and_rollback_is_atomic',async()=>{
 const f=await identityFixture();try{
  const {relayServices}=await import('./fixtures/relay.js');const {links,sessions}=relayServices(f);
  const native=await f.login(),phone=await f.login(),code=await links.issueCode(native.principal,'A');await links.claim(phone.principal,randomUUID(),code.code);
  const lease=await links.open(native.principal,randomUUID(),0),at=f.now.toISOString();
  await sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at}}]);
  await assert.rejects(sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at,projectName:'changed'}}]),/command_conflict/);
  await assert.rejects(sessions.ingest(native.principal,lease,[{seq:2,event:{...localStep,at}},{seq:3,event:{...localStep,localSessionId:'missing',localStepId:'missing',at}}]),/not_found/);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM sessions_steps')).rows[0].n,0);
  assert.equal((await links.open(native.principal,lease.producerId,1)).ackThrough,1);
 }finally{await f.close();}
});
