import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {NYLRA_INSTRUCTIONS} from 'aylul-brain';
import {identityFixture} from './fixtures/identity.js';
import {postgresFixture} from './fixtures/postgres.js';
import {createActivity} from '../../src/modules/activity/index.js';
import {createProviderSettings} from '../../src/modules/provider-settings/index.js';
import {createConversations,createTurnDispatcher,type ReplyInput,type ReplyPart} from '../../src/modules/conversations/index.js';
import {compose} from '../../src/app/compose.js';

async function waitFor(check:()=>Promise<boolean>|boolean){const end=Date.now()+5000;while(!await check()){if(Date.now()>end)throw new Error('test_timeout');await new Promise(r=>setTimeout(r,10));}}
class FakeReply {
 calls:ReplyInput[]=[];queue:ReplyPart[]=[];wake?:()=>void;
 push(part:ReplyPart){this.queue.push(part);this.wake?.();}
 reply=async function*(this:FakeReply,input:ReplyInput){
  this.calls.push(input);
  while(!input.signal.aborted){
   if(!this.queue.length)await new Promise<void>(resolve=>{const wake=()=>{input.signal.removeEventListener('abort',wake);resolve();};this.wake=wake;input.signal.addEventListener('abort',wake,{once:true});});
   if(input.signal.aborted)return;
   const value=this.queue.shift();if(value!==undefined){yield value;if(typeof value!=='string')return;}
  }
 }.bind(this);
}
async function fixture(){
 const f=await identityFixture(),person=await f.login(),fake=new FakeReply();
 let wait:Promise<void>|undefined,release:()=>void=()=>{},resolving=false;
 const providers=createProviderSettings(f.db,f.identity,{activeKeyId:f.config.byokKeyId,keys:new Map([[f.config.byokKeyId,f.config.byokKey]])},async()=>{if(wait){resolving=true;await wait;}return [{address:'93.184.216.34',family:4}];},()=>f.now);
 const activity=createActivity(f.db,()=>f.now);
 const service=createConversations(f.db,f.identity,providers,activity,()=>f.now,NYLRA_INSTRUCTIONS);
 const connection=await providers.create(person.principal,{name:'synthetic',format:'openai_compatible',baseUrl:'https://example.test/v1',model:'synthetic',apiKey:'synthetic-test-key'});
 await providers.setDefault(person.principal,connection.connectionId);
 const topic=await service.createTopic(person.principal,{commandId:randomUUID()});
 const worker=createTurnDispatcher(f.db,f.identity,providers,fake.reply,()=>f.now,{heartbeatMs:25,pollMs:20,coalesceMs:20});
 const submit=()=>service.createTurn(person.principal,topic.topicId,{commandId:randomUUID(),message:'synthetic hello'});
 const state=async()=> (await f.pool.query("SELECT t.state FROM conversations_turns t JOIN conversations_messages m ON m.turn_id=t.id AND m.role='user' ORDER BY m.seq DESC LIMIT 1")).rows[0]?.state;
 return {...f,get now(){return f.now;},person,fake,providers,service,connection,topic,worker,submit,state,stallResolver(){wait=new Promise<void>(resolve=>{release=resolve;});},get resolving(){return resolving;},releaseResolver(){release();wait=undefined;},async close(){release();await worker.stop();await f.close();}};
}

