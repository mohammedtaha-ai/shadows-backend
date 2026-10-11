// Test-only process driver. Runtime config and bearer travel through stdin, never argv/stdout.
import { compose } from '../../../src/app/compose.js';
import { hash,type OidcPort } from '../../../src/modules/identity/index.js';
import { readConfig } from '../../../src/app/config.js';
import { setDefaultCACertificates } from 'node:tls';
const chunks:Buffer[]=[];for await(const chunk of process.stdin) chunks.push(Buffer.from(chunk));
const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
try {
 const config=readConfig(input.env);
 setDefaultCACertificates(input.certificates);
 let providerProbe:string|undefined;
 if(!input.pending&&!input.syntheticProvider){
  try{providerProbe=String((await fetch(config.issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(3000)})).status);}
  catch(e){const code=(e as {cause?:{code?:unknown}})?.cause?.code;providerProbe=typeof code==='string'&&/^[A-Z0-9_]+$/.test(code)?code:'provider_probe_failed';}
 }
 const oidc:OidcPort|undefined=(input.pending||input.syntheticProvider)?{
  async authorizationUrl(){throw new Error('fixture_not_used');},
  async exchange(callback,binding){
   const original=new URL(input.pending.authorizationUrl);
   if(callback.searchParams.get('state')!==binding.state || original.searchParams.get('state')!==binding.state || original.searchParams.get('nonce')!==binding.nonce || original.searchParams.get('code_challenge')!==hash(binding.verifier))throw new Error('fixture_binding_refused');
   return {identity:{issuer:config.issuer,subject:'subject-one',providerSessionId:'subject-one-sid'},providerTokens:{refreshToken:'synthetic-refresh',idToken:'synthetic-id'}};
  },
  async revokeAndLogout(){throw new Error('fixture_not_used');},async verifyLogout(){throw new Error('fixture_not_used');},async isSessionActive(){return true;},async refreshSession(tokens){return tokens;}
 }:undefined;
 const app=await compose(config,{oidc});
 try {
  await app.start();
  if(input.pending){
   const callback=new URL(input.pending.callback),returned=await app.server.inject(callback.pathname+callback.search);
   if(returned.statusCode!==302)throw new Error('fixture_callback_failed');
   const ticket=new URL(returned.headers.location!).searchParams.get('ticket');
   const grant=await app.server.inject({method:'POST',url:'/v1/auth/return',payload:{ticket,returnVerifier:input.pending.returnVerifier,enrollment:input.pending.enrollment}});
   process.stdout.write(JSON.stringify({status:grant.statusCode}));
  }else{
  const session=await app.server.inject({url:'/v1/auth/session',headers:{authorization:`Bearer ${input.handle}`}});
  if(input.revoke && session.statusCode===200) {
   const principal=session.json();
   const result=await app.server.inject({method:'DELETE',url:`/v1/devices/${principal.deviceId}`,headers:{authorization:`Bearer ${input.handle}`}});
   process.stdout.write(JSON.stringify({status:result.statusCode}));
  } else process.stdout.write(JSON.stringify({status:session.statusCode,providerProbe,...(session.statusCode===200?{principal:session.json()}: {})}));
  }
 } finally {await app.stop();}
} catch {process.stdout.write(JSON.stringify({status:503}));process.exitCode=1;}
