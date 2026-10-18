import type {Kysely} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {IdentityService} from '../identity/index.js';
import type {ProviderSettingsService} from '../provider-settings/index.js';
import type {ReplyPort} from './reply-port.js';
import type {TurnCompletion} from './model.js';
import {ConversationStore,type DispatchClaim} from './store.js';

const categories=new Set<string>(['credential_rejected','model_unavailable','quota','network','destination_refused','context_too_large']);
const interrupted:TurnCompletion={state:'interrupted',outcome:'error',partial:true,code:'interrupted'};
const cancelled:TurnCompletion={state:'cancelled',outcome:'cancelled',partial:true};
const failure=(error:unknown):TurnCompletion=>{
 const code=error instanceof Error?error.message:'';
 if(code==='cancelled'||code==='unauthorized')return {...cancelled,...(code==='unauthorized'?{code}:{})};
 if(code==='lease_lost')return interrupted;
 return {state:'error',outcome:'error',partial:true,code:categories.has(code)?code:code==='command_conflict'?'connection_changed':code==='not_found'?'connection_unavailable':'network'};
};
// Timing injection only shortens production intervals for isolated fixtures.
function interval(value:number|undefined,maximum:number){if(value===undefined)return maximum;if(!Number.isFinite(value)||value<1||value>maximum)throw new Error('request_invalid');return value;}
export function createTurnDispatcher(db:Kysely<Database>,identity:Pick<IdentityService,'authorizeTransaction'>,providers:Pick<ProviderSettingsService,'resolveForDispatch'>,reply:ReplyPort,clock:()=>Date=()=>new Date(),timing:{heartbeatMs?:number;pollMs?:number;coalesceMs?:number}={}){
 const store=new ConversationStore(),active=new Map<string,{abort:AbortController;task:Promise<void>}>();
 const heartbeatMs=interval(timing.heartbeatMs,5000),pollMs=interval(timing.pollMs,200),coalesceMs=interval(timing.coalesceMs,200);
 let running=false,timer:ReturnType<typeof setInterval>|undefined,polling:Promise<void>|undefined,stopping:Promise<void>|undefined;
 const principal=(claim:DispatchClaim)=>({accountId:claim.turn.account_id,deviceId:claim.turn.origin_device_id,sessionId:claim.turn.origin_session_id});
 const gate=(claim:DispatchClaim)=>db.transaction().execute(async tx=>{
  await identity.authorizeTransaction(tx,principal(claim));await store.guard(tx,claim.turn.account_id);
  const {turn}=await store.fenced(tx,claim,clock);if(turn.cancel_requested)throw new Error('cancelled');
  const connection=await providers.resolveForDispatch(tx,turn.account_id,turn.connection_id,Number(turn.connection_revision));
  await store.fenced(tx,claim,clock); // Slow destination validation cannot revive an expired lease.
  await store.renew(tx,claim,clock());return connection;
 });
 const append=(claim:DispatchClaim,text:string)=>db.transaction().execute(async tx=>{
  await identity.authorizeTransaction(tx,principal(claim));await store.guard(tx,claim.turn.account_id);
  const {topic,turn,intent}=await store.fenced(tx,claim,clock);if(turn.cancel_requested)throw new Error('cancelled');
  await store.delta(tx,topic,claim,text,clock());
  if(!intent.lease_expires_at||intent.lease_expires_at<=clock())throw new Error('lease_lost');
 });
 const finish=async(claim:DispatchClaim,completion:TurnCompletion)=>{
  const commit=(result:TurnCompletion,authorize:boolean)=>db.transaction().execute(async tx=>{
   if(authorize)await identity.authorizeTransaction(tx,principal(claim));
   await store.guard(tx,claim.turn.account_id);let {topic,turn,intent}=await store.fenced(tx,claim,clock);
   if(authorize&&!turn.cancel_requested){
    await providers.resolveForDispatch(tx,turn.account_id,turn.connection_id,Number(turn.connection_revision));
    ({topic,turn,intent}=await store.fenced(tx,claim,clock));
   }
   await store.finish(tx,topic,turn,turn.cancel_requested?cancelled:result,clock());
   if(!intent.lease_expires_at||intent.lease_expires_at<=clock())throw new Error('lease_lost');
   });
  try{await commit(completion,completion.state==='done');}
  catch(error){
   // Cleanup may record lost authority, but never upgrades it to a successful reply.
   if(completion.state==='done')try{await commit(failure(error),false);}catch{}
   // Lost/deleted/expired leases cannot write. Recovery owns expired claims.
  }
 };
 async function generate(claim:DispatchClaim,abort:AbortController){
  let completion:TurnCompletion|undefined,buffer='',length=0,flushTimer:ReturnType<typeof setTimeout>|undefined;
  let writes=Promise.resolve(),checking=false,heartbeat:ReturnType<typeof setInterval>|undefined;
  const fail=(error:unknown)=>{completion=failure(error);abort.abort();};
  const flush=()=>{
   if(flushTimer)clearTimeout(flushTimer);flushTimer=undefined;
   const text=buffer;buffer='';if(!text)return writes;
   writes=writes.then(()=>append(claim,text)).catch(fail);return writes;
  };
  let resolveAbort!:()=>void;const aborted=new Promise<undefined>(resolve=>{resolveAbort=()=>resolve(undefined);});
  abort.signal.addEventListener('abort',resolveAbort,{once:true});
  if(abort.signal.aborted)resolveAbort();
  let iterator:AsyncIterator<import('./reply-port.js').ReplyPart>|undefined;
  let authorization=Promise.resolve();
  try{
   const messages=await db.transaction().execute(async tx=>{
    await identity.authorizeTransaction(tx,principal(claim));await store.guard(tx,claim.turn.account_id);await store.fenced(tx,claim,clock);
    return store.messages(tx,claim.turn.topic_id);
   });
   const connection=await gate(claim);
   if(abort.signal.aborted)throw new Error('lease_lost');
   const current=messages.find(m=>m.turn_id===claim.turn.id&&m.role==='user');if(!current)throw new Error('operation_failed');
   heartbeat=setInterval(()=>{
    if(checking||abort.signal.aborted)return;checking=true;
    authorization=gate(claim).then(()=>{}).catch(fail).finally(()=>{checking=false;});
   },heartbeatMs);heartbeat.unref();
   iterator=reply({connection,history:messages.filter(m=>m.turn_id!==claim.turn.id).map(m=>({role:m.role,content:m.text})),message:current.text,signal:abort.signal,maxOutputTokens:4096})[Symbol.asyncIterator]();
   while(!abort.signal.aborted){
    const next=await Promise.race([iterator.next(),aborted]);if(!next||next.done)break;
    const part=next.value;
    if(typeof part!=='string'){
     if(part.finish==='error')completion={state:'error',outcome:'error',partial:true,code:part.category&&categories.has(part.category)?part.category:'network'};
     else completion={state:'done',outcome:'done',partial:part.finish==='length',...(part.finish==='length'?{code:'length'}:{})};
     break;
    }
    for(const character of part){
     if(length+character.length>16000){completion={state:'done',outcome:'done',partial:true,code:'length'};break;}
     if(Buffer.byteLength(buffer)+Buffer.byteLength(character)>4000)await flush();
     if(abort.signal.aborted)break;
     buffer+=character;length+=character.length;
     if(!flushTimer){flushTimer=setTimeout(()=>{void flush();},coalesceMs);flushTimer.unref();}
     if(Buffer.byteLength(buffer)>=4000)await flush();
     if(length===16000){completion={state:'done',outcome:'done',partial:true,code:'length'};break;}
    }
    if(completion)break;
   }
   if(!completion)completion=abort.signal.aborted?interrupted:{state:'error',outcome:'error',partial:true,code:'network'};
   // Stop/authority loss keeps exactly the prefix already committed, never pending text.
   if(!abort.signal.aborted)await flush();else buffer='';
  }catch(error){fail(error);}
  finally{
   if(flushTimer)clearTimeout(flushTimer);if(heartbeat)clearInterval(heartbeat);
   await authorization;await writes;
   if(!completion)completion=interrupted;
   abort.abort();abort.signal.removeEventListener('abort',resolveAbort);
   if(iterator?.return)void iterator.return().catch(()=>{});
   await finish(claim,completion);
  }
 }
 async function scan(){
  for(const candidate of await store.candidates(db,clock())){
   if(!running)return;
   const claim=await db.transaction().execute(async tx=>{
    await store.guard(tx,candidate.account_id);const topic=await store.topic(tx,candidate.account_id,candidate.topic_id);if(!topic)return;
    const turn=await store.turn(tx,topic.id,candidate.id),intent=await store.intent(tx,candidate.id);if(!turn||!intent)return;
    if(intent.state==='claimed'&&intent.lease_expires_at&&intent.lease_expires_at<=clock()){
     await store.finish(tx,topic,turn,interrupted,clock());return;
    }
    if(active.has(candidate.id))return;
    return store.claim(tx,topic,turn,clock());
   });
   if(claim){
    const abort=new AbortController();
    const task=generate(claim,abort).catch(()=>{}).finally(()=>active.delete(claim.turn.id));
    active.set(claim.turn.id,{abort,task});
   }
  }
 }
 const poll=()=>{polling??=scan().finally(()=>{polling=undefined;});return polling;};
 return {
  poll,
  async start(){if(running)return;if(stopping)throw new Error('operation_failed');running=true;try{await poll();timer=setInterval(()=>{void poll().catch(()=>{});},pollMs);timer.unref();}catch{running=false;throw new Error('operation_failed');}},
  stop(){stopping??=(async()=>{running=false;if(timer)clearInterval(timer);await polling;for(const work of active.values())work.abort.abort();await Promise.allSettled([...active.values()].map(work=>work.task));})();return stopping;},
 };
}