test('turn_dispatch_streams_committed_bounded_deltas_and_pins_history',async()=>{
 const f=await fixture();try{
  assert.equal((await f.pool.query('SHOW server_encoding')).rows[0].server_encoding,'UTF8');
  await f.submit();f.fake.push('hello ');f.fake.push('world');f.fake.push({finish:'done'});await f.worker.start();
  await waitFor(async()=>await f.state()==='done');
  const snapshot=await f.service.snapshot(f.person.principal,f.topic.topicId);
  assert.equal(snapshot.entries.at(-1)!.text,'hello world');assert.equal(snapshot.entries.at(-1)!.type,'assistant_message');
  const page=await f.service.events(f.person.principal,f.topic.topicId,0);
  assert.deepEqual(page.events.map(e=>e.seq),page.events.map((_,i)=>i+1));
  assert.equal(page.events.at(-1)!.type,'turn_finished');assert.equal(f.fake.calls.length,1);
  assert.deepEqual(f.fake.calls[0]!.history,[]);assert.equal(f.fake.calls[0]!.maxOutputTokens,4096);
  await f.submit();f.fake.push('😀'.repeat(8500));await waitFor(async()=>await f.state()==='done');
  const last=(await f.service.snapshot(f.person.principal,f.topic.topicId)).entries.at(-1)!;
  assert.equal(last.text.length,16000);assert.equal(last.type==='assistant_message'&&last.status,'partial');
  assert.deepEqual(f.fake.calls[1]!.history,[{role:'user',content:'synthetic hello'},{role:'assistant',content:'hello world'}]);
  const events=(await f.pool.query("SELECT payload FROM conversations_events WHERE payload->>'type'='delta'")).rows;
  for(const {payload} of events)assert.ok(Buffer.byteLength(payload.text)<=4000);
 }finally{await f.close();}
});

test('turn_dispatch_predispatch_authority_and_persisted_stop_prevent_provider_calls',async()=>{
 for(const action of ['logout','stop','connection'] as const){
  const f=await fixture();try{
   const turn=await f.submit();
   if(action==='logout')await f.identity.logout(f.person.principal);
   else if(action==='stop')await f.service.cancelTurn(f.person.principal,f.topic.topicId,turn.turnId);
   else await f.providers.remove(f.person.principal,f.connection.connectionId);
   await f.worker.start();await waitFor(async()=>['error','cancelled'].includes(await f.state()));
   assert.equal(f.fake.calls.length,0);
  }finally{await f.close();}
 }
});

test('turn_dispatch_rejects_stale_token_delta_and_finish_and_recovers_without_retry',async()=>{
 const f=await fixture();try{
  await f.submit();await f.worker.start();await waitFor(()=>f.fake.calls.length===1);
  f.fake.push('prefix');await waitFor(async()=>(await f.pool.query("SELECT text FROM conversations_messages WHERE role='assistant'")).rows[0]?.text==='prefix');
  await f.pool.query('UPDATE conversations_intents SET lease_token=$1',[randomUUID()]);
  f.fake.push('stale');f.fake.push({finish:'done'});
  await waitFor(()=>f.fake.calls[0]!.signal.aborted);
  assert.equal((await f.pool.query("SELECT text FROM conversations_messages WHERE role='assistant'")).rows[0].text,'prefix');
  assert.equal(await f.state(),'running');
  f.advance(31000);await f.worker.poll();await waitFor(async()=>await f.state()==='interrupted');
  assert.equal(f.fake.calls.length,1);
 }finally{await f.close();}
});

test('turn_dispatch_application_starts_worker_and_drains_abort_before_database_shutdown',async()=>{
 const f=await fixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now,reply:f.fake.reply,resolver:async()=>[{address:'93.184.216.34',family:4}]});
 try{
  await f.submit();await app.start();await waitFor(()=>f.fake.calls.length===1);
  assert.equal(app.server.server.listening,true);
  await app.stop();await app.stop();assert.equal(f.fake.calls[0]!.signal.aborted,true);
  assert.equal(app.pool.ended,true);assert.equal(await f.state(),'interrupted');
 }finally{await app.stop();await f.close();}
});

test('turn_dispatch_stop_keeps_only_the_committed_prefix_and_delete_refuses_late_writes',async()=>{
 const f=await fixture();try{
  const accepted=await f.submit();await f.worker.start();await waitFor(()=>f.fake.calls.length===1);
  f.fake.push('prefix');await waitFor(async()=> (await f.service.snapshot(f.person.principal,f.topic.topicId)).entries.at(-1)?.text==='prefix');
  await f.service.cancelTurn(f.person.principal,f.topic.topicId,accepted.turnId);
  await waitFor(async()=>await f.state()==='cancelled');assert.equal(f.fake.calls[0]!.signal.aborted,true);
  assert.equal((await f.service.snapshot(f.person.principal,f.topic.topicId)).entries.at(-1)!.text,'prefix');
  await f.submit();await waitFor(()=>f.fake.calls.length===2);
  await f.service.deleteTopic(f.person.principal,f.topic.topicId,{confirm:true});await waitFor(()=>f.fake.calls[1]!.signal.aborted);
  f.fake.push('late');assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_events')).rows[0].n,0);
 }finally{await f.close();}
});

