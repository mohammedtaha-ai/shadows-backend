import { sql, type Transaction, type Selectable } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
import type { TopicEvent, MessageEntry } from './model.js';
type Tx=Transaction<Database>;
export type TopicRow=Selectable<Database['conversations_topics']>;
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
}
