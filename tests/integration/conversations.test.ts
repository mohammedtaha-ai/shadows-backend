import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { identityFixture } from './fixtures/identity.js';
import { createProviderSettings } from '../../src/modules/provider-settings/index.js';
import { createActivity } from '../../src/modules/activity/index.js';
import { createConversations } from '../../src/modules/conversations/index.js';
import { compose } from '../../src/app/compose.js';
import { NYLRA_INSTRUCTIONS } from 'aylul-brain';

async function fixture() {
  const f = await identityFixture(), person = await f.login();
  const providers = createProviderSettings(f.db, f.identity,
    { activeKeyId: 'test', keys: new Map([['test', randomBytes(32)]]) }, async () => [{ address:'93.184.216.34',family:4 }]);
  const activity = createActivity(f.db, () => f.now);
  const service = createConversations(f.db, f.identity, providers, activity, () => f.now, NYLRA_INSTRUCTIONS);
  const connection = await providers.create(person.principal, { name:'one',format:'openai_compatible',baseUrl:'https://example.test/v1',model:'test-model',apiKey:'synthetic' });
  await providers.setDefault(person.principal, connection.connectionId);
  return { ...f, person, providers, activity, service, connection };
}
const command = (message='hello') => ({ commandId:randomUUID(),message });
const topic = () => ({ commandId:randomUUID(),title:'Synthetic topic' });

test('conversations_scope_default_pinning_transfer_and_command_replay', async () => {
  const f=await fixture(); try {
    const p=f.person.principal, request=topic(), first=await f.service.createTopic(p,request);
    assert.deepEqual(await f.service.createTopic(p,request),first);
    await assert.rejects(f.service.createTopic(p,{...request,title:'changed'}),{message:'command_conflict'});
    const second=await f.providers.create(p,{name:'two',format:'openai_compatible',baseUrl:'https://example.test/v1',model:'second',apiKey:'synthetic'});
    await f.providers.setDefault(p,second.connectionId);
    assert.equal((await f.service.snapshot(p,first.topicId)).topic.connectionId,f.connection.connectionId);
    assert.equal((await f.service.createTopic(p,topic())).connectionId,second.connectionId);
    await assert.rejects(f.service.changeConnection(p,first.topicId,{connectionId:second.connectionId,transferAcknowledged:false}),{message:'request_invalid'});
    await f.service.changeConnection(p,first.topicId,{connectionId:second.connectionId,transferAcknowledged:true});
    const turn=command(), accepted=await f.service.createTurn(p,first.topicId,turn);
    assert.deepEqual(await f.service.createTurn(p,first.topicId,turn),accepted);
    await assert.rejects(f.service.createTurn(p,first.topicId,{...turn,message:'changed'}),{message:'command_conflict'});
    await assert.rejects(f.service.changeConnection(p,first.topicId,{connectionId:f.connection.connectionId,transferAcknowledged:true}),{message:'generation_busy'});
    const stored=(await f.pool.query('SELECT * FROM conversations_turns')).rows[0];
    assert.equal(stored.connection_id,second.connectionId);assert.equal(Number(stored.connection_revision),1);
    assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_intents')).rows[0].n,1);
    f.setSubject('other');const other=await f.login();
    await assert.rejects(f.service.createTopic(other.principal,{...topic(),connectionId:second.connectionId}),{message:'not_found'});
    for(const action of [()=>f.service.snapshot(other.principal,first.topicId),()=>f.service.events(other.principal,first.topicId,0),()=>f.service.createTurn(other.principal,first.topicId,command()),()=>f.service.deleteTopic(other.principal,first.topicId,{confirm:true})]) await assert.rejects(action(),{message:'not_found'});
    await f.providers.remove(p,second.connectionId);await f.providers.remove(p,f.connection.connectionId);
    await assert.rejects(f.service.createTopic(p,topic()),{message:'no_connection'});
  } finally {await f.close();}
});

