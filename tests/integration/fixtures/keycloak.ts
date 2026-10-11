import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes,randomUUID } from 'node:crypto';
import { mkdir,mkdtemp,writeFile,chmod,rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { freePort } from './postgres.js';
import { tlsFixture } from './tls.js';
const exec=promisify(execFile);
const image='quay.io/keycloak/keycloak@sha256:27b3230fbabb8c9ff3c66c864cf09dcd8a41aca82e5100679d109ef0eeb05741';
const label='shadows.b1.fixture';
async function docker(args:string[],timeout=30000) {
 const env={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[key];
 try{return await exec('docker',['--host=unix:///var/run/docker.sock',...args],{env,timeout});}
 catch{throw new Error('keycloak_fixture_docker');}
}
export async function keycloakFixture(callback:string,logoutCallback:string) {
 const tls=await tlsFixture(),port=await freePort(),issuer=`https://127.0.0.1:${port}/realms/b1-acceptance`;
 const root=resolve('.test-runtime');await mkdir(root,{recursive:true});const directory=await mkdtemp(resolve(root,'kc-'));
 const name='b1-'+randomUUID(),owner=randomUUID(),password=randomBytes(32).toString('hex'),clientSecret=randomBytes(32).toString('hex');let created=false;
 async function close(){if(created){const owned=(await docker(['inspect','--format',`{{ index .Config.Labels "${label}" }}`,name])).stdout.trim();if(owned!==owner) throw new Error('fixture_ownership');await docker(['rm','--force',name]);}await rm(directory,{recursive:true,force:true});await tls.close();}
 try {
  await chmod(directory,0o755);await chmod(tls.directory,0o755);await chmod(tls.keyPath,0o644);
  await mkdir(resolve(directory,'import'));
  await writeFile(resolve(directory,'import/realm.json'),JSON.stringify({realm:'b1-acceptance',enabled:true,sslRequired:'all',accessTokenLifespan:300,
   clients:[{clientId:'backend',enabled:true,protocol:'openid-connect',publicClient:false,secret:clientSecret,standardFlowEnabled:true,directAccessGrantsEnabled:false,
    redirectUris:[callback],attributes:{'pkce.code.challenge.method':'S256','post.logout.redirect.uris':logoutCallback,'id.token.signed.response.alg':'RS256'}}],
   users:[{username:'b1-user',enabled:true,emailVerified:true,email:'b1@example.invalid',firstName:'Synthetic',lastName:'Acceptance',requiredActions:[],credentials:[{type:'password',value:password,temporary:false}]}]}));
  await docker(['image','inspect',image],10000);
  await docker(['run','-d','--name',name,'--label',`${label}=${owner}`,'--memory','1g','--cpus','2','-p',`127.0.0.1:${port}:8443`,
   '--mount',`type=bind,source=${resolve(directory,'import')},target=/opt/keycloak/data/import,readonly`,
   '--mount',`type=bind,source=${tls.directory},target=/fixture-tls,readonly`,image,'start-dev','--import-realm','--http-enabled=false',
   '--https-certificate-file=/fixture-tls/cert.pem','--https-certificate-key-file=/fixture-tls/key.pem',`--hostname=https://127.0.0.1:${port}`]);created=true;
  const deadline=Date.now()+90000;let ready=false;
  while(Date.now()<deadline){try{if((await fetch(issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(1500)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  if(!ready) throw new Error('keycloak_fixture_readiness');
  const cookies=new Map<string,string>();
  async function request(url:URL|string,options:RequestInit={}) {
   const u=new URL(url);if(u.origin!==new URL(issuer).origin && u.origin!==new URL(callback).origin) throw new Error('fixture_foreign_redirect');
   const response=await fetch(u,{...options,redirect:'manual',headers:{cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),...options.headers},signal:AbortSignal.timeout(15000)});
   for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0]!,index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}return response;
  }
  async function authorize(authorizationUrl:string) {
   let url=new URL(authorizationUrl);cookies.clear();
   for(let i=0;i<20;i++){
    if(url.origin+url.pathname===callback) return url;
    const response=await request(url),location=response.headers.get('location');if(location){url=new URL(location,url);continue;}
    const html=await response.text(),action=/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/.exec(html)?.[1] ?? /<form[^>]*action="([^"]+)"[^>]*id="kc-form-login"/.exec(html)?.[1];
    if(!action) throw new Error('fixture_expected_login_form');
    const post=await request(new URL(action.replaceAll('&amp;','&'),url),{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'b1-user',password,credentialId:''})});
    const next=post.headers.get('location');if(!next) throw new Error('fixture_login_refused');url=new URL(next,url);
   }throw new Error('fixture_redirect_bound');
  }
  return {issuer,clientSecret,tls,authorize,request,close};
 }catch(error){await close();throw error;}
}
