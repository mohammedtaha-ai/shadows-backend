import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
test('signed_logout_revokes_matching_sid logout_jti_replay_no_second_effect', async () => {
 const f=await identityFixture(); try {
  const a=await f.login(); f.setSubject('other'); const b=await f.login(); f.setSubject('subject-one');
  await f.identity.backchannelLogout('port-fixture-verified'); assert.equal(await f.identity.authenticate(a.handle),null); assert.ok(await f.identity.authenticate(b.handle));
  await f.identity.backchannelLogout('port-fixture-verified'); assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_logout_events')).rows[0].n,1);
 } finally { await f.close(); }
});
