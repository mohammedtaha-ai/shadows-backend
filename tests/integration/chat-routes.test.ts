import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import {Value} from '@sinclair/typebox/value';
import * as S from '../../src/transports/http/nylra-schema.js';
import {nylraOperations} from '../../src/transports/http/nylra-paths.js';
import type {ReplyPort} from '../../src/modules/conversations/index.js';

const connection={name:'Synthetic',format:'openai_compatible',baseUrl:'https://provider.example/v1',model:'synthetic',apiKey:'synthetic-route-key'};
async function fixture(){
 const f=await identityFixture(),person=await f.login();let calls=0,category:string|undefined,expire=false;const models:string[]=[];
 const reply:ReplyPort=async function*(input){calls++;models.push(input.connection.model);if(category)yield {finish:'error',category:category as 'quota'};else {yield 'synthetic reply';yield {finish:'done'};}};
 const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now,reply,resolver:async()=>{if(expire){expire=false;f.advance(31*86400000);}return [{address:'93.184.216.34',family:4}];}});
 const headers={authorization:`Bearer ${person.handle}`};
 const request=(method:'GET'|'POST'|'PUT'|'DELETE',url:string,payload?:object,auth=headers)=>app.server.inject({method,url,headers:auth,...(payload?{payload}:{})});
 return {...f,app,person,headers,request,models,expireOnNextResolution(){expire=true;},get calls(){return calls;},setCategory(value:string|undefined){category=value;},async close(){await app.stop();await f.close();}};
}
async function configure(f:Awaited<ReturnType<typeof fixture>>){const created=await f.request('POST','/v1/nylra/connections',connection);assert.equal(created.statusCode,200);const id=created.json().connectionId;await f.request('PUT','/v1/nylra/connections/default',{connectionId:id});return id as string;}

test('chat_routes_bind_implemented_operations_isolate_accounts_and_never_return_credentials',async()=>{
 const f=await fixture();try{
  assert.equal((await f.request('GET','/v1/nylra/connections',undefined,{} as typeof f.headers)).statusCode,401);
  const created=await f.request('POST','/v1/nylra/connections',connection);assert.equal(created.statusCode,200);assert.ok(Value.Check(S.Connection,created.json()));
  const id=created.json().connectionId;
  for(const response of [created,await f.request('GET','/v1/nylra/connections'),await f.request('PUT',`/v1/nylra/connections/${id}`,{name:'Renamed'}),await f.request('GET','/v1/nylra/connections/default'),await f.request('PUT','/v1/nylra/connections/default',{connectionId:id})]){
   assert.equal(response.statusCode,200);assert.ok(!/apiKey|sealed|synthetic-route-key/.test(response.body));
  }
  f.setSubject('other');const other=await f.login(),auth={authorization:`Bearer ${other.handle}`};
  for(const [method,url,payload] of [
   ['PUT',`/v1/nylra/connections/${id}`,{name:'Taken'}],['DELETE',`/v1/nylra/connections/${id}`,undefined],
   ['POST',`/v1/nylra/connections/${id}/test`,{costAcknowledged:true}],['PUT','/v1/nylra/connections/default',{connectionId:id}],
  ] as const){const response=await f.request(method,url,payload,auth);assert.equal(response.statusCode,404);assert.deepEqual(response.json(),{code:'not_found'});}
  assert.equal(f.calls,0);
  await f.request('DELETE',`/v1/nylra/connections/${id}`);
  assert.deepEqual((await f.request('GET','/v1/nylra/connections/default')).json(),{connectionId:null});
  for(const op of nylraOperations.filter(op=>/Connection|Topic|Turn/.test(op.operationId)))assert.equal(op.status,'implemented',op.operationId);
 }finally{await f.close();}
});

test('chat_routes_paid_probe_requires_explicit_acknowledgement_and_returns_only_safe_outcomes',async()=>{
 const f=await fixture();try{
  const id=await configure(f);
  for(const payload of [{},{costAcknowledged:false},{costAcknowledged:true,extra:true}])assert.equal((await f.request('POST',`/v1/nylra/connections/${id}/test`,payload)).statusCode,400);
  assert.equal(f.calls,0);
  await f.request('PUT',`/v1/nylra/connections/${id}`,{model:'updated-model'});
  assert.deepEqual((await f.request('POST',`/v1/nylra/connections/${id}/test`,{costAcknowledged:true})).json(),{outcome:'ok'});assert.equal(f.calls,1);
  assert.deepEqual(f.models,['updated-model']);
  f.setCategory('quota');const failed=await f.request('POST',`/v1/nylra/connections/${id}/test`,{costAcknowledged:true});
  assert.deepEqual(failed.json(),{outcome:'quota'});assert.equal(f.calls,2);assert.ok(!failed.body.includes(connection.apiKey));
  await f.identity.logout(f.person.principal);
  assert.equal((await f.request('POST',`/v1/nylra/connections/${id}/test`,{costAcknowledged:true})).statusCode,401);assert.equal(f.calls,2);
 }finally{await f.close();}
});

