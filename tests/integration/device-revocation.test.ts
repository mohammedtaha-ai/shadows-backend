import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import { identityFixture } from './fixtures/identity.js';
import { hash } from '../../src/modules/identity/index.js';
import { TokenVault } from '../../src/modules/identity/token-vault.js';
test('revoked_device_denies_all_its_sessions other_device_survives foreign_account_revoke_refused', async () => {
 const f=await identityFixture(); try {
  const a=await f.login(), b=await f.login(); f.setSubject('foreign'); const foreign=await f.login();
  const secondId=randomUUID(),secondHandle=randomBytes(32).toString('base64url');
  const vault=new TokenVault(f.config.encryptionKey,f.config.encryptionKeyId),sealed=await vault.seal(JSON.stringify({refreshToken:'synthetic-refresh',idToken:'synthetic-id'}),'session:'+secondId);
  await f.pool.query('INSERT INTO identity_sessions(id,handle_hash,account_id,device_id,provider_sid,tokens_ciphertext,tokens_key_id,last_active_at,absolute_expires_at) SELECT $1,$2,account_id,device_id,provider_sid,$3,$4,last_active_at,absolute_expires_at FROM identity_sessions WHERE id=$5',[secondId,hash(secondHandle),sealed.ciphertext,sealed.keyId,a.principal.sessionId]);
  assert.ok(await f.identity.authenticate(secondHandle));
  await assert.rejects(f.devices.revoke(foreign.principal,a.principal.deviceId),{message:'device_refused'});
  await f.devices.revoke(b.principal,a.principal.deviceId); assert.equal(await f.identity.authenticate(a.handle),null); assert.ok(await f.identity.authenticate(b.handle));
  assert.equal(await f.identity.authenticate(secondHandle),null);
  assert.deepEqual((await f.devices.list(b.principal)).map((d: {revoked: boolean})=>d.revoked).sort(),[false,true]);
  const c=await f.login(); assert.notEqual(c.principal.deviceId,a.principal.deviceId);
 } finally { await f.close(); }
});
test('device_revoke_rolls_back_atomically', async () => {
 const f=await identityFixture(); try {
  const a=await f.login(), b=await f.login();
  await f.pool.query("CREATE FUNCTION fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END $$");
  await f.pool.query('CREATE TRIGGER fail_audit BEFORE INSERT ON identity_audit_events FOR EACH ROW EXECUTE FUNCTION fail_audit()');
  await assert.rejects(f.devices.revoke(b.principal,a.principal.deviceId),{message:'device_refused'});
  assert.ok(await f.identity.authenticate(a.handle)); assert.equal((await f.pool.query('SELECT revoked_at FROM devices WHERE id=$1',[a.principal.deviceId])).rows[0].revoked_at,null);
 } finally { await f.close(); }
});
