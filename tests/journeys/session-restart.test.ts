import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from '../integration/fixtures/identity.js';
import { restartSession,restartPending } from '../integration/fixtures/restart.js';
test('session_survives_fresh_backend_process revocation_survives_fresh_process',async()=>{
 const f=await identityFixture();try {
  const grant=await f.login();const restarted=await restartSession(f.config,grant.handle,false,true);
  assert.equal(restarted.status,200);assert.deepEqual(restarted.principal,grant.principal);
  assert.equal((await restartSession(f.config,grant.handle,true,true)).status,200);
  assert.equal((await restartSession(f.config,grant.handle,false,true)).status,401);
  assert.equal(await f.identity.authenticate(grant.handle),null);
 }finally{await f.close();}
});

test('restart_pending_attempt_uses_recorded_binding',async()=>{
 const f=await identityFixture();try{
  const pending=await f.pending();assert.equal((await restartPending(f.config,pending)).status,200);
  const row=(await f.pool.query('SELECT claimed_at,binding_ciphertext FROM identity_login_attempts')).rows[0];assert.ok(row.claimed_at);
  assert.equal(row.binding_ciphertext.includes(new URL(pending.start.authorizationUrl).searchParams.get('nonce')!),false);
  await assert.rejects(restartPending(f.config,pending),{message:'restart_child_failed'});
 }finally{await f.close();}
});
