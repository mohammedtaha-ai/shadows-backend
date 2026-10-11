import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
test('backchannel_logout_blocks_pending_return_session_resurrection',async()=>{
 const f=await identityFixture();try{
  const p=await f.pending(),r=await f.identity.finishLogin(p.callback);
  await f.identity.backchannelLogout('verified-port-fixture');
  await assert.rejects(f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier,enrollment:{mode:'new'}}),{message:'return_refused'});
  assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_sessions')).rows[0].n,0);
 }finally{await f.close();}
});
test('concurrent_device_revoke_authorization_is_denied_after_commit',async()=>{
 const f=await identityFixture();try{
  const a=await f.login(),b=await f.login();
  await Promise.all([f.identity.authenticate(a.handle),f.devices.revoke(b.principal,a.principal.deviceId)]);
  assert.equal(await f.identity.authenticate(a.handle),null);
 }finally{await f.close();}
});
