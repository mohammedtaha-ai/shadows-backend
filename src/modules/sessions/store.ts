import {randomUUID} from 'node:crypto';
import type {Transaction,Selectable} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {SessionInput,SessionView,SessionEvent,StepView,StepInput} from './model.js';
type Tx=Transaction<Database>;
export type SessionRow=Selectable<Database['sessions_sessions']>;
const pos=(s:string)=>{const n=Number(s);if(!Number.isSafeInteger(n)||n<0)throw new Error('cursor_exhausted');return n;};
export class SessionStore {
 async local(tx:Tx,laptopId:string,producerId:string,localId:string){return tx.selectFrom('sessions_sessions').selectAll().where('laptop_id','=',laptopId).where('producer_id','=',producerId).where('local_id','=',localId).forUpdate().executeTakeFirst();}
 async get(tx:Tx,accountId:string,id:string){return tx.selectFrom('sessions_sessions').selectAll().where('account_id','=',accountId).where('id','=',id).executeTakeFirst();}
 async list(tx:Tx,accountId:string){return tx.selectFrom('sessions_sessions').selectAll().where('account_id','=',accountId).orderBy('id').execute();}
 async create(tx:Tx,accountId:string,laptopId:string,producerId:string,event:SessionInput,expiresAt:Date) {
  const id=randomUUID();const payload:SessionView={sessionId:id,laptopId,agent:event.agent,projectName:event.projectName,cwd:event.cwd,state:event.state,startedAt:event.at,updatedAt:event.at,lastStep:null,lastSeq:0};
  await tx.insertInto('sessions_sessions').values({id,account_id:accountId,laptop_id:laptopId,producer_id:producerId,local_id:event.localSessionId,payload,expires_at:expiresAt}).execute();
  return (await this.local(tx,laptopId,producerId,event.localSessionId))!;
 }
 async recent(tx:Tx,id:string,now:Date){const rows=await tx.selectFrom('sessions_steps').selectAll().where('session_id','=',id).where('expires_at','>',now).orderBy('seq','desc').limit(500).execute();return rows.reverse().map(r=>r.payload as StepView);}
 async step(tx:Tx,id:string,localId:string){return tx.selectFrom('sessions_steps').selectAll().where('session_id','=',id).where('local_id','=',localId).executeTakeFirst();}
 async addStep(tx:Tx,row:SessionRow,event:StepInput,fingerprint:string,expiresAt:Date):Promise<StepView> {
  const seq=pos(row.high_water)+1;if(!Number.isSafeInteger(seq))throw new Error('cursor_exhausted');
  const step={stepId:randomUUID(),seq,at:event.at,tool:event.tool,path:event.path,summary:['Read','Edit','Write','NotebookEdit','Bash','Glob','Grep','WebFetch','WebSearch'].includes(event.tool)?event.tool:'Agent step'};
  await tx.insertInto('sessions_steps').values({id:step.stepId,session_id:row.id,local_id:event.localStepId,seq,fingerprint,payload:step,expires_at:expiresAt}).execute();return step;
 }
 async append(tx:Tx,row:SessionRow,event:Omit<SessionEvent,'seq'>,view:SessionView,expiresAt:Date):Promise<SessionEvent> {
  const seq=pos(row.high_water)+1;if(!Number.isSafeInteger(seq))throw new Error('cursor_exhausted');
  const output={...event,seq} as SessionEvent;
  await tx.insertInto('sessions_events').values({session_id:row.id,seq,payload:output,expires_at:expiresAt}).execute();
  await tx.updateTable('sessions_sessions').set({high_water:seq,payload:{...view,lastStep:null,lastSeq:seq},expires_at:expiresAt}).where('id','=',row.id).execute();return output;
 }
 async events(tx:Tx,id:string,after:number,limit:number){return (await tx.selectFrom('sessions_events').select('payload').where('session_id','=',id).where('seq','>',String(after)).orderBy('seq').limit(limit).execute()).map(r=>r.payload as SessionEvent);}
 async invalidate(tx:Tx,accountId:string,laptopId:string){
  const rows=await tx.selectFrom('sessions_sessions').selectAll().where('account_id','=',accountId).where('laptop_id','=',laptopId).forUpdate().execute();
  for(const row of rows){await tx.deleteFrom('sessions_steps').where('session_id','=',row.id).execute();await tx.deleteFrom('sessions_events').where('session_id','=',row.id).execute();await tx.updateTable('sessions_sessions').set({payload:null,floor:row.high_water}).where('id','=',row.id).execute();}
 }
 async prune(tx:Tx,accountId:string,now:Date){
  const rows=await tx.selectFrom('sessions_sessions').selectAll().where('account_id','=',accountId).orderBy('id').forUpdate().execute();
  for(const row of rows){
   const removed=await tx.deleteFrom('sessions_events').where('session_id','=',row.id).where('expires_at','<=',now).returning('seq').execute();
   await tx.deleteFrom('sessions_steps').where('session_id','=',row.id).where('expires_at','<=',now).execute();
   if(removed.length||row.expires_at<=now)await tx.updateTable('sessions_sessions').set({floor:Math.max(pos(row.floor),...removed.map(r=>pos(r.seq))),...(row.expires_at<=now?{payload:null}:{})}).where('id','=',row.id).execute();
  }
 }
}
