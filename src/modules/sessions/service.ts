import {createHash} from 'node:crypto';
import type {Kysely,Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {Principal} from '../identity/index.js';
import type {ActivityService} from '../activity/index.js';
import type {LinkAccess,LinkLease,Receipt} from '../links/index.js';
import type {SessionLinks} from './links-port.js';
import type {IngressEntry,IngestResult,SessionView,SessionEvent} from './model.js';
import {SessionStore,type SessionRow} from './store.js';
type Tx=Transaction<Database>;
const stable=(v:unknown):string=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const fingerprint=(v:unknown)=>createHash('sha256').update(stable(v)).digest('hex');
function timestamp(s:string):Date {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/.test(s))throw new Error('request_invalid');
 const d=new Date(s);if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,19)!==s.slice(0,19))throw new Error('request_invalid');return d;
}
export function createSessions(db:Kysely<Database>,access:LinkAccess,links:SessionLinks,activity:ActivityService,clock:()=>Date=()=>new Date()) {
 const store=new SessionStore();
 async function project(tx:Tx,row:SessionRow):Promise<SessionView> {
  const laptop=await links.visible(tx,row.account_id,row.laptop_id);if(!laptop||!row.payload||row.expires_at<=clock())throw new Error('not_found');
  const steps=await store.recent(tx,row.id,clock());return {...row.payload as SessionView,lastStep:steps.at(-1)??null,lastSeq:Number(row.high_water),...(laptop.status==='offline'?{state:'offline' as const}:{})};
 }
 async function authorize(principal:Principal){await db.transaction().execute(tx=>access.authorizeTransaction(tx,principal));}
 async function prepare(principal:Principal){await db.transaction().execute(async tx=>{await access.authorizeTransaction(tx,principal);await store.prune(tx,principal.accountId,clock());await activity.prune(tx,principal.accountId,clock());});}
 async function snapshotRead<T>(principal:Principal,read:(tx:Tx)=>Promise<T>):Promise<T> {
  await prepare(principal);const result=await db.transaction().setIsolationLevel('repeatable read').setAccessMode('read only').execute(read);await authorize(principal);return result;
 }
 const service={
  async ingest(principal:Principal,lease:LinkLease,batch:IngressEntry[]):Promise<IngestResult> {
   if(!batch.length||batch.length>20||batch.some((e,i)=>!Number.isSafeInteger(e.seq)||e.seq<1||(i>0&&e.seq!==batch[i-1]!.seq+1)))throw new Error('request_invalid');
   return db.transaction().execute(async tx=>{
    let through=await links.requireConnection(tx,principal,lease);
    const prior=await links.receipts(tx,lease,batch.map(e=>e.seq)),receipts:Receipt[]=[],dropped:IngestResult['dropped']=[];
    for(const entry of batch){
     const event=entry.event;
     const allowed=event.type==='session'?['type','localSessionId','agent','projectName','cwd','state','at']:['type','localSessionId','localStepId','at','tool','path'];
     if(Object.keys(event).some(k=>!allowed.includes(k)))throw new Error('request_invalid');
     const at=timestamp(event.at),now=clock(),expiresAt=new Date(Math.min(at.getTime()+7*86400000,now.getTime()+7*86400000));
     if(at.getTime()>now.getTime()+300000)throw new Error('request_invalid');
     if(event.type==='step'&&event.path!==null&&(!['Read','Edit','Write','NotebookEdit'].includes(event.tool)||/^(https?:|\*|\?)/i.test(event.path)))throw new Error('request_invalid');
     const hash=fingerprint(event);
     if(entry.seq<=through){const receipt=prior.find(r=>r.seq===entry.seq);if(!receipt)throw new Error('resnapshot_required');if(receipt.fingerprint!==hash)throw new Error('command_conflict');if(receipt.dropped)dropped.push({seq:entry.seq,code:'event_expired'});continue;}
     if(entry.seq!==through+1)throw new Error('request_invalid');through=entry.seq;
     const expired=expiresAt<=now;receipts.push({seq:entry.seq,fingerprint:hash,dropped:expired,expiresAt:new Date(now.getTime()+7*86400000)});
     if(expired){dropped.push({seq:entry.seq,code:'event_expired'});continue;}
     let row=await store.local(tx,lease.laptopId,lease.producerId,event.localSessionId);
     if(!row){if(event.type!=='session')throw new Error('not_found');row=await store.create(tx,principal.accountId,lease.laptopId,lease.producerId,event,expiresAt);}
     let view:SessionView;
     let change:Omit<SessionEvent,'seq'>;
     if(event.type==='session'){
      view={...(row.payload as SessionView),agent:event.agent,projectName:event.projectName,cwd:event.cwd,state:event.state,updatedAt:event.at,lastSeq:Number(row.high_water)+1};
      if(!view.sessionId)view={...view,sessionId:row.id,laptopId:row.laptop_id,startedAt:event.at,lastStep:null};
      change={type:'session_updated',session:view} as Omit<SessionEvent,'seq'>;
     } else {
      if(!row.payload||row.expires_at<=now)throw new Error('not_found');
      const previous=await store.step(tx,row.id,event.localStepId);
      if(previous){if(previous.fingerprint!==hash)throw new Error('command_conflict');continue;}
      const step=await store.addStep(tx,row,event,hash,expiresAt);
      view={...row.payload as SessionView,lastStep:step,lastSeq:step.seq,updatedAt:event.at};change={type:'step_added',step} as Omit<SessionEvent,'seq'>;
     }
     await store.append(tx,row,change,view,expiresAt);
     await activity.append(tx,principal.accountId,[{type:'session_changed',laptopId:lease.laptopId,sessionId:row.id,payload:{session:view},expiresAt}]);
    }
    await links.commitReceipts(tx,lease,receipts);return {epoch:lease.epoch,ackThrough:through,dropped};
   });
  },
  async list(principal:Principal,laptopId?:string){return snapshotRead(principal,async tx=>{
   if(laptopId&&!await links.visible(tx,principal.accountId,laptopId))throw new Error('not_found');
   const sessions:SessionView[]=[];for(const row of await store.list(tx,principal.accountId)){if(laptopId&&row.laptop_id!==laptopId)continue;if(!row.payload||row.expires_at<=clock()||!await links.visible(tx,principal.accountId,row.laptop_id))continue;sessions.push(await project(tx,row));}
   return {sessions:sessions.slice(-200),cursor:await activity.cursor(tx,principal.accountId)};
  });},
  async snapshot(principal:Principal,sessionId:string){return snapshotRead(principal,async tx=>{const row=await store.get(tx,principal.accountId,sessionId);if(!row)throw new Error('not_found');return {session:await project(tx,row),steps:await store.recent(tx,row.id,clock()),cursor:Number(row.high_water)};});},
  async events(principal:Principal,sessionId:string,after:number,limit:number){return snapshotRead(principal,async tx=>{
   const row=await store.get(tx,principal.accountId,sessionId);if(!row)throw new Error('not_found');await project(tx,row);
   if(!Number.isSafeInteger(after)||after<Number(row.floor)||after>Number(row.high_water))throw new Error('resnapshot_required');
   return {events:await store.events(tx,row.id,after,Math.max(1,Math.min(100,limit))),highWater:Number(row.high_water),floor:Number(row.floor)};
  });},
  invalidateLaptop(tx:Tx,accountId:string,laptopId:string){return store.invalidate(tx,accountId,laptopId);},
 };
 links.bindSessions(service);return service;
}
export type SessionsService=ReturnType<typeof createSessions>;
