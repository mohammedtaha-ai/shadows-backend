import { randomUUID } from 'node:crypto';
import type { Kysely,Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
export class DeviceStore {
 constructor(private readonly db:Kysely<Database>) {}
 async create(tx:Transaction<Database>,accountId:string):Promise<string> { const id=randomUUID();await tx.insertInto('devices').values({id,account_id:accountId}).execute();return id; }
 async isActive(tx:Transaction<Database>,accountId:string,deviceId:string):Promise<boolean> { return !!await tx.selectFrom('devices').select('id').where('id','=',deviceId).where('account_id','=',accountId).where('revoked_at','is',null).executeTakeFirst(); }
 async list(tx:Transaction<Database>,accountId:string) { const rows=await tx.selectFrom('devices').select(['id','revoked_at']).where('account_id','=',accountId).orderBy('id').execute();return rows.map(r=>({id:r.id,revoked:r.revoked_at !== null})); }
 async revoke(tx:Transaction<Database>,accountId:string,deviceId:string,now:Date):Promise<void> {
  const row=await tx.updateTable('devices').set({revoked_at:now}).where('id','=',deviceId).where('account_id','=',accountId).returning('id').executeTakeFirst();
  if(!row) throw new Error('device_refused');
 }
}
