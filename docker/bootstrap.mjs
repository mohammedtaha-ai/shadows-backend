// Run only in the pinned Node Docker image. Never reads existing .env files.
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root=process.env.LOCAL_BOOTSTRAP_ROOT ?? '/workspace/.local-runtime';
async function provisionMissingByokKey() {
 try {await writeFile(root+'/secrets/byok-key',randomBytes(32).toString('base64'),{mode:0o600,flag:'wx'});}
 catch(error){if(error.code!=='EEXIST')throw error;}
}
let initialized=false;try {await access(root+'/initialized');initialized=true;}catch{}
if(initialized){await provisionMissingByokKey();console.log('Local runtime already provisioned; preserved.');process.exit(0);}
try {await access(root+'/secrets');throw new Error('partial_runtime_requires_inspection');}catch(e){if(e.message==='partial_runtime_requires_inspection')throw e;}
await mkdir(root+'/secrets',{recursive:true,mode:0o700});await mkdir(root+'/tls',{recursive:true});await mkdir(root+'/realm',{recursive:true});
const values={};
for(const name of ['app-db-password','identity-db-password','admin-password','user-password','client-secret','token-key','byok-key']) {
 values[name]=randomBytes(32).toString(name==='token-key'||name==='byok-key'?'base64':'hex');
 await writeFile(root+'/secrets/'+name,values[name],{mode:0o600});
}
const tls=root+'/tls';
function openssl(args){execFileSync('openssl',args,{stdio:'ignore'});}
openssl(['req','-x509','-newkey','rsa:3072','-nodes','-days','30','-subj','/CN=Shadows local development CA','-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign','-keyout',tls+'/ca-key.pem','-out',tls+'/ca.pem']);
openssl(['req','-new','-newkey','rsa:2048','-nodes','-subj','/CN=127.0.0.1','-keyout',tls+'/server-key.pem','-out',tls+'/server.csr']);
await writeFile(tls+'/server.ext','subjectAltName=IP:127.0.0.1,DNS:localhost\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n');
openssl(['x509','-req','-in',tls+'/server.csr','-CA',tls+'/ca.pem','-CAkey',tls+'/ca-key.pem','-CAcreateserial','-days','30','-extfile',tls+'/server.ext','-out',tls+'/server.pem']);
openssl(['x509','-in',tls+'/ca.pem','-outform','DER','-out',tls+'/ca.cer']);
const origin='https://127.0.0.1:8443';
await writeFile(root+'/realm/shadows-local.json',JSON.stringify({realm:'shadows-local',enabled:true,sslRequired:'all',accessTokenLifespan:300,ssoSessionIdleTimeout:86400,ssoSessionMaxLifespan:2592000,
 clients:[{clientId:'shadows-backend',enabled:true,protocol:'openid-connect',publicClient:false,secret:values['client-secret'],standardFlowEnabled:true,directAccessGrantsEnabled:false,implicitFlowEnabled:false,
 redirectUris:[origin+'/v1/auth/callback'],attributes:{'pkce.code.challenge.method':'S256','post.logout.redirect.uris':origin+'/v1/auth/logout-callback','id.token.signed.response.alg':'RS256','backchannel.logout.url':origin+'/v1/auth/backchannel-logout','backchannel.logout.session.required':'true','backchannel.logout.revoke.offline.tokens':'false'}}],
 users:[{username:'synthetic-user',enabled:true,emailVerified:true,email:'synthetic@example.invalid',firstName:'Synthetic',lastName:'Local',requiredActions:[],credentials:[{type:'password',value:values['user-password'],temporary:false}]}]},null,2),{mode:0o600});
await writeFile(root+'/initialized','local synthetic runtime v1\n');console.log('Provisioned synthetic local runtime; credentials remain in ignored files.');