test('conversations_rollback_keeps_admission_and_deletion_atomic_and_selects_metadata_without_decryption',async()=>{
 const f=await fixture();try {
  const p=f.person.principal;
  await f.providers.update(p,f.connection.connectionId,{name:'updated',model:'updated-model'});
  await f.pool.query('UPDATE provider_settings_connections SET sealed_key=$1',['synthetic-invalid-seal']);
  const t=await f.service.createTopic(p,topic());
  assert.equal(t.model,'updated-model');
  assert.equal(Number((await f.pool.query('SELECT connection_revision FROM conversations_topics')).rows[0].connection_revision),2);
  await f.pool.query("CREATE FUNCTION reject_conversation_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic rollback'; END $$");
  await f.pool.query('CREATE TRIGGER reject_event BEFORE INSERT ON conversations_events FOR EACH ROW EXECUTE FUNCTION reject_conversation_event()');
  const request=command();await assert.rejects(f.service.createTurn(p,t.topicId,request),{message:'operation_failed'});
  for(const table of ['messages','turns','intents','events']) assert.equal((await f.pool.query(`SELECT count(*)::int n FROM conversations_${table}`)).rows[0].n,0);
  assert.equal((await f.pool.query("SELECT count(*)::int n FROM conversations_receipts WHERE operation='turn'")).rows[0].n,0);
  await f.pool.query('DROP TRIGGER reject_event ON conversations_events');
  await f.service.createTurn(p,t.topicId,request);
  await f.pool.query('CREATE TRIGGER reject_activity BEFORE INSERT ON activity_events FOR EACH ROW EXECUTE FUNCTION reject_conversation_event()');
  await assert.rejects(f.service.deleteTopic(p,t.topicId,{confirm:true}),{message:'operation_failed'});
  assert.equal((await f.service.snapshot(p,t.topicId)).entries.length,1);
  assert.equal((await f.pool.query('SELECT cancel_requested FROM conversations_turns')).rows[0].cancel_requested,false);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_intents')).rows[0].n,1);
 }finally{await f.close();}
});

test('conversations_serializes_busy_limits_and_atomic_receipts',async()=>{
 const f=await fixture();try {
  const p=f.person.principal, topics=await Promise.all([1,2,3].map(()=>f.service.createTopic(p,topic())));
  const input=command(), same=await Promise.all([f.service.createTurn(p,topics[0]!.topicId,input),f.service.createTurn(p,topics[0]!.topicId,input)]);
  assert.deepEqual(same[0],same[1]);
  await assert.rejects(f.service.createTurn(p,topics[0]!.topicId,command()),{message:'generation_busy'});
  const results=await Promise.allSettled(topics.slice(1).map(t=>f.service.createTurn(p,t.topicId,command())));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.message,'generation_busy');
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_messages')).rows[0].n,2);
  assert.equal((await f.pool.query("SELECT count(*)::int n FROM conversations_receipts WHERE operation='turn'")).rows[0].n,2);
 }finally{await f.close();}
});

test('conversations_admission_refuses_removed_or_superseded_connection_until_acknowledged_reselection',async()=>{
 const f=await fixture();try {
  const p=f.person.principal,t=await f.service.createTopic(p,topic());
  await f.providers.update(p,f.connection.connectionId,{model:'new-model'});
  await assert.rejects(f.service.createTurn(p,t.topicId,command()),{message:'command_conflict'});
  await f.service.changeConnection(p,t.topicId,{connectionId:f.connection.connectionId,transferAcknowledged:true});
  await f.service.createTurn(p,t.topicId,command());
  const another=await f.service.createTopic(p,topic());
  await f.providers.remove(p,f.connection.connectionId);
  await assert.rejects(f.service.createTurn(p,another.topicId,command()),{message:'not_found'});
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_intents')).rows[0].n,1);
 }finally{await f.close();}
});

