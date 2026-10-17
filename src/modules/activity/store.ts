import type {Kysely,Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {AccountChange,AccountEvent} from './model.js';
type Tx=Transaction<Database>;
export function safeCursor(value:string|number):number {
 const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new Error('cursor_exhausted');return n;
}
export class ActivityStore {
 async expiredAccounts(db:Kysely<Database>,now:Date){return db.selectFrom('activity_events').select('account_id').distinct().where('expires_at','<=',now).orderBy('account_id').limit(100).execute();}
 async lock(tx:Tx,accountId:string) {
  await tx.insertInto('activity_cursors').values({account_id:accountId}).onConflict(oc=>oc.column('account_id').doNothing()).execute();
  return tx.selectFrom('activity_cursors').selectAll().where('account_id','=',accountId).forUpdate().executeTakeFirstOrThrow();
 }
 async position(tx:Tx,accountId:string){return tx.selectFrom('activity_cursors').selectAll().where('account_id','=',accountId).executeTakeFirst();}
 async append(tx:Tx,accountId:string,changes:AccountChange[]):Promise<AccountEvent[]> {
  const position=await this.lock(tx,accountId);const start=safeCursor(position.high_water);
  if(!Number.isSafeInteger(start+changes.length))throw new Error('cursor_exhausted');
  const events=changes.map((c,i)=>({...c,seq:start+i+1}));
  for(const e of events)await tx.insertInto('activity_events').values({account_id:accountId,seq:e.seq,kind:e.type,laptop_id:e.laptopId,session_id:e.sessionId,payload:e.payload,expires_at:e.expiresAt}).execute();
  await tx.updateTable('activity_cursors').set({high_water:start+events.length}).where('account_id','=',accountId).execute();return events;
 }
 async events(tx:Tx,accountId:string,after:number,limit:number):Promise<AccountEvent[]> {
  const rows=await tx.selectFrom('activity_events').selectAll().where('account_id','=',accountId).where('seq','>',String(after)).orderBy('seq').limit(limit).execute();
  return rows.map(r=>({seq:safeCursor(r.seq),type:r.kind,laptopId:r.laptop_id,sessionId:r.session_id,payload:r.payload,expiresAt:r.expires_at}));
 }
 async discard(tx:Tx,accountId:string,filter:{laptopId:string}|{now:Date}) {
  const p=await this.lock(tx,accountId);
  let query=tx.deleteFrom('activity_events').where('account_id','=',accountId);
  query='laptopId' in filter?query.where('laptop_id','=',filter.laptopId):query.where('expires_at','<=',filter.now);
  const removed=await query.returning('seq').execute();
  if('laptopId' in filter || removed.length) {
   const floor='laptopId' in filter?safeCursor(p.high_water):Math.max(safeCursor(p.floor),...removed.map(r=>safeCursor(r.seq)));
   await tx.updateTable('activity_cursors').set({floor}).where('account_id','=',accountId).execute();
  }
 }
}
