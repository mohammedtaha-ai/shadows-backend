import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { keycloakFixture } from '../integration/fixtures/keycloak.js';
import { postgresFixture,freePort } from '../integration/fixtures/postgres.js';
import { tlsFixture } from '../integration/fixtures/tls.js';
import { configEnv } from '../integration/fixtures/config.js';
import { restartSession } from '../integration/fixtures/restart.js';
import { runMigrations } from '../../src/platform/database/migrate.js';
import { readConfig } from '../../src/app/config.js';
import { compose } from '../../src/app/compose.js';
import { createOidcClient,OidcRefusal } from '../../src/modules/identity/oidc-client.js';
import { hash } from '../../src/modules/identity/index.js';

test('Keycloak_26_8 confidential_HTTPS backend_routes one_use_return restart logout typed_refusals', {timeout:180000}, async()=>{
 const db=await postgresFixture(),tls=await tlsFixture(),port=await freePort();
 const origin=`https://127.0.0.1:${port}`,callback=origin+'/v1/auth/callback',logoutCallback=origin+'/v1/auth/logout-callback';
 let kc:Awaited<ReturnType<typeof keycloakFixture>>|undefined,app:Awaited<ReturnType<typeof compose>>|undefined;
 try {
  await runMigrations(db.connection,'up');kc=await keycloakFixture(callback,logoutCallback);
  const config=readConfig({...configEnv(db.url),OIDC_ISSUER:kc.issuer,OIDC_CLIENT_SECRET:kc.clientSecret,OIDC_CALLBACK_URL:callback,OIDC_LOGOUT_CALLBACK_URL:logoutCallback,PORT:String(port)});
  app=await compose(config,{tls:{key:tls.key,cert:tls.cert}});await app.start();
  const request=(path:string,options:RequestInit={})=>fetch(origin+path,{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});
  const verifier=randomBytes(32).toString('base64url');
  const start=await request('/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(verifier)})});
  assert.equal(start.status,200);const login=await start.json() as {authorizationUrl:string};
  const providerCallback=await kc.authorize(login.authorizationUrl);
  const returned=await request(providerCallback.pathname+providerCallback.search);assert.equal(returned.status,302);
  const nativeReturn=new URL(returned.headers.get('location')!);assert.equal(nativeReturn.origin,'http://127.0.0.1:49152');
  assert.equal(nativeReturn.searchParams.has('id_token'),false);const ticket=nativeReturn.searchParams.get('ticket');
  const redeem=()=>request('/v1/auth/return',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ticket,returnVerifier:verifier,enrollment:{mode:'new'}})});
  const response=await redeem();assert.equal(response.status,200);const grant=await response.json() as {handle:string;principal:{accountId:string;deviceId:string;sessionId:string}};
  assert.equal((await redeem()).status,400);assert.equal((await request(providerCallback.pathname+providerCallback.search)).status,400);
  await app.stop();app=undefined;const restarted=await restartSession(config,grant.handle);assert.equal(restarted.providerProbe,'200');assert.equal(restarted.status,200);assert.deepEqual(restarted.principal,grant.principal);
  app=await compose(config,{tls:{key:tls.key,cert:tls.cert}});await app.start();
  const headers={'content-type':'application/json',authorization:`Bearer ${grant.handle}`};
  const logout=await request('/v1/auth/logout',{method:'POST',headers,body:'{}'});assert.equal(logout.status,200);
  const result=await logout.json() as {local:string;provider:string;browserLogoutUrl:string};assert.equal(result.local,'revoked');assert.equal(result.provider,'pending');
  assert.equal((await request('/v1/auth/session',{headers})).status,401);
  let redirect=new URL(result.browserLogoutUrl);
  for(let i=0;i<10;i++){
   const browser=await kc.request(redirect);const next=browser.headers.get('location');
   if(!next){assert.equal(redirect.pathname,'/v1/auth/logout-callback');assert.equal(browser.status,200);break;}
   redirect=new URL(next,redirect);if(i===9) assert.fail('bounded_browser_logout');
  }
  assert.equal((await db.pool.query('SELECT provider_logout FROM identity_sessions')).rows[0].provider_logout,'complete');
  assert.equal((await request(new URL(result.browserLogoutUrl).pathname+new URL(result.browserLogoutUrl).search)).status,400);
  // Direct adapter cases use fresh confidential flows so protocol refusal cannot be mistaken for a network failure.
  const adapter=createOidcClient(config);
  for(const kind of ['state','pkce','nonce','replay']) {
   const binding={state:randomBytes(32).toString('base64url'),nonce:randomBytes(32).toString('base64url'),verifier:randomBytes(32).toString('base64url')};
   const callbackUrl=await kc.authorize(await adapter.authorizationUrl(binding));
   if(kind==='replay') await adapter.exchange(callbackUrl,binding);
   const altered={...binding,...(kind==='state'?{state:'wrong'}:kind==='pkce'?{verifier:randomBytes(32).toString('base64url')}:kind==='nonce'?{nonce:'wrong'}:{})};
   await assert.rejects(adapter.exchange(callbackUrl,altered),(error:unknown)=>{
    assert.ok(error instanceof OidcRefusal);
    assert.equal(error.code,kind==='state'?'OAUTH_INVALID_RESPONSE':kind==='nonce'?'OAUTH_JWT_CLAIM_COMPARISON_FAILED':'OAUTH_RESPONSE_BODY_ERROR');
    if(kind==='pkce'||kind==='replay') assert.equal(error.providerError,'invalid_grant');return true;
   });
  }
 } finally {await app?.stop();await kc?.close();await tls.close();await db.close();}
});
