import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
test('expired_idle_refused expired_absolute_refused', async () => {
 const f=await identityFixture(); try {
  const grant=await f.login(); f.advance(24*3600000); assert.equal(await f.identity.authenticate(grant.handle),null);
  const other=await f.login(); for(let i=0;i<30;i++){ f.advance(23*3600000); if(i<29) assert.ok(await f.identity.authenticate(other.handle)); }
  assert.ok(await f.identity.authenticate(other.handle));
  f.advance(20*3600000); assert.ok(await f.identity.authenticate(other.handle));
  f.advance(10*3600000); assert.equal(await f.identity.authenticate(other.handle),null);
 } finally { await f.close(); }
});
test('provider_logout_retry_explicit_bounded_without_local_reauthorization',async()=>{
 const f=await identityFixture();try{
  const grant=await f.login(),result=await f.identity.logout(grant.principal);
  const ticket=new URL(result.browserLogoutUrl!).searchParams.get('ticket')!;
  const original=f.oidc.revokeAndLogout;let calls=0;
  f.oidc.revokeAndLogout=async()=>{calls++;throw new Error('synthetic-outage');};
  await assert.rejects(f.identity.beginProviderLogout(ticket),{message:'logout_refused'});
  assert.equal(await f.identity.authenticate(grant.handle),null);
  f.oidc.revokeAndLogout=original;
  assert.ok(await f.identity.beginProviderLogout(ticket));
  await assert.rejects(f.identity.beginProviderLogout(ticket),{message:'logout_refused'});
  const second=await f.login(),secondLogout=await f.identity.logout(second.principal),secondTicket=new URL(secondLogout.browserLogoutUrl!).searchParams.get('ticket')!;
  f.oidc.revokeAndLogout=async()=>{calls++;throw new Error('synthetic-outage');};
  for(let i=0;i<4;i++) await assert.rejects(f.identity.beginProviderLogout(secondTicket),{message:'logout_refused'});
  assert.equal(calls,4); // first outage plus exactly three attempts for the second ticket
 }finally{await f.close();}
});
test('provider_outage_leaves_local_revoked logout_all_is_account_scoped', async () => {
 const f=await identityFixture(); try {
  const a=await f.login(), b=await f.login(); f.setSubject('other-account'); const other=await f.login(); f.failProvider();
  const result=await f.identity.logout(a.principal); assert.equal(result.local,'revoked'); assert.equal(result.provider,'pending');
  assert.equal(await f.identity.authenticate(a.handle),null); assert.ok(await f.identity.authenticate(b.handle));
  await f.identity.logoutAll(b.principal); assert.equal(await f.identity.authenticate(b.handle),null); assert.ok(await f.identity.authenticate(other.handle));
  await assert.rejects(f.identity.logout(other.principal && {...other.principal,accountId:a.principal.accountId}),{message:'unauthorized'});
 } finally { await f.close(); }
});
test('logout_ticket_replay_refused forged_logout_callback_refused browser_logout_pending_until_callback', async () => {
 const f=await identityFixture(); try {
  const a=await f.login(), result=await f.identity.logout(a.principal); assert.equal(result.provider,'pending');
  const ticket=new URL(result.browserLogoutUrl!).searchParams.get('ticket')!;
  assert.equal(result.browserLogoutUrl!.includes('synthetic-id-sensitive'),false);
  await assert.rejects(f.identity.finishProviderLogout('forged'),{message:'logout_refused'});
  const redirect=await f.identity.beginProviderLogout(ticket); const state=new URL(redirect).searchParams.get('state')!;
  await assert.rejects(f.identity.beginProviderLogout(ticket),{message:'logout_refused'});
  assert.equal((await f.pool.query('SELECT provider_logout FROM identity_sessions')).rows[0].provider_logout,'pending');
  await f.identity.finishProviderLogout(state);
  assert.equal((await f.pool.query('SELECT provider_logout FROM identity_sessions')).rows[0].provider_logout,'complete');
  await assert.rejects(f.identity.finishProviderLogout(state),{message:'logout_refused'});
 } finally { await f.close(); }
});
test('database_unavailable_refuses_auth', async () => {
 const f=await identityFixture(); try { const a=await f.login(); await f.db.destroy(); assert.equal(await f.identity.authenticate(a.handle),null); } finally { await f.close(); }
});
