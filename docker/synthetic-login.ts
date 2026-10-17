// Development-only Keycloak login. Credentials stay in memory and never in logs.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {hash,type SessionGrant} from '../src/modules/identity/index.js';

export function syntheticLogin() {
 const origin='https://127.0.0.1:8443',root=process.env.LOCAL_RUNTIME??'/local';
 const cookies=new Map<string,string>();
 const secret=async(name:string)=>(await readFile(root+'/secrets/'+name,'utf8')).trim();
 async function request(url:string,options:RequestInit={}) {
  const target=new URL(url,origin);assert.equal(target.origin,origin);
  const response=await fetch(target,{...options,redirect:'manual',signal:options.signal??AbortSignal.timeout(15000),
   headers:{...options.headers,cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')}});
  for(const cookie of response.headers.getSetCookie()){
   const pair=cookie.split(';')[0]!,index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));
  }
  return response;
 }
 async function post(path:string,body:unknown,handle?:string) {
  return request(path,{method:'POST',headers:{'content-type':'application/json',...(handle?{authorization:`Bearer ${handle}`}:{})},body:JSON.stringify(body)});
 }
 async function login(enrollment:unknown) {
  cookies.clear();const verifier=randomBytes(32).toString('base64url');
  const start=await post('/v1/auth/login',{platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(verifier)});
  assert.equal(start.status,200);let url=(await start.json() as {authorizationUrl:string}).authorizationUrl;
  let ticket:string|undefined;
  for(let i=0;i<20;i++){
   const response=await request(url),location=response.headers.get('location');
   if(location){
    const target=new URL(location,url);
    if(target.origin==='http://127.0.0.1:49152'&&target.pathname==='/oidc-return'){ticket=target.searchParams.get('ticket')??undefined;break;}
    url=target.href;continue;
   }
   const html=await response.text();
   const action=/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/.exec(html)?.[1]??/<form[^>]*action="([^"]+)"[^>]*id="kc-form-login"/.exec(html)?.[1];
   assert.ok(action,'expected_synthetic_login_form');
   const submitted=await request(new URL(action.replaceAll('&amp;','&'),url).href,{method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({username:'synthetic-user',password:await secret('user-password'),credentialId:''})});
   const next=submitted.headers.get('location');assert.ok(next,'synthetic_login_redirect');url=new URL(next,url).href;
  }
  assert.ok(ticket,'bounded_native_return');const body={ticket,returnVerifier:verifier,enrollment};
  const response=await post('/v1/auth/return',body);assert.equal(response.status,200);
  assert.equal((await post('/v1/auth/return',body)).status,400);
  return await response.json() as SessionGrant&{enrollmentCredential?:string};
 }
 return {origin,cookies,secret,request,post,login};
}
