import { randomUUID } from 'node:crypto';
import { sql, type Kysely, type Transaction, type Selectable } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
import type { TopicEvent, MessageEntry, TurnCompletion } from './model.js';
type Tx=Transaction<Database>;
export type TopicRow=Selectable<Database['conversations_topics']>;
export type TurnRow=Selectable<Database['conversations_turns']>;
export type DispatchClaim={turn:TurnRow;token:string;entryId:string};
export class ConversationStore {
 async guard(tx:Tx,accountId:string){await sql`select pg_advisory_xact_lock(hashtextextended(${`conversations:${accountId}`},0))`.execute(tx);}
 async topic(tx:Tx,accountId:string,id:string){return tx.selectFrom('conversations_topics').selectAll().where('id','=',id).where('account_id','=',accountId).forUpdate().executeTakeFirst();}
 async list(tx:Tx,accountId:string){return tx.selectFrom('conversations_topics').selectAll().where('account_id','=',accountId).orderBy('updated_at','desc').orderBy('id').limit(200).execute();}
 async receipt(tx:Tx,accountId:string,operation:'topic'|'turn',commandId:string){return tx.selectFrom('conversations_receipts').selectAll().where('account_id','=',accountId).where('operation','=',operation).where('command_id','=',commandId).executeTakeFirst();}
 async saveReceipt(tx:Tx,accountId:string,operation:'topic'|'turn',commandId:string,topicId:string,fingerprint:string,result:unknown){await tx.insertInto('conversations_receipts').values({account_id:accountId,operation,command_id:commandId,topic_id:topicId,fingerprint,result}).execute();}
 async insertTopic(tx:Tx,row:{id:string;account_id:string;title:string;connection_id:string;connection_revision:number;model:string;created_at:Date;updated_at:Date}){return tx.insertInto('conversations_topics').values(row).returningAll().executeTakeFirstOrThrow();}
 async active(tx:Tx,accountId:string){return tx.selectFrom('conversations_turns').select(['id','topic_id']).where('account_id','=',accountId).where('state','in',['accepted','running']).execute();}
 async messages(tx:Tx,topicId:string){return tx.selectFrom('conversations_messages').selectAll().where('topic_id','=',topicId).orderBy('seq').execute();}
 async addTurn(tx:Tx,input:{id:string;topic_id:string;account_id:string;origin_device_id:string;origin_session_id:string;connection_id:string;connection_revision:number;model:string;created_at:Date},entry:MessageEntry){
  await tx.insertInto('conversations_turns').values({...input,state:'accepted',cancel_requested:false}).execute();
  await tx.insertInto('conversations_messages').values({id:entry.entryId,topic_id:input.topic_id,turn_id:input.id,role:'user',text:entry.text,status:'complete',seq:entry.seq,created_at:input.created_at}).execute();
  await tx.insertInto('conversations_intents').values({turn_id:input.id,topic_id:input.topic_id,state:'pending',lease_token:null,lease_expires_at:null}).execute();
 }
 async append(tx:Tx,topicId:string,event:TopicEvent,now:Date){await tx.insertInto('conversations_events').values({topic_id:topicId,seq:event.seq,payload:event}).execute();await tx.updateTable('conversations_topics').set({high_water:event.seq,updated_at:now}).where('id','=',topicId).execute();}
 async changeConnection(tx:Tx,id:string,connection:{connectionId:string;revision:number;model:string}){await tx.updateTable('conversations_topics').set({connection_id:connection.connectionId,connection_revision:connection.revision,model:connection.model}).where('id','=',id).execute();}
 async events(tx:Tx,id:string,after:number,limit:number){return (await tx.selectFrom('conversations_events').select('payload').where('topic_id','=',id).where('seq','>',String(after)).orderBy('seq').limit(limit).execute()).map(r=>r.payload as TopicEvent);}
 async remove(tx:Tx,id:string){await tx.updateTable('conversations_turns').set({cancel_requested:true}).where('topic_id','=',id).where('state','in',['accepted','running']).execute();await tx.deleteFrom('conversations_topics').where('id','=',id).execute();}
 async turn(tx:Tx,topicId:string,id:string){return tx.selectFrom('conversations_turns').selectAll().where('topic_id','=',topicId).where('id','=',id).forUpdate().executeTakeFirst();}
 async cancel(tx:Tx,id:string){await tx.updateTable('conversations_turns').set({cancel_requested:true}).where('id','=',id).where('state','in',['accepted','running']).execute();}
 async candidates(db:Kysely<Database>,now:Date){return db.selectFrom('conversations_intents').innerJoin('conversations_turns','conversations_turns.id','conversations_intents.turn_id').select(['conversations_turns.id','conversations_turns.topic_id','conversations_turns.account_id']).where(eb=>eb.or([eb('conversations_intents.state','=','pending'),eb.and([eb('conversations_intents.state','=','claimed'),eb('conversations_intents.lease_expires_at','<=',now)])])).orderBy('conversations_turns.created_at').orderBy('conversations_turns.id').limit(100).execute();}
 async intent(tx:Tx,id:string){return tx.selectFrom('conversations_intents').selectAll().where('turn_id','=',id).forUpdate().executeTakeFirst();}
 async claim(tx:Tx,topic:TopicRow,turn:TurnRow,now:Date):Promise<DispatchClaim|undefined>{
  const intent=await this.intent(tx,turn.id);if(intent?.state!=='pending')return;
  const token=randomUUID(),entryId=randomUUID(),seq=Number(topic.high_water)+1;
  if(!Number.isSafeInteger(seq))throw new Error('cursor_exhausted');
  await tx.updateTable('conversations_intents').set({state:'claimed',lease_token:token,lease_expires_at:new Date(now.getTime()+30000)}).where('turn_id','=',turn.id).execute();
  await tx.updateTable('conversations_turns').set({state:'running'}).where('id','=',turn.id).execute();
  const entry:MessageEntry={type:'assistant_message',entryId,turnId:turn.id,text:'',status:'streaming',answeredBy:'cloud',sources:[],seq,createdAt:now.toISOString()};
  await tx.insertInto('conversations_messages').values({id:entryId,topic_id:topic.id,turn_id:turn.id,role:'assistant',text:'',status:'streaming',seq,created_at:now}).execute();
  await this.append(tx,topic.id,{type:'entry_added',seq,entry},now);return {turn:{...turn,state:'running'},token,entryId};
 }
 async fenced(tx:Tx,claim:DispatchClaim,clock:()=>Date){
  const topic=await this.topic(tx,claim.turn.account_id,claim.turn.topic_id);if(!topic)throw new Error('not_found');
  const turn=await this.turn(tx,topic.id,claim.turn.id),intent=await this.intent(tx,claim.turn.id);
  if(!turn||turn.state!=='running'||intent?.state!=='claimed'||intent.lease_token!==claim.token||!intent.lease_expires_at||intent.lease_expires_at<=clock())throw new Error('lease_lost');
  return {topic,turn,intent};
 }
 async renew(tx:Tx,claim:DispatchClaim,now:Date){const row=await tx.updateTable('conversations_intents').set({lease_expires_at:new Date(now.getTime()+30000)}).where('turn_id','=',claim.turn.id).where('state','=','claimed').where('lease_token','=',claim.token).where('lease_expires_at','>',now).returning('turn_id').executeTakeFirst();if(!row)throw new Error('lease_lost');}
 async assistant(tx:Tx,turnId:string){return tx.selectFrom('conversations_messages').selectAll().where('turn_id','=',turnId).where('role','=','assistant').executeTakeFirstOrThrow();}
 async delta(tx:Tx,topic:TopicRow,claim:DispatchClaim,text:string,now:Date){
  const message=await this.assistant(tx,claim.turn.id),seq=Number(topic.high_water)+1;
  if(!Number.isSafeInteger(seq)||message.text.length+text.length>16000||Buffer.byteLength(text)>4000)throw new Error('operation_failed');
  await tx.updateTable('conversations_messages').set({text:message.text+text}).where('id','=',message.id).execute();
  await this.append(tx,topic.id,{type:'delta',seq,entryId:message.id,text},now);
 }
 async finish(tx:Tx,topic:TopicRow,turn:TurnRow,completion:TurnCompletion,now:Date){
  const message=await this.assistant(tx,turn.id),seq=Number(topic.high_water)+1;
  if(!Number.isSafeInteger(seq+1))throw new Error('cursor_exhausted');
  const status=completion.partial?'partial':'complete';
  await tx.updateTable('conversations_messages').set({status}).where('id','=',message.id).execute();
  const entry:MessageEntry={type:'assistant_message',entryId:message.id,turnId:turn.id,seq:Number(message.seq),text:message.text,status,answeredBy:'cloud',sources:[],createdAt:message.created_at.toISOString()};
  await this.append(tx,topic.id,{type:'entry_updated',seq,entry},now);
  await this.append(tx,topic.id,{type:'turn_finished',seq:seq+1,turnId:turn.id,connectionId:turn.connection_id,model:turn.model,outcome:completion.outcome,...(completion.code?{code:completion.code}:{})},now);
  await tx.updateTable('conversations_turns').set({state:completion.state}).where('id','=',turn.id).execute();
  await tx.updateTable('conversations_intents').set({state:'finished',lease_token:null,lease_expires_at:null}).where('turn_id','=',turn.id).execute();
 }
}
