// File-based local configuration adapter; application never queries Keycloak storage.
import { readFile } from 'node:fs/promises';
import { readConfig } from '../src/app/config.js';
import { compose } from '../src/app/compose.js';
import { installShutdown } from '../src/app/shutdown.js';
import { runMigrations } from '../src/platform/database/migrate.js';
export async function localEnvironment() {
 const root=process.env.LOCAL_RUNTIME ?? '/local';
 const secret=async(name:string)=>(await readFile(root+'/secrets/'+name,'utf8')).trim();
 const origin='https://127.0.0.1:8443';
 return {B1_DATA_MODE:'synthetic',DATABASE_URL:`postgresql://shadows:${await secret('app-db-password')}@app-db:5432/shadows`,
  OIDC_ISSUER:origin+'/realms/shadows-local',OIDC_CLIENT_ID:'shadows-backend',OIDC_CLIENT_SECRET:await secret('client-secret'),
  OIDC_CALLBACK_URL:origin+'/v1/auth/callback',OIDC_LOGOUT_CALLBACK_URL:origin+'/v1/auth/logout-callback',
  TOKEN_ENCRYPTION_KEY:await secret('token-key'),TOKEN_ENCRYPTION_KEY_ID:'local-v1',PORT:'3000'};
}
if(process.argv[2]==='start'||process.argv[2]==='migrate') {
 try {
  const config=readConfig(await localEnvironment());
  if(process.argv[2]==='migrate'){await runMigrations({connectionString:config.databaseUrl},'up');console.log('Local migrations complete.');}
  else {const app=await compose(config);installShutdown(()=>app.stop());await app.start();}
 }catch{console.error('local_runtime_failed');process.exitCode=1;}
}
