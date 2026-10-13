import { randomUUID,randomBytes,createHash } from 'node:crypto';
import type { Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
export class DeviceStore {
 async enroll(tx:Transaction<Database>,accountId:string):Promise<{deviceId:string;credential:string}> {
  const deviceId=randomUUID(),credential=randomBytes(32).toString('base64url');
  await tx.insertInto('devices').values({id:deviceId,account_id:accountId,enrollment_hash:createHash('sha256').update(credential).digest('base64url')}).execute();
  return {deviceId,credential};
 }
 async reuse(tx:Transaction<Database>,accountId:string,credential:string):Promise<string> {
  if(!/^[A-Za-z0-9_-]{43}$/.test(credential)) throw new Error('device_refused');
  const row=await tx.selectFrom('devices').select('id').where('account_id','=',accountId)
   .where('enrollment_hash','=',createHash('sha256').update(credential).digest('base64url')).where('revoked_at','is',null).forUpdate().executeTakeFirst();
  if(!row) throw new Error('device_refused');return row.id;
 }
 async isActive(tx:Transaction<Database>,accountId:string,deviceId:string):Promise<boolean> { return !!await tx.selectFrom('devices').select('id').where('id','=',deviceId).where('account_id','=',accountId).where('revoked_at','is',null).executeTakeFirst(); }
 async list(tx:Transaction<Database>,accountId:string) { const rows=await tx.selectFrom('devices').select(['id','revoked_at']).where('account_id','=',accountId).orderBy('id').execute();return rows.map(r=>({id:r.id,revoked:r.revoked_at !== null})); }
 async revoke(tx:Transaction<Database>,accountId:string,deviceId:string,now:Date):Promise<void> {
  const row=await tx.updateTable('devices').set({revoked_at:now}).where('id','=',deviceId).where('account_id','=',accountId).returning('id').executeTakeFirst();
  if(!row) throw new Error('device_refused');
 }
}