test('chat_routes_topics_turns_acknowledgements_busy_refusals_and_delete_are_live',async()=>{
 const f=await fixture();try{
  assert.deepEqual((await f.request('POST','/v1/nylra/topics',{commandId:randomUUID()})).json(),{code:'no_connection'});
  const id=await configure(f),commandId=randomUUID();
  const created=await f.request('POST','/v1/nylra/topics',{commandId,title:'Synthetic topic'});assert.equal(created.statusCode,200);const topic=created.json();assert.ok(Value.Check(S.Topic,topic));
  assert.deepEqual((await f.request('POST','/v1/nylra/topics',{commandId,title:'Synthetic topic'})).json(),topic);
  assert.equal((await f.request('POST','/v1/nylra/topics',{commandId,title:'Changed'})).statusCode,409);
  assert.equal((await f.request('POST','/v1/nylra/topics',{commandId:randomUUID(),project:{laptopId:randomUUID(),projectId:'synthetic'}})).statusCode,400);
  assert.equal((await f.request('GET','/v1/nylra/topics')).json().topics.length,1);
  assert.equal((await f.request('PUT',`/v1/nylra/topics/${topic.topicId}/connection`,{connectionId:id,transferAcknowledged:false})).statusCode,400);
  assert.equal((await f.request('PUT',`/v1/nylra/topics/${topic.topicId}/connection`,{connectionId:id,transferAcknowledged:true})).statusCode,200);
  const turn=await f.request('POST',`/v1/nylra/topics/${topic.topicId}/turns`,{commandId:randomUUID(),message:'Hello'});assert.equal(turn.statusCode,200);assert.ok(Value.Check(S.TurnAccepted,turn.json()));
  const busy=await f.request('POST',`/v1/nylra/topics/${topic.topicId}/turns`,{commandId:randomUUID(),message:'Second'});assert.equal(busy.statusCode,409);assert.deepEqual(busy.json(),{code:'generation_busy'});
  assert.equal((await f.request('POST',`/v1/nylra/topics/${topic.topicId}/turns/${turn.json().turnId}/cancel`,{})).statusCode,200);
  f.setSubject('other');const other=await f.login(),auth={authorization:`Bearer ${other.handle}`};
  for(const [method,url,payload] of [['GET',`/v1/nylra/topics/${topic.topicId}`,undefined],['POST',`/v1/nylra/topics/${topic.topicId}/turns`,{commandId:randomUUID(),message:'Taken'}],['DELETE',`/v1/nylra/topics/${topic.topicId}`,{confirm:true}]] as const)assert.equal((await f.request(method,url,payload,auth)).statusCode,404);
  assert.equal((await f.request('DELETE',`/v1/nylra/topics/${topic.topicId}`,{confirm:false})).statusCode,400);
  assert.equal((await f.request('DELETE',`/v1/nylra/topics/${topic.topicId}`,{confirm:true})).statusCode,200);
  assert.equal((await f.request('GET',`/v1/nylra/topics/${topic.topicId}`)).statusCode,404);
 }finally{await f.close();}
});

test('chat_routes_probe_reauthorizes_after_destination_resolution_before_provider_call',async()=>{
 const f=await fixture();try{
  const id=await configure(f);f.expireOnNextResolution();
  const response=await f.request('POST',`/v1/nylra/connections/${id}/test`,{costAcknowledged:true});
  assert.equal(response.statusCode,401);assert.equal(f.calls,0);
 }finally{await f.close();}
});

