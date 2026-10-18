import { createHash, randomUUID } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import { NYLRA_INSTRUCTIONS } from 'aylul-brain';
import type { Database } from '../../platform/database/schema.js';
import type { IdentityService, Principal } from '../identity/index.js';
import type { ProviderSettingsService } from '../provider-settings/index.js';
import type { ActivityService } from '../activity/index.js';
import type { TopicCreate, TopicView, TurnRequest, TurnAccepted, MessageEntry } from './model.js';
import { ConversationStore, type TopicRow } from './store.js';
type Tx=Transaction<Database>;
const allowed=new Set(['unauthorized','operation_failed','not_found','request_invalid','no_connection','command_conflict','generation_busy','context_too_large','resnapshot_required','cursor_exhausted']);
const fingerprint=(input:unknown)=>createHash('sha256').update(JSON.stringify(input)).digest('hex');
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function sequence(value:string){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new Error('cursor_exhausted');return n;}
function next(row:TopicRow){const n=sequence(row.high_water)+1;if(!Number.isSafeInteger(n))throw new Error('cursor_exhausted');return n;}
const view=(r:TopicRow):TopicView=>({topicId:r.id,title:r.title,project:null,state:'open',connectionId:r.connection_id,model:r.model,createdAt:r.created_at.toISOString(),updatedAt:r.updated_at.toISOString(),lastSeq:sequence(r.high_water)});
export function createConversations(db:Kysely<Database>,identity:Pick<IdentityService,'authorizeTransaction'>,providers:Pick<ProviderSettingsService,'selectForTopic'>,activity:Pick<ActivityService,'append'|'cursor'>,clock:()=>Date=()=>new Date()){
 const store=new ConversationStore();
 const run=async<T>(p:Principal,fn:(tx:Tx)=>Promise<T>)=>{try{return await db.transaction().execute(async tx=>{await identity.authorizeTransaction(tx,p);await store.guard(tx,p.accountId);return fn(tx);});}catch(e){throw new Error(e instanceof Error&&allowed.has(e.message)?e.message:'operation_failed');}};
 const requireTopic=async(tx:Tx,p:Principal,id:string)=>{if(!uuid(id))throw new Error('not_found');const r=await store.topic(tx,p.accountId,id);if(!r)throw new Error('not_found');return r;};
 const connection=(tx:Tx,p:Principal,id:string|undefined)=>providers.selectForTopic(tx,p.accountId,id);
 const replay=async<T>(tx:Tx,p:Principal,op:'topic'|'turn',id:string,hash:string)=>{const receipt=await store.receipt(tx,p.accountId,op,id);if(receipt&&receipt.fingerprint!==hash)throw new Error('command_conflict');return receipt?.result as T|undefined;};
 return {
  createTopic(p:Principal,input:TopicCreate){return run(p,async tx=>{
   if(!input||!uuid(input.commandId)||Object.keys(input).some(k=>!['commandId','title','connectionId'].includes(k))||(input.title!==undefined&&(typeof input.title!=='string'||!input.title.length||input.title.length>200))||(input.connectionId!==undefined&&!uuid(input.connectionId)))throw new Error('request_invalid');
   const hash=fingerprint([input.title??null,input.connectionId??null]),prior=await replay<TopicView>(tx,p,'topic',input.commandId,hash);if(prior)return prior;
   const c=await connection(tx,p,input.connectionId),now=clock(),row=await store.insertTopic(tx,{id:randomUUID(),account_id:p.accountId,title:input.title??'New conversation',connection_id:c.connectionId,connection_revision:c.revision,model:c.model,created_at:now,updated_at:now});
   const result=view(row);await store.saveReceipt(tx,p.accountId,'topic',input.commandId,row.id,hash,result);return result;
  });},
  list(p:Principal){return run(p,async tx=>({topics:(await store.list(tx,p.accountId)).map(view),cursor:await activity.cursor(tx,p.accountId)}));},
  snapshot(p:Principal,id:string){return run(p,async tx=>{const row=await requireTopic(tx,p,id);const entries=(await store.messages(tx,id)).map(r=>({entryId:r.id,turnId:r.turn_id,seq:sequence(r.seq),createdAt:r.created_at.toISOString(),text:r.text,...(r.role==='user'?{type:'user_message' as const}:{type:'assistant_message' as const,status:r.status,answeredBy:'cloud' as const,sources:[] as never[]})}));return {topic:view(row),entries,cursor:sequence(row.high_water)};});},
  createTurn(p:Principal,id:string,input:TurnRequest){return run(p,async tx=>{
   const row=await requireTopic(tx,p,id);
   if(!input||!uuid(input.commandId)||typeof input.message!=='string'||!input.message.length||input.message.length>2000||Object.keys(input).some(k=>!['commandId','message'].includes(k)))throw new Error('request_invalid');
   const hash=fingerprint([id,input.message]),prior=await replay<TurnAccepted>(tx,p,'turn',input.commandId,hash);if(prior)return prior;
   const selected=await connection(tx,p,row.connection_id);
   if(selected.revision!==sequence(row.connection_revision))throw new Error('command_conflict');
   const active=await store.active(tx,p.accountId);if(active.length>=2||active.some(t=>t.topic_id===id))throw new Error('generation_busy');
   const history=(await store.messages(tx,id)).map(m=>({role:m.role,content:m.text})),messages=[{role:'system',content:NYLRA_INSTRUCTIONS},...history,{role:'user',content:input.message}];
   if(messages.length>100||Buffer.byteLength(JSON.stringify(messages),'utf8')>65536)throw new Error('context_too_large');
   const now=clock(),turnId=randomUUID(),entry:MessageEntry={type:'user_message',entryId:randomUUID(),turnId,seq:next(row),createdAt:now.toISOString(),text:input.message};
   await store.addTurn(tx,{id:turnId,topic_id:id,account_id:p.accountId,origin_device_id:p.deviceId,origin_session_id:p.sessionId,connection_id:row.connection_id,connection_revision:sequence(row.connection_revision),model:row.model,created_at:now},entry);
   await store.append(tx,id,{type:'entry_added',seq:entry.seq,entry},now);const result={turnId,entryId:entry.entryId,seq:entry.seq};await store.saveReceipt(tx,p.accountId,'turn',input.commandId,id,hash,result);return result;
  });},
  changeConnection(p:Principal,id:string,input:{connectionId:string;transferAcknowledged:boolean}){return run(p,async tx=>{const row=await requireTopic(tx,p,id);if(!input||input.transferAcknowledged!==true||!uuid(input.connectionId))throw new Error('request_invalid');if((await store.active(tx,p.accountId)).some(t=>t.topic_id===id))throw new Error('generation_busy');const c=await connection(tx,p,input.connectionId);await store.changeConnection(tx,id,c);const now=clock(),topic={...view(row),connectionId:c.connectionId,model:c.model,lastSeq:next(row),updatedAt:now.toISOString()};await store.append(tx,id,{type:'topic_updated',seq:topic.lastSeq,topic},now);return topic;});},
  events(p:Principal,id:string,after:number,limit=100){return run(p,async tx=>{const row=await requireTopic(tx,p,id),floor=sequence(row.floor),highWater=sequence(row.high_water);if(!Number.isSafeInteger(after)||after<floor||after>highWater)throw new Error('resnapshot_required');if(!Number.isInteger(limit)||limit<1)throw new Error('request_invalid');return {events:await store.events(tx,id,after,Math.min(100,limit)),highWater,floor};});},
  deleteTopic(p:Principal,id:string,input:{confirm:boolean}){return run(p,async tx=>{await requireTopic(tx,p,id);if(input?.confirm!==true)throw new Error('request_invalid');await store.remove(tx,id);await activity.append(tx,p.accountId,[{type:'topic_deleted',laptopId:null,sessionId:null,payload:{topicId:id},expiresAt:new Date(clock().getTime()+7*86400000)}]);});},
 };
}
export type ConversationsService=ReturnType<typeof createConversations>;
