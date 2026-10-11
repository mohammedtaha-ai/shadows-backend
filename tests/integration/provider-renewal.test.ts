import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
import { TokenVault } from '../../src/modules/identity/token-vault.js';
test('active_session_renews_provider_tokens_atomically_without_extending_absolute_expiry',async()=>{
 const f=await identityFixture();
 try {
  const grant=await f.login();let refreshes=0;
  Object.assign(f.oidc,{refreshSession:async()=>{refreshes++;return {refreshToken:'synthetic-renewed-refresh',idToken:'synthetic-renewed-id'};}});
  f.advance(61000);assert.ok(await f.identity.authenticate(grant.handle));assert.equal(refreshes,1);
  const row=(await f.pool.query('SELECT * FROM identity_sessions WHERE id=$1',[grant.principal.sessionId])).rows[0];
  const vault=new TokenVault(f.config.encryptionKey,f.config.encryptionKeyId);
  const tokens=JSON.parse(await vault.open({ciphertext:row.tokens_ciphertext,keyId:row.tokens_key_id},'session:'+row.id));
  assert.equal(tokens.refreshToken,'synthetic-renewed-refresh');assert.equal(row.absolute_expires_at.toISOString(),grant.expiresAt);
  assert.ok(await f.identity.authenticate(grant.handle));assert.equal(refreshes,1);
  f.advance(61000);Object.assign(f.oidc,{refreshSession:async()=>{throw new Error('synthetic-unavailable');}});
  assert.equal(await f.identity.authenticate(grant.handle),null);
  const after=(await f.pool.query('SELECT tokens_ciphertext,provider_refreshed_at FROM identity_sessions WHERE id=$1',[row.id])).rows[0];
  assert.equal(after.tokens_ciphertext,row.tokens_ciphertext);assert.equal(after.provider_refreshed_at.toISOString(),row.provider_refreshed_at.toISOString());
 }finally{await f.close();}
});
