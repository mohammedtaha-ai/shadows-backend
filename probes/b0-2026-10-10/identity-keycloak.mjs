// NON-PRODUCT B0. Real maintained Keycloak server, synthetic account only.
// HTTP form driver and Node loopback listener do NOT prove Tauri/system-browser integration.
import * as oidc from 'openid-client';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const exec = promisify(execFile);
const cloud = process.argv.includes('--cloud');
const refusalsOnly = process.argv.includes('--refusals-only');
const output = cloud ? `followup-artifacts/identity-keycloak-cloud${refusalsOnly ? '-refusals' : ''}-results.json` : 'followup-artifacts/identity-keycloak-results.json';
const run = (command, args, options) => exec(command, cloud && command === 'docker' ? ['--host=unix:///var/run/docker.sock', ...args] : args, options);
const results = [], origin = 'http://127.0.0.1:45901';
const issuer = `${origin}/realms/b0-followup`, callback = 'http://127.0.0.1:45903/return';
const image = 'quay.io/keycloak/keycloak:26.8.0', name = `b0-identity-${randomUUID().slice(0, 8)}`;
const label = 'shadows.b0.followup=2026-10-11';
const base = fileURLToPath(new URL('.', import.meta.url)); assert.equal(resolve('.'), resolve(base));
const runtime = resolve(base, '.identity-runtime');
assert.ok(runtime.startsWith(resolve(base)+sep),'cleanup stays inside this dedicated probe directory');
let startedContainer = false, stage='image-preflight', listener, config, attemptedReturns = new Map();
const password = randomUUID(), cookies = new Map();
async function test(name, fn) {
 const start = Date.now(); try { const observed = await fn(); results.push({ name, status: 'PASS', elapsedMs: Date.now()-start, observed }); }
 catch (e) { results.push({ name, status: 'FAIL', elapsedMs: Date.now()-start, errorType: e.name, errorCode: e.code ?? null }); process.exitCode=1; }
 console.log(JSON.stringify(results.at(-1))); // no error messages, URLs, tokens or credentials
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ready() { const end=Date.now()+90000; while(Date.now()<end) { try { if((await fetch(`${issuer}/.well-known/openid-configuration`,{signal:AbortSignal.timeout(1500)})).ok) return; } catch {} await sleep(500); } throw new Error('Fixture readiness deadline'); }
function updateCookies(response) { for(const c of response.headers.getSetCookie()) { const p=c.split(';')[0], i=p.indexOf('='); cookies.set(p.slice(0,i),p.slice(i+1)); } }
const cookie = () => [...cookies].map(([k,v])=>`${k}=${v}`).join('; ');
async function request(url, options={}) {
 const u=new URL(url); assert.ok(u.origin===origin || u.origin===new URL(callback).origin);
 const r=await fetch(u,{...options,redirect:'manual',headers:{cookie:cookie(),...options.headers},signal:AbortSignal.timeout(15000)}); updateCookies(r); return r;
}
async function authorize({ silent=false }={}) {
 const verifier=oidc.randomPKCECodeVerifier(), state=oidc.randomState(), nonce=oidc.randomNonce();
 let url=oidc.buildAuthorizationUrl(config,{redirect_uri:callback,scope:'openid profile',prompt:silent?'none':'login',code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',state,nonce});
 for(let i=0;i<20;i++) {
   if(url.href.startsWith(callback)) return {url,verifier,state,nonce};
   const r=await request(url); const loc=r.headers.get('location'); if(loc) {url=new URL(loc,url);continue;}
   const html=await r.text(); const action=/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/.exec(html)?.[1] ?? /<form[^>]*action="([^"]+)"[^>]*id="kc-form-login"/.exec(html)?.[1];
   assert.ok(action,'Synthetic login form expected');
   const form=new URLSearchParams({username:'b0-user',password,credentialId:''});
   const post=await request(new URL(action.replaceAll('&amp;','&'),url),{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form});
   assert.ok(post.headers.get('location'),'Synthetic login must redirect');url=new URL(post.headers.get('location'),url);
 } throw new Error('Fixture redirect bound');
}
const exchange = (a, overrides={}) => oidc.authorizationCodeGrant(config,a.url,{pkceCodeVerifier:a.verifier,expectedState:a.state,expectedNonce:a.nonce,...overrides});
async function refusal(operation, expectedCode, providerError) {
 let caught; try { await operation(); } catch (error) { caught = error; }
 assert.ok(caught, 'Expected protocol refusal');
 assert.equal(caught.code, expectedCode, 'Network/programming failure is not protocol refusal');
 if (providerError) assert.equal(caught.error, providerError);
 return { errorType: caught.name, errorCode: caught.code, ...(providerError ? { providerError } : {}) };
}
try {
 // Require a successfully pulled pinned image; avoid an implicit unbounded third pull.
 await run('docker',['image','inspect','--format','{{.Id}}',image],{timeout:10000});
 stage='container-start';
 await mkdir(resolve(runtime,'import'),{recursive:true}); await mkdir('followup-artifacts',{recursive:true});
 await writeFile(resolve(runtime,'import','realm.json'),JSON.stringify({realm:'b0-followup',enabled:true,sslRequired:'none',accessTokenLifespan:5,ssoSessionIdleTimeout:600,ssoSessionMaxLifespan:1200,
  clients:[{clientId:'b0-native',protocol:'openid-connect',publicClient:true,standardFlowEnabled:true,directAccessGrantsEnabled:false,redirectUris:[callback],attributes:{'pkce.code.challenge.method':'S256','post.logout.redirect.uris':callback}}],
  users:[{username:'b0-user',enabled:true,emailVerified:true,email:'b0@example.invalid',firstName:'Synthetic',lastName:'Fixture',requiredActions:[],credentials:[{type:'password',value:password,temporary:false}]}]}));
 await run('docker',['run','-d','--name',name,'--label',label,'--memory','1g','--cpus','2','-p','127.0.0.1:45901:8080','--mount',`type=bind,source=${resolve(runtime,'import')},target=/opt/keycloak/data/import,readonly`,image,'start-dev','--import-realm'],{timeout:30000}); startedContainer=true;
 await ready(); config=await oidc.discovery(new URL(issuer),'b0-native',undefined,oidc.None(),{execute:[oidc.allowInsecureRequests]});
 listener=createServer(async(req,res)=>{
  try { const u=new URL(req.url,callback), a=attemptedReturns.get(u.searchParams.get('state')); if(!a || a.used || Date.now()>a.expires) {res.writeHead(400);res.end('Return refused');return;}
    a.used=true; a.resolve(u);res.end('Synthetic return received');
  } catch {res.writeHead(400);res.end('Return refused');}
 }); await new Promise(r=>listener.listen(45903,'127.0.0.1',r));
 if (!refusalsOnly) await test('actual Keycloak valid code and one-time loopback return',async()=>{
  const a=await authorize();let returned;attemptedReturns.set(a.state,{used:false,expires:Date.now()+10000,resolve:u=>returned=u});
  assert.equal((await request(a.url)).status,200);assert.ok(returned);assert.equal((await request(a.url)).status,400);
  const t=await exchange({...a,url:returned});assert.ok(t.claims().sub);return {codeExchange:true,callbackOnce:true,driver:'Node HTTP, not native browser'};
 });
 for(const kind of ['wrong-state','wrong-pkce','wrong-nonce','reused-code']) await test(`actual Keycloak ${kind} refusal`,async()=>{
  const a=await authorize();
  let observed;
  if(kind==='reused-code') {await exchange(a);observed=await refusal(()=>exchange(a),'OAUTH_RESPONSE_BODY_ERROR','invalid_grant');}
  else observed=await refusal(()=>exchange(a,kind==='wrong-state'?{expectedState:oidc.randomState()}:kind==='wrong-pkce'?{pkceCodeVerifier:oidc.randomPKCECodeVerifier()}:{expectedNonce:oidc.randomNonce()}),kind==='wrong-state'?'OAUTH_INVALID_RESPONSE':kind==='wrong-pkce'?'OAUTH_RESPONSE_BODY_ERROR':'OAUTH_JWT_CLAIM_COMPARISON_FAILED',kind==='wrong-pkce'?'invalid_grant':undefined);
  return {freshFlow:true,refused:true,...observed};
 });
 await test('actual Keycloak access expiry',async()=>{const a=await authorize(),t=await exchange(a);assert.ok(await oidc.fetchUserInfo(config,t.access_token,t.claims().sub));await sleep(6500);const observed=await refusal(()=>oidc.fetchUserInfo(config,t.access_token,t.claims().sub),'OAUTH_WWW_AUTHENTICATE_CHALLENGE');return {accessLifetimeSeconds:5,waitMs:6500,expiredRefused:true,...observed};});
 if (!refusalsOnly) await test('actual Keycloak persistent session across server restart',async()=>{const a=await authorize(),t=await exchange(a);await run('docker',['restart','--time','10',name],{timeout:40000});await ready();config=await oidc.discovery(new URL(issuer),'b0-native',undefined,oidc.None(),{execute:[oidc.allowInsecureRequests]});const fresh=await oidc.refreshTokenGrant(config,t.refresh_token);assert.ok(fresh.access_token);return {refreshSurvives:true,storage:'isolated H2 development database, not production PostgreSQL'};});
 await test('actual Keycloak token revocation',async()=>{const a=await authorize(),t=await exchange(a);await oidc.tokenRevocation(config,t.refresh_token,{token_type_hint:'refresh_token'});const observed=await refusal(()=>oidc.refreshTokenGrant(config,t.refresh_token),'OAUTH_RESPONSE_BODY_ERROR','invalid_grant');return {revokedRefreshRefused:true,backendDeviceRevocation:'not implied',...observed};});
 if (!refusalsOnly) await test('actual Keycloak logout prevents silent reauthentication',async()=>{const a=await authorize(),t=await exchange(a);let u=oidc.buildEndSessionUrl(config,{id_token_hint:t.id_token,post_logout_redirect_uri:callback});for(let i=0;i<10&&!u.href.startsWith(callback);i++){const r=await request(u);assert.ok(r.headers.get('location'));u=new URL(r.headers.get('location'),u);}const silent=await authorize({silent:true});assert.equal(silent.url.searchParams.get('error'),'login_required');return {silentLoginRefused:true};});
} catch(e) {results.push({name:'fixture setup/runtime',status:stage==='image-preflight'?'BLOCKED':'FAIL',stage,errorType:e.name,errorCode:e.code??null,reason:stage==='image-preflight'?'Pinned image unavailable; no Keycloak behavioral case executed':undefined});process.exitCode=1;console.log(JSON.stringify(results.at(-1)));}
finally {
 if(listener)await new Promise(r=>listener.close(r));
 if(startedContainer){const owned=(await run('docker',['inspect','--format','{{ index .Config.Labels "shadows.b0.followup" }}',name])).stdout.trim();assert.equal(owned,'2026-10-11');await run('docker',['rm','--force',name]);}
 await rm(runtime,{recursive:true,force:true});
 await mkdir('followup-artifacts',{recursive:true});await writeFile(output,JSON.stringify({date:'2026-10-11',environment:cloud?'cloud Linux':'local',image,issuer,limits:{readinessMs:90000,httpRequestMs:15000,redirects:20},nativeBrowser:{status:'BLOCKED',reason:cloud?'Linux cloud container; no Windows OS, NYLRA Tauri checkout/build, system-browser/native-return surface or real-device harness':'CUA exposes in-app browser only; native apps disabled; no Tauri native client or deployed issuer tested'},results},null,2));
}