test('turn_dispatch_revoked_origin_and_removed_connection_abort_without_resurrection',async()=>{
 for(const revoke of ['logout','device','connection'] as const){
  const f=await fixture();try{
   await f.submit();await f.worker.start();await waitFor(()=>f.fake.calls.length===1);
   if(revoke==='logout')await f.identity.logout(f.person.principal);
   else if(revoke==='device')await f.devices.revoke(f.person.principal,f.person.principal.deviceId);
   else await f.providers.remove(f.person.principal,f.connection.connectionId);
   await waitFor(()=>f.fake.calls[0]!.signal.aborted);await waitFor(async()=>['error','cancelled'].includes(await f.state()));
   await f.login();await f.worker.poll();assert.equal(f.fake.calls.length,1);
  }finally{await f.close();}
 }
});

test('turn_dispatch_restart_interrupts_expired_claims_and_fences_old_tokens_without_redispatch',async()=>{
 const f=await fixture();try{
  await f.submit();await f.worker.start();await waitFor(()=>f.fake.calls.length===1);
  f.fake.push('committed');await waitFor(async()=>(await f.pool.query("SELECT text FROM conversations_messages WHERE role='assistant'")).rows[0]?.text==='committed');
  const oldToken=(await f.pool.query('SELECT lease_token FROM conversations_intents')).rows[0].lease_token;
  f.advance(31000);await f.worker.poll();await waitFor(async()=>await f.state()==='interrupted');
  f.fake.push('late');await f.worker.stop();
  const replacement=createTurnDispatcher(f.db,f.identity,f.providers,f.fake.reply,()=>f.now,{heartbeatMs:25,pollMs:20});
  await replacement.start();await replacement.poll();await replacement.stop();
  assert.equal(f.fake.calls.length,1);
  assert.equal((await f.pool.query("SELECT text,status FROM conversations_messages WHERE role='assistant'")).rows[0].text,'committed');
  assert.equal((await f.pool.query('SELECT state,lease_token FROM conversations_intents')).rows[0].state,'finished');
  assert.notEqual((await f.pool.query('SELECT lease_token FROM conversations_intents')).rows[0].lease_token,oldToken);
 }finally{await f.close();}
});

test('turn_dispatch_safe_provider_category_is_persisted_without_diagnostics_or_retry',async()=>{
 const f=await fixture();try{
  await f.submit();f.fake.push({finish:'error',category:'quota'});await f.worker.start();await waitFor(async()=>await f.state()==='error');
  const event=(await f.service.events(f.person.principal,f.topic.topicId,0)).events.at(-1)!;
  assert.equal(event.type==='turn_finished'&&event.code,'quota');assert.equal(f.fake.calls.length,1);
  assert.ok(!JSON.stringify(event).includes('synthetic-test-key'));
 }finally{await f.close();}
});

test('turn_dispatch_slow_resolution_cannot_renew_an_expired_lease_or_call_provider',async()=>{
 const f=await fixture();try{
  await f.submit();f.stallResolver();await f.worker.start();await waitFor(()=>f.resolving);
  f.advance(31000);f.releaseResolver();await f.worker.poll();
  await waitFor(async()=>await f.state()==='interrupted');assert.equal(f.fake.calls.length,0);
 }finally{await f.close();}
});

