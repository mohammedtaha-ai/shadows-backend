import {createHash,randomUUID} from 'node:crypto';
import type {Kysely,Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {IdentityService,Principal} from '../identity/index.js';
import type {createHermesClient} from '../../integrations/hermes/client.js';
import type {AssistantConversation,AssistantSnapshot,AssistantState} from './model.js';
import {AssistantStore} from './store.js';
type Client=ReturnType<typeof createHermesClient>;
const uuid=(id:string)=>{if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('request_invalid');};
const active=(state:string)=>['submitting','running','unknown','stopping'].includes(state);
const conversation=(row:{id:string;title:string;created_at:Date;updated_at:Date}):AssistantConversation=>({id:row.id,title:row.title,createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString()});
export function createAssistant(db:Kysely<Database>,identity:Pick<IdentityService,'authorizeTransaction'>,client:Client|null,clock:()=>Date=()=>new Date()){
 const store=new AssistantStore();
 const transaction=<T>(p:Principal,work:(tx:Transaction<Database>)=>Promise<T>)=>db.transaction().execute(async tx=>{await identity.authorizeTransaction(tx,p);return work(tx);});
 const owned=async(tx:Kysely<Database>,p:Principal,id:string)=>{uuid(id);const row=await store.conversation(tx,p.accountId,id);if(!row)throw new Error('not_found');return row;};
 async function snapshot(p:Principal,id:string):Promise<AssistantSnapshot>{
  const current=await transaction(p,async tx=>{const c=await owned(tx,p,id);return {c,turns:await store.turns(tx,c.id)};});
  let connection:AssistantSnapshot['connection']=client?'ready':'unconfigured';
  for(const turn of current.turns.filter(t=>active(t.state))){
   if(!turn.run_id){if(turn.state==='submitting'&&clock().getTime()-turn.updated_at.getTime()>30000)await transaction(p,tx=>store.update(tx,turn.id,{state:'unknown',updated_at:clock()}));continue;}
   if(!client)continue;
   try{const run=await client.getRun(turn.run_id,current.c.session_id);
    const state=run.state==='completed'?(run.completed===false?'error':'done'):run.state==='cancelled'?'cancelled':['failed','interrupted'].includes(run.state)?'error':run.state==='stopping'?'stopping':'running';
    await transaction(p,async tx=>{await owned(tx,p,id);await store.refresh(tx,turn.id,turn.state,{state,output:run.output??turn.output,updated_at:clock()});});
   }catch(error){if(error instanceof Error&&error.message==='unauthorized')throw error;connection='offline';}
  }
  return transaction(p,async tx=>{const c=await owned(tx,p,id);const rows=await store.turns(tx,id);let bytes=0,truncated=rows.length>30;
   const turns=[];for(const t of rows.slice(0,30)){const space=12000-bytes-Buffer.byteLength(t.input);if(space<0){truncated=true;break;}
    const output=Buffer.byteLength(t.output)>space?Buffer.from(t.output).subarray(0,space).toString('utf8'):t.output;
    bytes+=Buffer.byteLength(t.input+output);if(output!==t.output)truncated=true;
    turns.push({id:t.id,commandId:t.command_id,input:t.input,output,state:t.state as AssistantState,createdAt:t.created_at.toISOString()});}
   return {conversation:conversation(c),turns:turns.reverse(),truncated,connection};});
 }
 async function dispatch(p:Principal,id:string,turnId:string){
  const data=await transaction(p,async tx=>{const c=await owned(tx,p,id);const t=await store.turn(tx,id,turnId);if(!t)throw new Error('not_found');return {c,t};});
  if(!client){await store.update(db,turnId,{state:'error',updated_at:clock()});return snapshot(p,id);}
  try{
   const cap=await client.capabilities();if(!cap.durableIdempotency||clock().getTime()-data.t.created_at.getTime()>cap.retentionSeconds*1000)throw new Error('outcome_unknown');
   await transaction(p,async tx=>{await owned(tx,p,id);});
   try{await client.getSession(data.c.session_id);}catch(error){if(!(error instanceof Error)||error.message!=='not_found')throw error;await transaction(p,async tx=>{await owned(tx,p,id);});await client.createSession(data.c.session_id,'AYLUL '+data.c.id);}
   await transaction(p,async tx=>{await owned(tx,p,id);});
   const result=await client.submitRun({sessionId:data.c.session_id,commandId:data.t.id,input:data.t.input});
   await store.update(db,turnId,{run_id:result.runId,state:'running',updated_at:clock()});
  }catch(error){await store.update(db,turnId,{state:'unknown',updated_at:clock()});if(error instanceof Error&&error.message==='unauthorized')throw error;}
  return snapshot(p,id);
 }
 return {
  async status(p:Principal){await transaction(p,async()=>{});if(!client)return {state:'unconfigured' as const};let state:'ready'|'unavailable'='ready';try{await client.capabilities();}catch{state='unavailable';}await transaction(p,async()=>{});return {state};},
  async list(p:Principal){return transaction(p,async tx=>({conversations:(await store.list(tx,p.accountId)).map(conversation)}));},
  async create(p:Principal,request:{commandId:string}){uuid(request.commandId);const id=await transaction(p,async tx=>{await store.lock(tx,p.accountId);const old=await store.byCommand(tx,p.accountId,request.commandId);if(old)return old.id;const id=randomUUID();await store.create(tx,{id,account_id:p.accountId,command_id:request.commandId,title:'New conversation',session_id:'aylul_'+id.replaceAll('-',''),created_at:clock(),updated_at:clock()});return id;});return snapshot(p,id);},
  snapshot,
  async send(p:Principal,id:string,request:{commandId:string;text:string}){
   uuid(request.commandId);if(typeof request.text!=='string'||!request.text.trim()||Buffer.byteLength(request.text)>4096)throw new Error('request_invalid');
   const fingerprint=createHash('sha256').update(JSON.stringify({id,text:request.text})).digest('hex');
   const intent=await transaction(p,async tx=>{await store.lock(tx,p.accountId);await owned(tx,p,id);const old=await store.turnCommand(tx,p.accountId,request.commandId);
    if(old){if(old.fingerprint!==fingerprint)throw new Error('command_conflict');return {id:old.id,replayed:true};}
    if(await store.active(tx,id))throw new Error('generation_busy');const turnId=randomUUID();
    await store.insertTurn(tx,{id:turnId,account_id:p.accountId,conversation_id:id,command_id:request.commandId,fingerprint,input:request.text,output:'',run_id:null,state:'submitting',created_at:clock(),updated_at:clock()});await store.touch(tx,id,clock());return {id:turnId,replayed:false};});
   return intent.replayed?snapshot(p,id):dispatch(p,id,intent.id);
  },
  async recover(p:Principal,id:string,turnId:string){const recover=await transaction(p,async tx=>{await store.lock(tx,p.accountId);await owned(tx,p,id);const turn=await store.turn(tx,id,turnId);if(!turn)throw new Error('not_found');if(turn.state!=='unknown'||turn.run_id)return false;await store.update(tx,turnId,{state:'submitting',updated_at:clock()});return true;});return recover?dispatch(p,id,turnId):snapshot(p,id);},
  async stop(p:Principal,id:string,turnId:string){const turn=await transaction(p,async tx=>{await owned(tx,p,id);const turn=await store.turn(tx,id,turnId);if(!turn)throw new Error('not_found');return turn;});
   if(active(turn.state)&&turn.run_id&&client){try{await client.stopRun(turn.run_id);await transaction(p,tx=>store.update(tx,turnId,{state:'stopping',updated_at:clock()}));}catch(error){if(error instanceof Error&&error.message==='unauthorized')throw error;}}
   return snapshot(p,id);
  },
 };
}
