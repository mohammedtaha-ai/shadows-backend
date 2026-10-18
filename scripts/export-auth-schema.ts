import { writeFile,mkdir,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compose } from '../src/app/compose.js';
import { readConfig } from '../src/app/config.js';
import { randomBytes } from 'node:crypto';
import { output,NativeLogin,ReturnRequest,Principal,SessionGrant,LogoutResult,Refusal } from '../src/transports/http/auth-schema.js';
export async function authSchema() {
 const app=await compose(readConfig({B1_DATA_MODE:'synthetic',DATABASE_URL:'postgresql://schema-only@127.0.0.1:1/schema',OIDC_ISSUER:'https://issuer.example.invalid',OIDC_CLIENT_ID:'schema-export',OIDC_CLIENT_SECRET:'schema-only-unusable',
  OIDC_CALLBACK_URL:'https://backend.example.invalid/v1/auth/callback',OIDC_LOGOUT_CALLBACK_URL:'https://backend.example.invalid/v1/auth/logout-callback',TOKEN_ENCRYPTION_KEY:randomBytes(32).toString('base64'),TOKEN_ENCRYPTION_KEY_ID:'schema-only',
  BYOK_KEY:randomBytes(32).toString('base64'),BYOK_KEY_ID:'schema-only',PORT:'0'}),{routeSet:'auth'});
 try {
  const opaque='a'.repeat(43),id='00000000-0000-4000-8000-000000000001';
  output(NativeLogin,{platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:opaque});
  output(ReturnRequest,{ticket:opaque,returnVerifier:opaque,enrollment:{mode:'new'}});output(Principal,{accountId:id,deviceId:id,sessionId:id});
  const fixtures=JSON.parse(await readFile('api/auth-v1.fixtures.json','utf8'));
  output(NativeLogin,fixtures.login);output(ReturnRequest,fixtures.newEnrollmentReturn);output(ReturnRequest,fixtures.reauthenticationReturn);
  output(SessionGrant,fixtures.newEnrollmentGrant);output(LogoutResult,fixtures.providerPending);
  for(const refusal of fixtures.refusals)output(Refusal,refusal.body);
  await app.server.ready();return JSON.stringify(app.server.swagger(),null,2)+'\n';
 }finally{await app.stop();}
}
if(process.argv[1] === fileURLToPath(import.meta.url)){await mkdir('api',{recursive:true});await writeFile('api/auth-v1.openapi.json',await authSchema());}