test('chat_routes_topic_sse_replays_committed_events_with_scoped_cursor_refusals',async()=>{
 const f=await fixture(),abort=new AbortController(),reconnect=new AbortController(),deadline=setTimeout(()=>{abort.abort();reconnect.abort();},15000);
 try{
  await configure(f);const topic=(await f.request('POST','/v1/nylra/topics',{commandId:randomUUID()})).json();
  const cursor=(await f.request('GET',`/v1/nylra/topics/${topic.topicId}`)).json().cursor;
  await f.request('POST',`/v1/nylra/topics/${topic.topicId}/turns`,{commandId:randomUUID(),message:'Hello'});
  const base=await f.app.server.listen({host:'127.0.0.1',port:0});
  for(const after of ['-1','1e2','01','9007199254740993'])assert.equal((await f.request('GET',`/v1/nylra/topics/${topic.topicId}/events?after=${after}`)).statusCode,400);
  assert.equal((await f.request('GET',`/v1/nylra/topics/${topic.topicId}/events?after=999`)).statusCode,410);
  const response=await fetch(`${base}/v1/nylra/topics/${topic.topicId}/events?after=${cursor}`,{headers:f.headers,signal:abort.signal});assert.equal(response.status,200);
  const reader=response.body!.getReader();let text='';while(!text.includes('\n\n')){const next=await reader.read();assert.equal(next.done,false);text+=new TextDecoder().decode(next.value);}
  const frame=JSON.parse(/^data: (.+)$/m.exec(text)![1]!);assert.ok(Value.Check(S.TopicEvent,frame));assert.equal(frame.seq,cursor+1);assert.ok(!text.includes(connection.apiKey));
  abort.abort();await reader.cancel().catch(()=>{});
  await f.app.turnDispatcher.start();
  const until=Date.now()+5000;while((await f.app.conversations.events(f.person.principal,topic.topicId,0)).events.at(-1)?.type!=='turn_finished'){assert.ok(Date.now()<until,'generation must finish');await new Promise(r=>setTimeout(r,10));}
  const replay=await fetch(`${base}/v1/nylra/topics/${topic.topicId}/events?after=${frame.seq}`,{headers:f.headers,signal:reconnect.signal});assert.equal(replay.status,200);
  const replayReader=replay.body!.getReader();let replayed='';while(!replayed.includes('\n\n')){const next=await replayReader.read();assert.equal(next.done,false);replayed+=new TextDecoder().decode(next.value);}
  assert.equal(Number(/^id: (\d+)$/m.exec(replayed)![1]),frame.seq+1);reconnect.abort();await replayReader.cancel().catch(()=>{});
  await f.pool.query('UPDATE conversations_topics SET floor=1 WHERE id=$1',[topic.topicId]);
  assert.equal((await f.request('GET',`/v1/nylra/topics/${topic.topicId}/events?after=0`)).statusCode,410);
 }finally{clearTimeout(deadline);abort.abort();reconnect.abort();await f.close();}
});

test('chat_routes_topic_stream_rechecks_deletion_and_revocation_after_journal_read',async()=>{
 for(const change of ['delete','revoke'] as const){
  const f=await fixture(),abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),15000);
  let release:()=>void=()=>{};
  try{
   await configure(f);const topic=(await f.request('POST','/v1/nylra/topics',{commandId:randomUUID()})).json();
   const base=await f.app.server.listen({host:'127.0.0.1',port:0});
   const response=await fetch(`${base}/v1/nylra/topics/${topic.topicId}/events?after=0`,{headers:f.headers,signal:abort.signal});assert.equal(response.status,200);
   const reader=response.body!.getReader(),pending=reader.read();
   let entered:()=>void=()=>{},held=false;const waiting=new Promise<void>(resolve=>{entered=resolve;}),barrier=new Promise<void>(resolve=>{release=resolve;});
   const events=f.app.conversations.events;
   f.app.conversations.events=async(...args)=>{const page=await events(...args);if(page.events.length&&!held){held=true;entered();await barrier;}return page;};
   await f.request('POST',`/v1/nylra/topics/${topic.topicId}/turns`,{commandId:randomUUID(),message:'Private synthetic message'});
   await Promise.race([waiting,new Promise<never>((_,reject)=>{abort.signal.addEventListener('abort',()=>reject(new Error('stream_test_timeout')),{once:true});})]);
   if(change==='delete')await f.request('DELETE',`/v1/nylra/topics/${topic.topicId}`,{confirm:true});else await f.identity.logout(f.person.principal);
   release();assert.equal((await pending).done,true);
   assert.equal((await f.request('GET',`/v1/nylra/topics/${topic.topicId}`)).statusCode,change==='delete'?404:401);
  }finally{release();clearTimeout(deadline);abort.abort();await f.close();}
 }
});