test('turn_dispatch_competing_workers_claim_one_provider_call_and_renew_thirty_second_lease',async()=>{
 const f=await fixture(),other=createTurnDispatcher(f.db,f.identity,f.providers,f.fake.reply,()=>f.now,{heartbeatMs:25,pollMs:20});
 try{
  await f.submit();await Promise.all([f.worker.start(),other.start()]);await waitFor(()=>f.fake.calls.length===1);
  f.advance(1000);
  await waitFor(async()=>new Date((await f.pool.query('SELECT lease_expires_at FROM conversations_intents')).rows[0].lease_expires_at).getTime()===f.now.getTime()+30000);
  f.fake.push({finish:'done'});await waitFor(async()=>await f.state()==='done');assert.equal(f.fake.calls.length,1);
 }finally{await other.stop();await f.close();}
});

test('turn_dispatch_final_commit_rechecks_origin_and_scrubs_untyped_provider_exceptions',async()=>{
 for(const mode of ['revoked','exception'] as const){
  const f=await fixture();
  const reply=mode==='exception'?async function*(){throw new Error('synthetic-test-key provider body');}:f.fake.reply;
  const worker=createTurnDispatcher(f.db,f.identity,f.providers,reply,()=>f.now,{heartbeatMs:5000,pollMs:20});
  try{
   await f.submit();await worker.start();
   if(mode==='revoked'){await waitFor(()=>f.fake.calls.length===1);await f.identity.logout(f.person.principal);f.fake.push({finish:'done'});}
   await waitFor(async()=>await f.state()===(mode==='revoked'?'cancelled':'error'));
   const rows=(await f.pool.query('SELECT payload FROM conversations_events ORDER BY seq')).rows;
   assert.equal(rows.at(-1)!.payload.code,mode==='revoked'?'unauthorized':'network');
   assert.ok(!JSON.stringify(rows).includes('synthetic-test-key'));assert.ok(!JSON.stringify(rows).includes('provider body'));
  }finally{await worker.stop();await f.close();}
 }
});

test('turn_dispatch_fixture_uses_utf8_in_both_owned_postgres_modes',async()=>{
 const base=await postgresFixture(),previous=process.env.B1_TEST_PG_ADMIN;
 let nested:Awaited<ReturnType<typeof postgresFixture>>|undefined;
 try{
  assert.equal((await base.pool.query('SHOW server_encoding')).rows[0].server_encoding,'UTF8');
  process.env.B1_TEST_PG_ADMIN=base.url;nested=await postgresFixture();
  assert.equal((await nested.pool.query('SHOW server_encoding')).rows[0].server_encoding,'UTF8');
  assert.equal((await nested.pool.query("SELECT length('😀') AS n")).rows[0].n,1);
 }finally{if(previous===undefined)delete process.env.B1_TEST_PG_ADMIN;else process.env.B1_TEST_PG_ADMIN=previous;await nested?.close();await base.close();}
});

test('turn_dispatch_lease_expiring_while_waiting_for_row_locks_refuses_late_delta',async()=>{
 const f=await fixture(),worker=createTurnDispatcher(f.db,f.identity,f.providers,f.fake.reply,()=>f.now,{heartbeatMs:5000,pollMs:20,coalesceMs:20});
 const lock=await f.pool.connect();
 try{
  await f.submit();await worker.start();await waitFor(()=>f.fake.calls.length===1);
  await lock.query('BEGIN');await lock.query('SELECT turn_id FROM conversations_intents FOR UPDATE');
  f.fake.push('late');
  await waitFor(async()=>(await f.pool.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE state='active' AND wait_event_type='Lock' AND query ILIKE '%conversations_intents%for update%') AS blocked")).rows[0].blocked);
  f.advance(31000);await lock.query('COMMIT');
  await waitFor(async()=>{const row=(await f.pool.query('SELECT lease_expires_at FROM conversations_intents')).rows[0];if(row.lease_expires_at&&new Date(row.lease_expires_at)>f.now)assert.fail(JSON.stringify({lease:row.lease_expires_at,now:f.now,state:await f.state()}));return await f.state()==='interrupted';});
  assert.equal((await f.pool.query("SELECT text FROM conversations_messages WHERE role='assistant'")).rows[0].text,'');
 }finally{await lock.query('ROLLBACK');lock.release();await worker.stop();await f.close();}
});
