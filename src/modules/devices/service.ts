import type { Kysely,Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
import type { Principal } from '../identity/index.js';
import { DeviceStore } from './store.js';
export interface IdentityOperations {
 authorizeTransaction(tx:Transaction<Database>,principal:Principal):Promise<void>;
 revokeDeviceSessions(tx:Transaction<Database>,accountId:string,deviceId:string):Promise<void>;
 recordDeviceRevocation(tx:Transaction<Database>,principal:Principal,deviceId:string):Promise<void>;
}
export class DeviceService {
 private readonly store:DeviceStore; private identity?:IdentityOperations;
 constructor(private readonly db:Kysely<Database>,private readonly clock:()=>Date=()=>new Date()) { this.store=new DeviceStore(db); }
 readonly registration={create:(tx:Transaction<Database>,accountId:string)=>this.store.create(tx,accountId)};
 readonly trust={isActive:(tx:Transaction<Database>,accountId:string,deviceId:string)=>this.store.isActive(tx,accountId,deviceId)};
 bindIdentity(identity:IdentityOperations) { if(this.identity) throw new Error('already_bound');this.identity=identity; }
 async list(principal:Principal) {
  try { return await this.db.transaction().execute(async tx=>{if(!this.identity) throw 0;await this.identity.authorizeTransaction(tx,principal);return this.store.list(tx,principal.accountId);}); }
  catch { throw new Error('device_refused'); }
 }
 async revoke(principal:Principal,deviceId:string):Promise<void> {
  try { await this.db.transaction().execute(async tx=>{
   if(!this.identity) throw 0;await this.identity.authorizeTransaction(tx,principal);
   await this.store.revoke(tx,principal.accountId,deviceId,this.clock());
   await this.identity.revokeDeviceSessions(tx,principal.accountId,deviceId);
   await this.identity.recordDeviceRevocation(tx,principal,deviceId);
  }); } catch { throw new Error('device_refused'); }
 }
}
