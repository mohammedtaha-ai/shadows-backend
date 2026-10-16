import {createHash,randomInt,randomUUID} from 'node:crypto';
import type {Kysely,Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {Principal} from '../identity/index.js';
import type {ActivityService} from '../activity/index.js';
import type {LinkAccess} from './access-port.js';
import type {LaptopView,LinkLease,Receipt} from './model.js';
import {LinkStore,position,type LaptopRow} from './store.js';
type Tx=Transaction<Database>;
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function createLinks(db:Kysely<Database>,access:LinkAccess,activity:ActivityService,clock:()=>Date=()=>new Date()) {
 const store=new LinkStore();
 let sessions:{invalidateLaptop(tx:Tx,accountId:string,laptopId:string):Promise<void>}|undefined;
 const view=(r:LaptopRow):LaptopView=>({laptopId:r.id,name:r.name,status:r.online&&r.last_seen_at&&clock().getTime()-r.last_seen_at.getTime()<45000?'online':'offline',lastSeenAt:r.last_seen_at?.toISOString()??null});
 const changed=async(tx:Tx,row:LaptopRow,type:'laptop_online'|'laptop_offline')=>activity.append(tx,row.account_id,[{type,laptopId:row.id,sessionId:null,payload:{laptop:view(row)},expiresAt:new Date(clock().getTime()+7*86400000)}]);
 const service={
  bindSessions(owner:NonNullable<typeof sessions>){if(sessions)throw new Error('already_bound');sessions=owner;},
  async issueCode(principal:Principal,name:string) {
   if(typeof name!=='string'||!name.length||name.length>80)throw new Error('request_invalid');
   const result=await db.transaction().execute(async tx=>{
    await access.authorizeTransaction(tx,principal);await store.guard(tx,principal.accountId,clock());
    if(!await store.rate(tx,principal.accountId,'issue:'+principal.deviceId,3,clock())||!await store.rate(tx,principal.accountId,'issue-account',10,clock()))return {error:'rate_limited'} as const;
    const chars=Array.from({length:8},()=>alphabet[randomInt(alphabet.length)]).join(''),code=chars.slice(0,4)+'-'+chars.slice(4),expiresAt=new Date(clock().getTime()+300000);
    await store.issue(tx,{account_id:principal.accountId,device_id:principal.deviceId,session_id:principal.sessionId,code_hash:hash(code),name,expires_at:expiresAt});return {code,expiresAt:expiresAt.toISOString()};
   });if('error'in result)throw new Error(result.error);return result;
  },
  async claim(principal:Principal,commandId:string,code:string):Promise<LaptopView> {
   const fingerprint=hash(code);
   const result=await db.transaction().execute(async tx=>{
    await access.authorizeTransaction(tx,principal);await store.guard(tx,principal.accountId,clock());
    const replay=await store.command(tx,principal.accountId,commandId);
    if(replay){if(replay.fingerprint!==fingerprint)throw new Error('command_conflict');const row=await store.lock(tx,principal.accountId,replay.laptop_id);if(!row||row.revoked_at)throw new Error('not_found');return replay.result as LaptopView;}
    const pairing=await store.code(tx,principal.accountId,fingerprint);
    if(!pairing||pairing.expires_at<=clock()) {
     if(!await store.rate(tx,principal.accountId,'claim:'+principal.deviceId,5,clock()))return {error:'rate_limited'} as const;
     return {error:'link_code_invalid'} as const;
    }
    await access.authorizeRevocation(tx,{accountId:pairing.account_id,deviceId:pairing.device_id,sessionId:pairing.session_id});
    let row=await store.device(tx,principal.accountId,pairing.device_id);
    if(!row){if((await store.list(tx,principal.accountId)).length>=20)throw new Error('rate_limited');row=await store.create(tx,randomUUID(),pairing);}
    await store.consume(tx,principal.accountId,pairing.device_id);
    const laptop=view(row);await store.remember(tx,principal.accountId,commandId,fingerprint,row.id,laptop);return laptop;
   });if('error'in result)throw new Error(result.error);return result;
  },
  async list(principal:Principal) {
   await db.transaction().execute(tx=>access.authorizeTransaction(tx,principal));
   const result=await db.transaction().setIsolationLevel('repeatable read').setAccessMode('read only').execute(async tx=>({laptops:(await store.list(tx,principal.accountId)).map(view),cursor:await activity.cursor(tx,principal.accountId)}));
   await db.transaction().execute(tx=>access.authorizeTransaction(tx,principal));return result;
  },
  async unlink(principal:Principal,laptopId:string) {
   await db.transaction().execute(async tx=>{
    await access.authorizeRevocation(tx,principal);await store.guard(tx,principal.accountId,clock());const row=await store.lock(tx,principal.accountId,laptopId);
    if(!row||row.revoked_at)throw new Error('not_found');await store.update(tx,laptopId,{revoked_at:clock(),online:false});
    await sessions?.invalidateLaptop(tx,principal.accountId,laptopId);
    await activity.invalidateLaptop(tx,principal.accountId,laptopId);
    await activity.append(tx,principal.accountId,[{type:'laptop_unlinked',laptopId,sessionId:null,payload:{laptopId},expiresAt:new Date(clock().getTime()+7*86400000)}]);
   });
  },
  async open(principal:Principal,producerId:string,lastAck:number):Promise<LinkLease> {
   return db.transaction().execute(async tx=>{
    await access.authorizeTransaction(tx,principal);const row=await store.device(tx,principal.accountId,principal.deviceId);
    if(!row)throw new Error('not_found');
    if(!Number.isSafeInteger(lastAck)||lastAck<0||lastAck>position(row.ack_through)||(row.producer_id&&row.producer_id!==producerId))throw new Error('resnapshot_required');
    const epoch=position(row.epoch)+1;if(!Number.isSafeInteger(epoch))throw new Error('cursor_exhausted');
    await store.update(tx,row.id,{producer_id:producerId,epoch,online:true,last_seen_at:clock(),session_id:principal.sessionId});
    await changed(tx,{...row,online:true,last_seen_at:clock()},'laptop_online');
    return {laptopId:row.id,accountId:principal.accountId,deviceId:principal.deviceId,sessionId:principal.sessionId,producerId,epoch,ackThrough:position(row.ack_through)};
   });
  },
  async requireConnection(tx:Tx,principal:Principal,lease:LinkLease) {
   await access.authorizeTransaction(tx,principal);
   const row=await store.lock(tx,principal.accountId,lease.laptopId);
   if(!row||row.revoked_at||!row.online||row.device_id!==principal.deviceId||row.session_id!==principal.sessionId||lease.accountId!==principal.accountId||lease.deviceId!==principal.deviceId||lease.sessionId!==principal.sessionId||row.producer_id!==lease.producerId||position(row.epoch)!==lease.epoch)throw new Error('unauthorized');
   return position(row.ack_through);
  },
  async assertConnection(principal:Principal,lease:LinkLease){return db.transaction().execute(tx=>service.requireConnection(tx,principal,lease));},
  receipts(tx:Tx,lease:LinkLease,positions:number[]){return store.receipts(tx,lease,positions,clock());},
  async commitReceipts(tx:Tx,lease:LinkLease,receipts:Receipt[]) {
   const row=await store.lock(tx,lease.accountId,lease.laptopId);
   if(!row||row.revoked_at||position(row.epoch)!==lease.epoch||row.producer_id!==lease.producerId)throw new Error('unauthorized');
   const through=position(row.ack_through);
   if(receipts.some((r,i)=>r.seq!==through+i+1))throw new Error('request_invalid');
   await store.commit(tx,lease,receipts,clock());
  },
  async visible(tx:Tx,accountId:string,laptopId:string) {
   const row=(await store.list(tx,accountId)).find(r=>r.id===laptopId);return row?view(row):null;
  },
  async close(lease:LinkLease) {
   await db.transaction().execute(async tx=>{
    const row=await store.lock(tx,lease.accountId,lease.laptopId);
    if(!row||row.revoked_at||position(row.epoch)!==lease.epoch||!row.online)return;
    await store.update(tx,row.id,{online:false});await changed(tx,{...row,online:false},'laptop_offline');
   });
  },
 };
 return service;
}
export type LinksService=ReturnType<typeof createLinks>;
