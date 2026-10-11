// Actual Compose journey. Credentials remain in memory/files; report only safe counts/status.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import pg from 'pg';
import { decodeJwt } from 'jose';
import { localEnvironment } from './runtime.js';
import { hash,type SessionGrant } from '../src/modules/identity/index.js';
import { TokenVault } from '../src/modules/identity/token-vault.js';
const origin='https://127.0.0.1:8443',root=process.env.LOCAL_RUNTIME ?? '/local';
const env=await localEnvironment(),pool=new pg.Pool({connectionString:env.DATABASE_URL});
const secret=async(name:string)=>(await readFile(root+'/secrets/'+name,'utf8')).trim();
const cookies=new Map<string,string>();
const results:Record<string,unknown>={};
async function request(url:string,options:RequestInit={}) {
 const target=new URL(url,origin);assert.equal(target.origin,origin);
 const r=await fetch(target,{...options,redirect:'manual',signal:AbortSignal.timeout(15000),headers:{...options.headers,cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')}});
 for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0]!,i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}return r;
}
async function post(path:string,body:unknown,handle?:string){return request(path,{method:'POST',headers:{'content-type':'application/json',...(handle?{authorization:`Bearer ${handle}`}:{})},body:JSON.stringify(body)});}
async function session(grant:SessionGrant){return (await request('/v1/auth/session',{headers:{authorization:`Bearer ${grant.handle}`}})).status;}
async function login(enrollment:unknown) {
 cookies.clear();const verifier=randomBytes(32).toString('base64url');
 const start=await post('/v1/auth/login',{platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(verifier)});
 assert.equal(start.status,200);let url=(await start.json() as {authorizationUrl:string}).authorizationUrl;
 let ticket:string|undefined;
 for(let i=0;i<20;i++){
  const r=await request(url),location=r.headers.get('location');
  if(location){const target=new URL(location,url);if(target.origin==='http://127.0.0.1:49152'){ticket=target.searchParams.get('ticket')!;break;}url=target.href;continue;}
  const html=await r.text(),action=/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/.exec(html)?.[1] ?? /<form[^>]*action="([^"]+)"[^>]*id="kc-form-login"/.exec(html)?.[1];
  assert.ok(action,'expected_synthetic_login_form');
  const submitted=await request(new URL(action.replaceAll('&amp;','&'),url).href,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'synthetic-user',password:await secret('user-password'),credentialId:''})});
  const next=submitted.headers.get('location');assert.ok(next,'synthetic_login_redirect');url=new URL(next,url).href;
 }
 assert.ok(ticket,'bounded_native_return');const body={ticket,returnVerifier:verifier,enrollment};
 const response=await post('/v1/auth/return',body);assert.equal(response.status,200);
 assert.equal((await post('/v1/auth/return',body)).status,400);
 return await response.json() as SessionGrant & {enrollmentCredential?:string};
}
async function adminToken(){
 const r=await request('/realms/master/protocol/openid-connect/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',username:'local-admin',password:await secret('admin-password')})});
 assert.equal(r.status,200);return (await r.json() as {access_token:string}).access_token;
}
async function admin(path:string,method='GET',body?:unknown){const token=await adminToken();return request('/admin/realms/shadows-local'+path,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function eventCount(){return (await pool.query('SELECT count(*)::int n FROM identity_logout_events')).rows[0].n as number;}
async function refreshExpiry(grant:SessionGrant){
 const row=(await pool.query('SELECT tokens_ciphertext,tokens_key_id FROM identity_sessions WHERE id=$1',[grant.principal.sessionId])).rows[0];
 const vault=new TokenVault(Buffer.from(env.TOKEN_ENCRYPTION_KEY,'base64'),env.TOKEN_ENCRYPTION_KEY_ID);
 const tokens=JSON.parse(await vault.open({ciphertext:row.tokens_ciphertext,keyId:row.tokens_key_id},'session:'+grant.principal.sessionId));
 return decodeJwt(tokens.refreshToken).exp;
}
try {
 if(process.argv[2]==='restart-before') {
  const grant=await login({mode:'new'});await writeFile('/workspace/.test-runtime/stack-restart.json',JSON.stringify(grant),{mode:0o600});console.log('Compose restart credential persisted in ignored test file.');
 }else if(process.argv[2]==='restart-after') {
  const grant=JSON.parse(await readFile('/workspace/.test-runtime/stack-restart.json','utf8')) as SessionGrant & {enrollmentCredential:string};
  assert.equal(await session(grant),200);const next=await login({mode:'reuse',credential:grant.enrollmentCredential});assert.equal(next.principal.deviceId,grant.principal.deviceId);console.log('Compose backend restart/session/enrollment persistence: PASS');
 }else {
  const invalid=await post('/v1/auth/login',{platform:'unsupported'});assert.equal(invalid.status,400);assert.deepEqual(await invalid.json(),{code:'request_invalid'});
  const oversized=await post('/v1/auth/login',{extra:'x'.repeat(9000)});assert.equal(oversized.status,413);assert.deepEqual(await oversized.json(),{code:'request_invalid'});
  results.actualIngressTypedRefusals='PASS';
  const first=await login({mode:'new'});const firstCookies=new Map(cookies);assert.ok(first.enrollmentCredential);assert.equal(await session(first),200);
  const expiryBefore=await refreshExpiry(first);assert.equal(typeof expiryBefore,'number');
  await new Promise(r=>setTimeout(r,1100));
  await pool.query("UPDATE identity_sessions SET provider_refreshed_at=now()-interval '61 seconds' WHERE id=$1",[first.principal.sessionId]);
  assert.equal(await session(first),200);const expiryAfter=await refreshExpiry(first);assert.equal(typeof expiryAfter,'number');
  assert.ok(expiryAfter!>expiryBefore!,'actual_provider_refresh_extends_expiry');results.providerRenewal='PASS';results.providerRefreshExpiryExtendedSeconds=expiryAfter!-expiryBefore!;
  const second=await login({mode:'reuse',credential:first.enrollmentCredential});assert.equal(second.principal.deviceId,first.principal.deviceId);
  const third=await login({mode:'new'});assert.notEqual(third.principal.deviceId,first.principal.deviceId);results.confidentialLoginRedemptionEnrollment='PASS';
  const logout=await post('/v1/auth/logout',{},first.handle);assert.equal(logout.status,200);const info=await logout.json() as {local:string;provider:string;browserLogoutUrl:string};
  assert.equal(info.local,'revoked');assert.equal(info.provider,'pending');assert.equal(await session(first),401);assert.equal(await session(second),200);
  cookies.clear();for(const [key,value] of firstCookies)cookies.set(key,value);
  let url=info.browserLogoutUrl;
  for(let i=0;i<15;i++){const r=await request(url),next=r.headers.get('location');if(!next){assert.equal(new URL(url).pathname,'/v1/auth/logout-callback');assert.equal(r.status,200);break;}url=new URL(next,url).href;if(i===14)assert.fail('bounded_provider_logout');}
  const state=await pool.query('SELECT provider_logout FROM identity_sessions WHERE id=$1',[first.principal.sessionId]);assert.equal(state.rows[0].provider_logout,'complete');results.currentAndProviderLogout='PASS';
  // New sessions here avoid interference from the provider session that was just ended.
  const active=await login({mode:'reuse',credential:first.enrollmentCredential}),other=await login({mode:'new'});
  const all=await post('/v1/auth/logout-all',{},active.handle);assert.equal(all.status,200);assert.equal(await session(active),401);assert.equal(await session(other),401);results.accountWideLocalLogout='PASS';
  const revokeA=await login({mode:'reuse',credential:first.enrollmentCredential}),revokeB=await login({mode:'reuse',credential:first.enrollmentCredential}),survivor=await login({mode:'new'});
  const revoked=await request('/v1/devices/'+revokeA.principal.deviceId,{method:'DELETE',headers:{authorization:`Bearer ${survivor.handle}`}});assert.equal(revoked.status,200);
  assert.equal(await session(revokeA),401);assert.equal(await session(revokeB),401);assert.equal(await session(survivor),200);results.deviceRevocation='PASS';
  const users=await admin('/users?username=synthetic-user&exact=true');assert.equal(users.status,200);const user=(await users.json() as {id:string;enabled:boolean}[])[0]!;
  const before=await eventCount(),delivered=await admin('/users/'+user.id+'/logout','POST');assert.equal(delivered.status,204);
  const until=Date.now()+15000;while(await eventCount()===before&&Date.now()<until)await new Promise(r=>setTimeout(r,100));
  assert.ok(await eventCount()>before,'provider_originated_backchannel_event_persisted');
  const row=await pool.query('SELECT revoked_at FROM identity_sessions WHERE id=$1',[survivor.principal.sessionId]);assert.ok(row.rows[0].revoked_at);assert.equal(await session(survivor),401);results.actualKeycloakBackchannel='PASS';
  const disabledGrant=await login({mode:'new'}),disableBefore=await eventCount();
  assert.equal((await admin('/users/'+user.id,'PUT',{enabled:false})).status,204);
  try {
   const started=Date.now();results.disableBackendStatus=await session(disabledGrant);results.disableCheckMilliseconds=Date.now()-started;
   results.disableEmittedBackchannel=(await eventCount())>disableBefore;
   assert.equal(results.disableBackendStatus,401,'disabled_provider_account_must_refuse_backend');
  }finally{assert.equal((await admin('/users/'+user.id,'PUT',{enabled:true})).status,204);await admin('/users/'+user.id+'/logout','POST');}
  results.result='PASS';await writeFile('/workspace/.test-runtime/stack-results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
 }
}catch(e){console.error(JSON.stringify({result:'FAIL',step:e instanceof assert.AssertionError?e.message:'stack_operation_failed',...results}));process.exitCode=1;}
finally{await pool.end();}
