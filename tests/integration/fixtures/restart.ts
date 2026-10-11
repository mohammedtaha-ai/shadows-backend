import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getCACertificates } from 'node:tls';
import type { Enrollment } from '../../../src/modules/identity/index.js';
import type { AppConfig } from '../../../src/app/config.js';
async function restartChild(config:AppConfig,input:Record<string,unknown>) {
 const env={B1_DATA_MODE:'synthetic',DATABASE_URL:config.databaseUrl,OIDC_ISSUER:config.issuer,OIDC_CLIENT_ID:config.clientId,OIDC_CLIENT_SECRET:config.clientSecret,
  OIDC_CALLBACK_URL:config.callbackUrl,OIDC_LOGOUT_CALLBACK_URL:config.logoutCallbackUrl,TOKEN_ENCRYPTION_KEY:config.encryptionKey.toString('base64'),TOKEN_ENCRYPTION_KEY_ID:config.encryptionKeyId,PORT:'0'};
 const child=spawn(process.execPath,['--import','tsx',fileURLToPath(new URL('restart-child.ts',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 const output:Buffer[]=[], diagnostic:Buffer[]=[];
 child.stdout.on('data',c=>output.push(Buffer.from(c)));child.stderr.on('data',c=>diagnostic.push(Buffer.from(c)));
 child.stdin.end(JSON.stringify({env,certificates:getCACertificates('default'),...input}));
 const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
 try {
  const code=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  if(code!==0 || Buffer.concat(diagnostic).length) throw new Error('restart_child_failed');
  return JSON.parse(Buffer.concat(output).toString('utf8')) as {status:number;providerProbe?:string;principal?:{accountId:string;deviceId:string;sessionId:string}};
 } finally {clearTimeout(timer);}
}

export function restartSession(config:AppConfig,handle:string,revoke=false,syntheticProvider=false){return restartChild(config,{handle,revoke,syntheticProvider});}
export function restartPending(config:AppConfig,pending:{callback:URL;returnVerifier:string;start:{authorizationUrl:string}},enrollment:Enrollment={mode:'new'}){return restartChild(config,{pending:{callback:pending.callback.href,returnVerifier:pending.returnVerifier,authorizationUrl:pending.start.authorizationUrl,enrollment}});}
