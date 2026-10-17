import type {Kysely,Transaction,Selectable} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {LaptopView,LinkLease,Receipt} from './model.js';
type Tx=Transaction<Database>;
export type LaptopRow=Selectable<Database['links_laptops']>;
export const position=(s:string)=>{const n=Number(s);if(!Number.isSafeInteger(n)||n<0)throw new Error('cursor_exhausted');return n;};
export class LinkStore {
 async expire(db:Kysely<Database>,now:Date){await db.transaction().execute(async tx=>{await tx.deleteFrom('links_ingress_receipts').where('expires_at','<=',now).execute();await tx.deleteFrom('links_pairing_codes').where('expires_at','<=',now).execute();});}
 async guard(tx:Tx,accountId:string,now:Date){
  await tx.insertInto('links_rate_windows').values({account_id:accountId,key:'guard',window_start:now,count:0}).onConflict(c=>c.columns(['account_id','key']).doNothing()).execute();
  await tx.selectFrom('links_rate_windows').selectAll().where('account_id','=',accountId).where('key','=','guard').forUpdate().executeTakeFirstOrThrow();
 }
 async rate(tx:Tx,accountId:string,key:string,max:number,now:Date):Promise<boolean> {
  const row=await tx.selectFrom('links_rate_windows').selectAll().where('account_id','=',accountId).where('key','=',key).executeTakeFirst();
  const reset=!row||now.getTime()-row.window_start.getTime()>=60000;
  if(!reset&&row.count>=max)return false;
  await tx.insertInto('links_rate_windows').values({account_id:accountId,key,window_start:reset?now:row!.window_start,count:reset?1:row!.count+1})
   .onConflict(c=>c.columns(['account_id','key']).doUpdateSet({window_start:reset?now:row!.window_start,count:reset?1:row!.count+1})).execute();return true;
 }
 async code(tx:Tx,accountId:string,hash:string){return tx.selectFrom('links_pairing_codes').selectAll().where('account_id','=',accountId).where('code_hash','=',hash).executeTakeFirst();}
 async issue(tx:Tx,row:Database['links_pairing_codes']){await tx.insertInto('links_pairing_codes').values(row).onConflict(c=>c.columns(['account_id','device_id']).doUpdateSet(row)).execute();}
 async consume(tx:Tx,accountId:string,deviceId:string){await tx.deleteFrom('links_pairing_codes').where('account_id','=',accountId).where('device_id','=',deviceId).execute();}
 async command(tx:Tx,accountId:string,commandId:string){return tx.selectFrom('links_claim_commands').selectAll().where('account_id','=',accountId).where('command_id','=',commandId).executeTakeFirst();}
 async remember(tx:Tx,accountId:string,commandId:string,fingerprint:string,laptopId:string,result:LaptopView){await tx.insertInto('links_claim_commands').values({account_id:accountId,command_id:commandId,fingerprint,laptop_id:laptopId,result}).execute();}
 async list(tx:Tx,accountId:string){return tx.selectFrom('links_laptops').selectAll().where('account_id','=',accountId).where('revoked_at','is',null).orderBy('id').execute();}
 async device(tx:Tx,accountId:string,deviceId:string){return tx.selectFrom('links_laptops').selectAll().where('account_id','=',accountId).where('device_id','=',deviceId).where('revoked_at','is',null).forUpdate().executeTakeFirst();}
 async lock(tx:Tx,accountId:string,id:string){return tx.selectFrom('links_laptops').selectAll().where('account_id','=',accountId).where('id','=',id).forUpdate().executeTakeFirst();}
 async create(tx:Tx,id:string,row:Database['links_pairing_codes']){
  await tx.insertInto('links_laptops').values({id,account_id:row.account_id,device_id:row.device_id,session_id:row.session_id,name:row.name}).execute();
  return (await this.lock(tx,row.account_id,id))!;
 }
 async update(tx:Tx,id:string,values:Partial<{online:boolean;last_seen_at:Date;producer_id:string;epoch:number;session_id:string;revoked_at:Date;ack_through:number}>){await tx.updateTable('links_laptops').set(values).where('id','=',id).execute();}
 async receipts(tx:Tx,lease:Pick<LinkLease,'laptopId'|'producerId'>,positions:number[],now:Date):Promise<Receipt[]> {
  if(!positions.length)return [];
  const rows=await tx.selectFrom('links_ingress_receipts').selectAll().where('laptop_id','=',lease.laptopId).where('producer_id','=',lease.producerId).where('seq','in',positions.map(String)).where('expires_at','>',now).execute();
  return rows.map(r=>({seq:position(r.seq),fingerprint:r.fingerprint,dropped:r.dropped,expiresAt:r.expires_at}));
 }
 async commit(tx:Tx,lease:LinkLease,receipts:Receipt[],now:Date) {
  await tx.deleteFrom('links_ingress_receipts').where('laptop_id','=',lease.laptopId).where('expires_at','<=',now).execute();
  for(const r of receipts)await tx.insertInto('links_ingress_receipts').values({laptop_id:lease.laptopId,producer_id:lease.producerId,seq:r.seq,fingerprint:r.fingerprint,dropped:r.dropped,expires_at:r.expiresAt}).execute();
  if(receipts.length)await this.update(tx,lease.laptopId,{ack_through:receipts.at(-1)!.seq,last_seen_at:now});
 }
}