test('conversations_refuses_complete_context_overflow_without_partial_writes',async()=>{
 const f=await fixture();try {
  const p=f.person.principal,t=await f.service.createTopic(p,topic());
  // Owned synthetic historical messages; no worker or provider involved in B-7.
  for(let i=0;i<100;i++) await f.pool.query("INSERT INTO conversations_messages(id,topic_id,turn_id,role,text,status,seq,created_at) VALUES($1,$2,$3,'user',$4,'complete',$5,now())",[randomUUID(),t.topicId,randomUUID(),'history',i+1]);
  await assert.rejects(f.service.createTurn(p,t.topicId,command()),{message:'context_too_large'});
  await f.pool.query('DELETE FROM conversations_messages');
  for(let i=0;i<5;i++)await f.pool.query("INSERT INTO conversations_messages(id,topic_id,turn_id,role,text,status,seq,created_at) VALUES($1,$2,$3,'assistant',$4,'complete',$5,now())",[randomUUID(),t.topicId,randomUUID(),'😀'.repeat(4000),i+1]);
  await assert.rejects(f.service.createTurn(p,t.topicId,command()),{message:'context_too_large'});
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_turns')).rows[0].n,0);
  assert.equal((await f.pool.query('SELECT count(*)::int n FROM conversations_intents')).rows[0].n,0);
 }finally{await f.close();}
});

test('conversations_journal_floor_delete_purges_owned_rows_and_publishes_activity',async()=>{
 const f=await fixture();try {
  const p=f.person.principal,t=await f.service.createTopic(p,topic());
  await f.service.createTurn(p,t.topicId,command());
  const snapshot=await f.service.snapshot(p,t.topicId),page=await f.service.events(p,t.topicId,0);
  assert.equal(page.highWater,snapshot.cursor);assert.equal(page.events.at(-1)!.seq,snapshot.cursor);
  await f.pool.query('UPDATE conversations_topics SET floor=1 WHERE id=$1',[t.topicId]);
  await assert.rejects(f.service.events(p,t.topicId,0),{message:'resnapshot_required'});
  await assert.rejects(f.service.deleteTopic(p,t.topicId,{confirm:false}),{message:'request_invalid'});
  await f.service.deleteTopic(p,t.topicId,{confirm:true});
  for(const table of ['topics','messages','turns','intents','events','receipts']) assert.equal((await f.pool.query(`SELECT count(*)::int n FROM conversations_${table}`)).rows[0].n,0);
  await assert.rejects(f.service.snapshot(p,t.topicId),{message:'not_found'});
  await assert.rejects(f.service.createTurn(p,t.topicId,command()),{message:'not_found'});
  const events=await f.db.transaction().execute(tx=>f.activity.read(tx,p.accountId,0,100));
  assert.equal(events.events.length,1);assert.equal(events.events[0]!.type,'topic_deleted');
  assert.equal(events.events[0]!.laptopId,null);assert.deepEqual(events.events[0]!.payload,{topicId:t.topicId});
 }finally{await f.close();}
});

test('topic_deleted_replays_over_account_sse_without_laptop_authority',async()=>{
 const f=await fixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 const abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),5000);
 try {
  const p=f.person.principal,t=await f.service.createTopic(p,topic());
  await f.service.deleteTopic(p,t.topicId,{confirm:true});
  const address=await app.server.listen({host:'127.0.0.1',port:0});
  const response=await fetch(`${address}/v1/nylra/events?after=0`,{headers:{authorization:`Bearer ${f.person.handle}`},signal:abort.signal});
  assert.equal(response.status,200);
  const reader=response.body!.getReader();let data='';
  while(!data.includes('\n\n')){const part=await reader.read();assert.equal(part.done,false);data+=new TextDecoder().decode(part.value);}
  assert.ok(data.includes('event: topic_deleted'));assert.ok(data.includes(t.topicId));
  assert.ok(!data.includes('laptopId'));abort.abort();await reader.cancel().catch(()=>{});
 }finally{clearTimeout(deadline);abort.abort();await app.stop();await f.close();}
});
