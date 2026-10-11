import { test } from 'node:test';
import assert from 'node:assert/strict';
import createClient from 'openapi-fetch';
import type { paths } from '../../api/auth-v1.js';
import { identityFixture } from './fixtures/identity.js';
import { compose } from '../../src/app/compose.js';
import { hash } from '../../src/modules/identity/index.js';
import { output, Principal } from '../../src/transports/http/auth-schema.js';
test('auth_wire rejects_extra_fields_bounds validates_output native_consumer', async () => {
 const f=await identityFixture();const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try {
  await app.start(); const address=app.server.server.address();assert.ok(address && typeof address!=='string');
  const client=createClient<paths>({baseUrl:`http://127.0.0.1:${address.port}`});
  const verifier=f.verifier(), input={platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(verifier)};
  for(const invalid of [{...input,accountId:'substitution'},{...input,platform:'android'},{...input,returnChallenge:'short'},{...input,returnUri:123}]) {
   const response=await app.server.inject({method:'POST',url:'/v1/auth/login',payload:invalid}); assert.equal(response.statusCode,400); assert.deepEqual(response.json(),{code:'request_invalid'});
  }
  const start=await app.server.inject({method:'POST',url:'/v1/auth/login',payload:input});assert.equal(start.statusCode,200);
  const state=new URL(start.json().authorizationUrl).searchParams.get('state');
  const returned=await app.server.inject(`/v1/auth/callback?state=${state}&code=synthetic-code`);assert.equal(returned.statusCode,302);
  assert.equal(returned.headers['cache-control'],'no-store');assert.equal(returned.headers['referrer-policy'],'no-referrer');
  const ticket=new URL(returned.headers.location!).searchParams.get('ticket');
  const grant=await app.server.inject({method:'POST',url:'/v1/auth/return',payload:{ticket,returnVerifier:verifier}}); assert.equal(grant.statusCode,200);
  const {handle,principal}=grant.json();
  const read=await client.GET('/v1/auth/session',{headers:{authorization:`Bearer ${handle}`}});assert.deepEqual(read.data,principal);
  const wrong=await app.server.inject({url:'/v1/auth/session',headers:{authorization:'Bearer malformed'}});assert.equal(wrong.statusCode,401);
  const logout=await app.server.inject({method:'POST',url:'/v1/auth/logout',headers:{authorization:`Bearer ${handle}`},payload:{}});assert.equal(logout.statusCode,200);
  assert.equal((await app.server.inject({url:'/v1/auth/session',headers:{authorization:`Bearer ${handle}`}})).statusCode,401);
  assert.throws(()=>output(Principal,{...principal,unexpected:true}),{message:'output_invalid'});
 } finally {await app.stop();await f.close();}
});
test('auth_wire rate_limits_without_sensitive_diagnostics', async () => {
 const f=await identityFixture();const app=await compose(f.config,{oidc:f.oidc});
 try {
  const input={platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(f.verifier())};
  for(let i=0;i<10;i++) assert.equal((await app.server.inject({method:'POST',url:'/v1/auth/login',payload:input})).statusCode,200);
  const denied=await app.server.inject({method:'POST',url:'/v1/auth/login',payload:input});assert.equal(denied.statusCode,429);assert.deepEqual(denied.json(),{code:'rate_limited'});
  const bad=await app.server.inject('/v1/auth/callback?state=synthetic-sensitive-state&code=synthetic-sensitive-code');
  assert.equal(bad.statusCode,400);assert.equal(bad.body.includes('synthetic-sensitive'),false);
  const oversized=await app.server.inject({method:'POST',url:'/v1/auth/login',headers:{'content-type':'application/json'},payload:JSON.stringify({...input,unexpected:'x'.repeat(9000)})});
  assert.equal(oversized.statusCode,413);assert.deepEqual(oversized.json(),{code:'request_invalid'});
  let captured='';const stdout=process.stdout.write,stderr=process.stderr.write;
  process.stdout.write=(chunk:Uint8Array|string)=>{captured+=chunk.toString();return true;};
  process.stderr.write=(chunk:Uint8Array|string)=>{captured+=chunk.toString();return true;};
  try {app.server.log.info('synthetic-sensitive-log-fixture');await app.server.inject('/v1/auth/callback?state=synthetic-sensitive-state&code=synthetic-sensitive-code');}
  finally {process.stdout.write=stdout;process.stderr.write=stderr;}
  assert.equal(captured,'');
 } finally {await app.stop();await f.close();}
});
test('backchannel_standard_form_transport_and_duplicate_field_refusal',async()=>{
 const f=await identityFixture();const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  const grant=await f.login();
  const duplicated=await app.server.inject({method:'POST',url:'/v1/auth/backchannel-logout',headers:{'content-type':'application/x-www-form-urlencoded'},payload:'logout_token=verified&logout_token=other'});
  assert.equal(duplicated.statusCode,400);assert.ok(await f.identity.authenticate(grant.handle));
  const logout=await app.server.inject({method:'POST',url:'/v1/auth/backchannel-logout',headers:{'content-type':'application/x-www-form-urlencoded'},payload:new URLSearchParams({logout_token:'port-fixture-verified'}).toString()});
  assert.equal(logout.statusCode,200);assert.equal(await f.identity.authenticate(grant.handle),null);
 }finally{await app.stop();await f.close();}
});
