import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {replyStream} from 'aylul-brain';
import {compose} from '../../src/app/compose.js';
import type {AppConfig} from '../../src/app/config.js';
import {hash,type OidcPort} from '../../src/modules/identity/index.js';
import {createOpenAICompatibleModel} from '../../src/integrations/providers/openai-compatible.js';
import {identityFixture} from '../integration/fixtures/identity.js';
import {fakeProvider} from '../integration/fixtures/fake-provider.js';
import {runAccountChatJourney} from '../../docker/chat-journey.js';

type ConfigWire=Omit<AppConfig,'encryptionKey'|'byokKey'|'byokPreviousKeys'>&{encryptionKey:string;byokKey:string;byokPreviousKeys:[string,string][]};
if(process.argv.includes('--chat-restart-child')){
 process.once('message',async(input:{config:ConfigWire})=>{
  let calls=0;
  const oidc:OidcPort={async authorizationUrl(){throw new Error('not_used');},async exchange(){throw new Error('not_used');},async revokeAndLogout(){throw new Error('not_used');},async verifyLogout(){throw new Error('not_used');},async isSessionActive(){return true;},async refreshSession(tokens){return tokens;}};
  try{
   const c=input.config,app=await compose({...c,encryptionKey:Buffer.from(c.encryptionKey,'base64'),byokKey:Buffer.from(c.byokKey,'base64'),byokPreviousKeys:new Map(c.byokPreviousKeys.map(([id,key])=>[id,Buffer.from(key,'base64')]))},{oidc,resolver:async()=>[{address:'93.184.216.34',family:4}],reply:async function*(){calls++;throw new Error('unexpected_redispatch');}});
   await app.start();const address=app.server.server.address();if(!address||typeof address==='string')throw new Error('child_listener');
   process.send?.({type:'ready',origin:`http://127.0.0.1:${address.port}`});
   process.once('message',async()=>{await app.stop();process.send?.({type:'stopped',calls});process.disconnect();});
  }catch{process.send?.({type:'failed'});process.exitCode=1;process.disconnect();}
 });
}else test('account_chat_http_login_fake_https_reply_stop_fresh_process_restart_and_delete', {timeout:120000},async()=>{
 const f=await identityFixture(),first=await fakeProvider({deltas:['Hello',' synthetic world']}),second=await fakeProvider({mode:'forever',delayMs:20});
 let calls=0,child:ReturnType<typeof fork>|undefined;
 const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now,resolver:async()=>[{address:'93.184.216.34',family:4}],reply:input=>{
  // The test host alone routes synthetic validated metadata to owned loopback HTTPS fixtures.
  const provider=++calls===1?first:second;
  return replyStream({model:createOpenAICompatibleModel({...input.connection,destination:provider.destination}).model,history:input.history,message:input.message,signal:input.signal,maxOutputTokens:input.maxOutputTokens});
 }});
 try{
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
  const verifier=randomBytes(32).toString('base64url');
  const start=await fetch(origin+'/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({platform:'windows',returnUri:'http://127.0.0.1:49152/oidc-return',returnChallenge:hash(verifier)})});assert.equal(start.status,200);
  const authorizationUrl=(await start.json() as {authorizationUrl:string}).authorizationUrl,state=new URL(authorizationUrl).searchParams.get('state');assert.ok(state);
  const callback=await fetch(origin+`/v1/auth/callback?state=${encodeURIComponent(state)}&code=synthetic-code`,{redirect:'manual'});assert.equal(callback.status,302);
  const ticket=new URL(callback.headers.get('location')!).searchParams.get('ticket');assert.ok(ticket);
  const returned=await fetch(origin+'/v1/auth/return',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ticket,returnVerifier:verifier,enrollment:{mode:'new'}})});assert.equal(returned.status,200);
  const grant=await returned.json() as {handle:string};
  const result=await runAccountChatJourney({origin,handle:grant.handle,baseUrl:'https://synthetic-provider.example/v1',model:'synthetic-model',apiKey:'synthetic-journey-key',restart:async()=>{
   await app.stop();
   child=fork(fileURLToPath(import.meta.url),['--chat-restart-child'],{execArgv:['--import','tsx'],stdio:['ignore','ignore','ignore','ipc']});assert.notEqual(child.pid,process.pid);
   const ready=once(child,'message');
   const c=f.config;child.send({config:{...c,encryptionKey:c.encryptionKey.toString('base64'),byokKey:c.byokKey.toString('base64'),byokPreviousKeys:[...c.byokPreviousKeys].map(([id,key])=>[id,key.toString('base64')])}});
   const timeout=setTimeout(()=>child?.kill('SIGKILL'),30000);
   try{const [message]=await Promise.race([ready,once(child,'exit').then(()=>{throw new Error('restart_child_failed');})]) as [{type:string;origin:string}];assert.equal(message.type,'ready');return message.origin;}finally{clearTimeout(timeout);}
  }});
  assert.equal(first.requests,1,'first turn must reach the fake HTTPS provider exactly once');
  assert.equal(second.requests,1,'stopped turn must reach the second fake HTTPS provider exactly once');
  assert.ok(result.checks.includes('history_after_restart_step'));
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_topics')).rows[0].n,0);
  assert.equal((await f.pool.query("SELECT count(*)::int n FROM provider_settings_connections WHERE state='active'")).rows[0].n,0);
  assert.ok(child);const stopped=once(child,'message'),exited=once(child,'exit');child.send({type:'stop'});
  assert.deepEqual((await stopped)[0],{type:'stopped',calls:0});assert.equal((await exited)[0],0);child=undefined;
 }finally{if(child){child.kill('SIGKILL');await once(child,'exit').catch(()=>{});}await app.stop();await second.close();await first.close();await f.close();}
});
