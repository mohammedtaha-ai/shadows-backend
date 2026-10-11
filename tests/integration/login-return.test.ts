import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
import { hash } from '../../src/modules/identity/index.js';
import { TokenVault } from '../../src/modules/identity/token-vault.js';

test('valid_login_maps_issuer_subject same_email_does_not_merge', async () => {
 const f = await identityFixture(); try {
  const a = await f.login(), b = await f.login(); assert.equal(a.principal.accountId,b.principal.accountId); assert.notEqual(a.principal.deviceId,b.principal.deviceId);
  f.setSubject('different-subject-same-email'); const c = await f.login(); assert.notEqual(c.principal.accountId,a.principal.accountId);
  assert.deepEqual(await f.identity.authenticate(a.handle),a.principal);
  const dump = JSON.stringify((await f.pool.query('SELECT * FROM identity_sessions')).rows);
  for(const secret of [a.handle,'synthetic-refresh-sensitive','synthetic-id-sensitive']) assert.equal(dump.includes(secret),false);
 } finally { await f.close(); }
});
test('wrong_state_before_exchange parallel_callback_one_claim reused_code_refused', async () => {
 const f = await identityFixture(); try {
  const p = await f.pending(), wrong = new URL(p.callback); wrong.searchParams.set('state','unknown');
  await assert.rejects(f.identity.finishLogin(wrong),{message:'login_refused'}); assert.equal(f.exchanges,0);
  const outcomes = await Promise.allSettled([f.identity.finishLogin(p.callback),f.identity.finishLogin(p.callback)]);
  assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1); assert.equal(f.exchanges,1);
  await assert.rejects(f.identity.finishLogin(p.callback),{message:'login_refused'});
 } finally { await f.close(); }
});
test('expired_attempt_refused foreign_return_uri_refused', async () => {
 const f = await identityFixture(); try {
  for(const returnUri of ['http://evil.invalid:49152/oidc-return','http://127.0.0.1/oidc-return','http://127.0.0.1:49152/wrong','http://127.0.0.1:49152/oidc-return#fragment','http://user@127.0.0.1:49152/oidc-return','http://127.0.0.1:49152/oidc-return?x=1','http://localhost:49152/oidc-return'])
   await assert.rejects(f.identity.beginLogin({platform:'windows',returnUri,returnChallenge:hash(f.verifier())}),{message:'login_refused'});
  const p = await f.pending(); f.advance(300000); await assert.rejects(f.identity.finishLogin(p.callback),{message:'login_refused'}); assert.equal(f.exchanges,0);
 } finally { await f.close(); }
});
test('wrong_return_challenge_refused parallel_ticket_one_session expired_ticket_refused', async () => {
 const f = await identityFixture(); try {
  const p = await f.pending(), r = await f.identity.finishLogin(p.callback);
  await assert.rejects(f.identity.redeemReturn({ticket:r.ticket,returnVerifier:f.verifier()}),{message:'return_refused'});
  const result = await Promise.allSettled([f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier}),f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier})]);
  assert.equal(result.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_sessions')).rows[0].n,1);
  const next = await f.pending(), expired = await f.identity.finishLogin(next.callback); f.advance(60000);
  await assert.rejects(f.identity.redeemReturn({ticket:expired.ticket,returnVerifier:next.returnVerifier}),{message:'return_refused'});
 } finally { await f.close(); }
});
test('failed_session_transaction_does_not_consume_ticket', async () => {
 const f = await identityFixture(); try {
  const p = await f.pending(), r = await f.identity.finishLogin(p.callback);
  await f.pool.query("CREATE FUNCTION fail_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END $$");
  await f.pool.query('CREATE TRIGGER fail_session BEFORE INSERT ON identity_sessions FOR EACH ROW EXECUTE FUNCTION fail_session()');
  await assert.rejects(f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier}),{message:'return_refused'});
  assert.equal((await f.pool.query('SELECT consumed_at FROM identity_return_tickets')).rows[0].consumed_at,null);
  assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM devices')).rows[0].n,0);
  await f.pool.query('DROP TRIGGER fail_session ON identity_sessions');
  assert.ok(await f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier}));
 } finally { await f.close(); }
});
test('key_tamper_refused purpose_record_key_binding', async () => {
 const f = await identityFixture(); try {
  const vault = new TokenVault(f.config.encryptionKey,f.config.encryptionKeyId);
  const sealed = await vault.seal('synthetic-secret','purpose:record'); assert.equal(await vault.open(sealed,'purpose:record'),'synthetic-secret');
  await assert.rejects(vault.open(sealed,'purpose:other'),{message:'vault_refused'});
  await assert.rejects(vault.open({...sealed,keyId:'wrong'},'purpose:record'),{message:'vault_refused'});
  const bytes=Buffer.from(sealed.ciphertext,'base64url'); bytes[bytes.length-1]=bytes[bytes.length-1]!^1;
  await assert.rejects(vault.open({...sealed,ciphertext:bytes.toString('base64url')},'purpose:record'),{message:'vault_refused'});
 } finally { await f.close(); }
});
