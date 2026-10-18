import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {createAssistant} from '../../src/modules/assistant/index.js';
import type {HermesRun} from '../../src/integrations/hermes/client.js';
import {compose} from '../../src/app/compose.js';
async function fixture(){
 const f=await identityFixture(),person=await f.login();let sends=0,uncertain=false,afterRead:undefined|(()=>Promise<void>);
 const runs=new Map<string,HermesRun>();
 const client={async capabilities(){return {durableIdempotency:true,retentionSeconds:86400};},
  async getSession(id:string){return {id};},async createSession(id:string){return {id};},
  async submitRun(i:{sessionId:string;commandId:string;input:string}){sends++;if(uncertain)throw new Error('outcome_unknown');
   const id='run_'+i.commandId;runs.set(id,{runId:id,sessionId:i.sessionId,state:'running'});return {runId:id,state:'started' as const,replayed:false};},
  async getRun(id:string){await afterRead?.();return runs.get(id)!;},
  async stopRun(id:string){const run=runs.get(id)!;runs.set(id,{...run,state:'cancelled'});return {runId:id,state:'stopping' as const};}};
 let service:ReturnType<typeof createAssistant>;try{service=createAssistant(f.db,f.identity,client,()=>f.now);}catch(error){await f.close();throw error;}
 return {...f,person,service,client,runs,get sends(){return sends;},unknown(){uncertain=true;},
  onRead(fn:()=>Promise<void>){afterRead=fn;},async close(){await f.close();}};
}
test('assistant_scopes_history_and_recovers_command_replay_without_duplicate_dispatch',async()=>{
 const f=await fixture();try{
  const p=f.person.principal,commandId=randomUUID();const first=await f.service.create(p,{commandId});
  assert.equal((await f.service.create(p,{commandId})).conversation.id,first.conversation.id);
  const input={commandId:randomUUID(),text:'Reply in English.'};
  await f.service.send(p,first.conversation.id,input);await f.service.send(p,first.conversation.id,input);assert.equal(f.sends,1);
  await assert.rejects(f.service.send(p,first.conversation.id,{...input,text:'Different message.'}),{message:'command_conflict'});
  const [id,run]=[...f.runs][0]!;f.runs.set(id,{...run,state:'completed',completed:true,output:'Hello from the assistant.'});
  const snapshot=await f.service.snapshot(p,first.conversation.id);assert.equal(snapshot.turns[0]!.output,'Hello from the assistant.');
  assert.ok(!JSON.stringify(snapshot).includes('run_'));assert.ok(!JSON.stringify(snapshot).includes('session_id'));
  f.setSubject('another-account');const other=await f.login();
  await assert.rejects(f.service.snapshot(other.principal,first.conversation.id),{message:'not_found'});
  assert.deepEqual((await f.service.list(other.principal)).conversations,[]);
 }finally{await f.close();}
});
test('assistant_http_requires_account_and_refuses_upstream_selectors',async()=>{
 const f=await fixture();const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now,hermes:f.client});
 try{const base='/v1/nylra/assistant',headers={authorization:`Bearer ${f.person.handle}`};
  assert.equal((await app.server.inject({url:base+'/status'})).statusCode,401);
  assert.equal((await app.server.inject({method:'POST',url:base+'/conversations',headers,payload:{commandId:randomUUID(),profile:'other'}})).statusCode,400);
  const made=await app.server.inject({method:'POST',url:base+'/conversations',headers,payload:{commandId:randomUUID()}});assert.equal(made.statusCode,200);
  const id=made.json().conversation.id;
  const sent=await app.server.inject({method:'POST',url:base+`/conversations/${id}/turns`,headers,payload:{commandId:randomUUID(),text:'Hello through the backend.'}});
  assert.equal(sent.statusCode,200);assert.equal(sent.json().turns[0].input,'Hello through the backend.');
 }finally{await app.stop();await f.close();}
});
test('assistant_unknown_write_is_not_automatically_resent_and_busy_turn_is_preserved',async()=>{
 const f=await fixture();try{const p=f.person.principal,c=await f.service.create(p,{commandId:randomUUID()});f.unknown();
  const sent=await f.service.send(p,c.conversation.id,{commandId:randomUUID(),text:'Test an uncertain receipt.'});
  assert.equal(sent.turns[0]!.state,'unknown');await f.service.snapshot(p,c.conversation.id);assert.equal(f.sends,1);
  await assert.rejects(f.service.send(p,c.conversation.id,{commandId:randomUUID(),text:'A competing message.'}),{message:'generation_busy'});
 }finally{await f.close();}
});
test('assistant_rechecks_account_after_upstream_read_and_stop_targets_owned_turn',async()=>{
 const f=await fixture();try{const p=f.person.principal,c=await f.service.create(p,{commandId:randomUUID()});
  const sent=await f.service.send(p,c.conversation.id,{commandId:randomUUID(),text:'Stop this run.'});
  const stopped=await f.service.stop(p,c.conversation.id,sent.turns[0]!.id);assert.equal(stopped.turns[0]!.state,'cancelled');
  const next=await f.service.send(p,c.conversation.id,{commandId:randomUUID(),text:'Check revocation.'});assert.equal(next.turns.length,2);
  f.onRead(async()=>{await f.identity.logout(p);});
  await assert.rejects(f.service.snapshot(p,c.conversation.id),{message:'unauthorized'});
 }finally{await f.close();}
});
