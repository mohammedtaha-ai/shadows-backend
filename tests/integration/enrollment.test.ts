import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
import { createIdentity,hash,type Enrollment } from '../../src/modules/identity/index.js';
import { createDevices } from '../../src/modules/devices/index.js';
import { restartPending } from './fixtures/restart.js';

// Exercise the real registration/store/transaction boundary, not a provider's device identifier.
test('enrollment_reauthentication_restart_proof_and_revocation', async () => {
 const f=await identityFixture();
 try {
  const redeem=async (enrollment:Enrollment) => {
   const p=await f.pending(),r=await f.identity.finishLogin(p.callback);
   return f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier,enrollment});
  };
  const first=await redeem({mode:'new'});assert.ok(first.enrollmentCredential);
  assert.match(first.enrollmentCredential,/^[A-Za-z0-9_-]{43}$/);
  const reuse:Enrollment={mode:'reuse',credential:first.enrollmentCredential};
  await f.identity.logout(first.principal);
  const second=await redeem(reuse);
  assert.equal(second.principal.deviceId,first.principal.deviceId);
  assert.notEqual(second.principal.sessionId,first.principal.sessionId);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM devices')).rows[0].n,1);
  const devices=createDevices(f.db,()=>f.now),restarted=createIdentity(f.db,f.config,f.oidc,devices.registration,devices.trust,()=>f.now);
  devices.bindIdentity(restarted);
  const pending=await f.pending(),ticket=await restarted.finishLogin(pending.callback);
  const third=await restarted.redeemReturn({ticket:ticket.ticket,returnVerifier:pending.returnVerifier,enrollment:reuse});
  assert.equal(third.principal.deviceId,first.principal.deviceId);
  assert.equal(JSON.stringify((await f.pool.query('SELECT * FROM devices')).rows).includes(first.enrollmentCredential),false);
  await assert.rejects(redeem({mode:'reuse',credential:f.verifier()}),{message:'return_refused'});
  f.setSubject('foreign');await assert.rejects(redeem(reuse),{message:'return_refused'});f.setSubject('subject-one');
  await f.devices.revoke(third.principal,third.principal.deviceId);
  assert.equal(await f.identity.authenticate(second.handle),null);
  await assert.rejects(redeem(reuse),{message:'return_refused'});
  const explicit=await redeem({mode:'new'});
  assert.notEqual(explicit.principal.deviceId,first.principal.deviceId);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM devices')).rows[0].n,2);
 } finally {await f.close();}
});

test('enrollment_parallel_reauthentication_and_transaction_rollback',async()=>{
 const f=await identityFixture();
 try {
  const first=await f.login();assert.ok(first.enrollmentCredential);
  const p=await f.pending(),r=await f.identity.finishLogin(p.callback);
  const input={ticket:r.ticket,returnVerifier:p.returnVerifier,enrollment:{mode:'reuse' as const,credential:first.enrollmentCredential}};
  const results=await Promise.allSettled([f.identity.redeemReturn(input),f.identity.redeemReturn(input)]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM devices')).rows[0].n,1);
  const next=await f.pending(),returned=await f.identity.finishLogin(next.callback);
  const retry={...input,ticket:returned.ticket,returnVerifier:next.returnVerifier};
  await f.pool.query("CREATE FUNCTION fail_enrollment_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END $$");
  await f.pool.query('CREATE TRIGGER fail_enrollment_session BEFORE INSERT ON identity_sessions FOR EACH ROW EXECUTE FUNCTION fail_enrollment_session()');
  await assert.rejects(f.identity.redeemReturn(retry),{message:'return_refused'});
  assert.equal((await f.pool.query('SELECT consumed_at FROM identity_return_tickets WHERE ticket_hash=$1',[hash(returned.ticket)])).rows[0].consumed_at,null);
  await f.pool.query('DROP TRIGGER fail_enrollment_session ON identity_sessions');
  const grant=await f.identity.redeemReturn(retry);
  assert.equal(grant.principal.deviceId,first.principal.deviceId);
 } finally {await f.close();}
});

test('enrollment_fresh_process_and_parallel_independent_reauthentication',async()=>{
 const f=await identityFixture();
 try {
  const first=await f.login();assert.ok(first.enrollmentCredential);
  const enrollment:Enrollment={mode:'reuse',credential:first.enrollmentCredential};
  const pending=await f.pending();assert.equal((await restartPending(f.config,pending,enrollment)).status,200);
  const attempts=await Promise.all([f.pending(),f.pending()]);
  const returned=await Promise.all(attempts.map(async p=>({...(await f.identity.finishLogin(p.callback)),returnVerifier:p.returnVerifier})));
  const grants=await Promise.all(returned.map(r=>f.identity.redeemReturn({ticket:r.ticket,returnVerifier:r.returnVerifier,enrollment})));
  assert.equal(new Set(grants.map(g=>g.principal.sessionId)).size,2);
  for(const grant of grants){assert.equal(grant.principal.deviceId,first.principal.deviceId);assert.equal(grant.enrollmentCredential,undefined);assert.ok(await f.identity.authenticate(grant.handle));}
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM devices')).rows[0].n,1);
 }finally{await f.close();}
});
