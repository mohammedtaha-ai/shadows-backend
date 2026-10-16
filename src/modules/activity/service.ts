import type {Kysely,Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {AccountChange,ActivityPage} from './model.js';
import {ActivityStore,safeCursor} from './store.js';
type Tx=Transaction<Database>;
export function createActivity(_db:Kysely<Database>,clock:()=>Date=()=>new Date()) {
 const store=new ActivityStore();
 return {
  append(tx:Tx,accountId:string,changes:AccountChange[]) {
   const cap=clock().getTime()+7*86400000;
   return store.append(tx,accountId,changes.map(c=>({...c,expiresAt:new Date(Math.min(c.expiresAt.getTime(),cap))})));
  },
  async cursor(tx:Tx,accountId:string){return safeCursor((await store.position(tx,accountId))?.high_water??0);},
  async read(tx:Tx,accountId:string,after:number,limit:number):Promise<ActivityPage> {
   const p=await store.position(tx,accountId);const highWater=safeCursor(p?.high_water??0),floor=safeCursor(p?.floor??0);
   if(!Number.isSafeInteger(after)||after<floor||after>highWater)throw new Error('resnapshot_required');
   const events=await store.events(tx,accountId,after,Math.max(1,Math.min(100,limit)));
   if(events.some(e=>e.expiresAt<=clock()))throw new Error('resnapshot_required');
   return {events,highWater,floor};
  },
  invalidateLaptop(tx:Tx,accountId:string,laptopId:string){return store.discard(tx,accountId,{laptopId});},
  prune(tx:Tx,accountId:string,now:Date){return store.discard(tx,accountId,{now});},
 };
}
export type ActivityService=ReturnType<typeof createActivity>;
