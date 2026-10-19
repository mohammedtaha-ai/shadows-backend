import {sql,type Kysely,type Insertable} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
export class AssistantStore{
 async lock(db:Kysely<Database>,accountId:string){await sql`select pg_advisory_xact_lock(hashtextextended(${`assistant:${accountId}`},0))`.execute(db);}
 conversation(db:Kysely<Database>,accountId:string,id:string){return db.selectFrom('assistant_conversations').selectAll().where('account_id','=',accountId).where('id','=',id).executeTakeFirst();}
 byCommand(db:Kysely<Database>,accountId:string,commandId:string){return db.selectFrom('assistant_conversations').selectAll().where('account_id','=',accountId).where('command_id','=',commandId).executeTakeFirst();}
 list(db:Kysely<Database>,accountId:string){return db.selectFrom('assistant_conversations').selectAll().where('account_id','=',accountId).orderBy('updated_at','desc').orderBy('id').limit(100).execute();}
 create(db:Kysely<Database>,row:Insertable<Database['assistant_conversations']>){return db.insertInto('assistant_conversations').values(row).returningAll().executeTakeFirstOrThrow();}
 turns(db:Kysely<Database>,conversationId:string){return db.selectFrom('assistant_turns').selectAll().where('conversation_id','=',conversationId).orderBy('created_at','desc').orderBy('id','desc').limit(31).execute();}
 turn(db:Kysely<Database>,conversationId:string,id:string){return db.selectFrom('assistant_turns').selectAll().where('conversation_id','=',conversationId).where('id','=',id).executeTakeFirst();}
 turnCommand(db:Kysely<Database>,accountId:string,commandId:string){return db.selectFrom('assistant_turns').selectAll().where('account_id','=',accountId).where('command_id','=',commandId).executeTakeFirst();}
 active(db:Kysely<Database>,conversationId:string){return db.selectFrom('assistant_turns').select('id').where('conversation_id','=',conversationId).where('state','in',['submitting','running','unknown','stopping']).executeTakeFirst();}
 insertTurn(db:Kysely<Database>,row:{id:string;account_id:string;conversation_id:string;command_id:string;fingerprint:string;input:string;output:string;run_id:null;state:string;created_at:Date;updated_at:Date}){return db.insertInto('assistant_turns').values(row).returningAll().executeTakeFirstOrThrow();}
 update(db:Kysely<Database>,id:string,patch:{state?:string;run_id?:string;output?:string;updated_at:Date}){return db.updateTable('assistant_turns').set(patch).where('id','=',id).execute();}
 refresh(db:Kysely<Database>,id:string,expectedState:string,patch:{state:string;output:string;updated_at:Date}){return db.updateTable('assistant_turns').set(patch).where('id','=',id).where('state','=',expectedState).execute();}
 touch(db:Kysely<Database>,id:string,now:Date){return db.updateTable('assistant_conversations').set({updated_at:now}).where('id','=',id).execute();}
}
