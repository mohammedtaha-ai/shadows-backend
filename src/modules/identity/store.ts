import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import type { Kysely, Transaction, Selectable } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
type Connection = Kysely<Database> | Transaction<Database>;
export class IdentityStore {
 constructor(private readonly db: Kysely<Database>) {}
 async insertAttempt(row: Selectable<Database['identity_login_attempts']>) { await this.db.insertInto('identity_login_attempts').values(row).execute(); }
 async claimAttempt(stateHash: string, now: Date) {
  return this.db.updateTable('identity_login_attempts').set({claimed_at:now}).where('state_hash','=',stateHash)
   .where('claimed_at','is',null).where('expires_at','>',now).returningAll().executeTakeFirst();
 }
 async mapAccount(tx: Transaction<Database>, issuer: string, subject: string) {
  // An upsert locks this account consistently with authorization/revocation.
  const row=await tx.insertInto('identity_accounts').values({id:randomUUID(),issuer,subject})
   .onConflict(c=>c.columns(['issuer','subject']).doUpdateSet({issuer})).returningAll().executeTakeFirstOrThrow();
  if(row.status !== 'active') throw new Error('login_refused'); return row.id;
 }
 async lockAccount(tx: Transaction<Database>, accountId: string) {
  return tx.selectFrom('identity_accounts').selectAll().where('id','=',accountId).forUpdate().executeTakeFirst();
 }
 async insertTicket(tx: Transaction<Database>, row: Selectable<Database['identity_return_tickets']>) { await tx.insertInto('identity_return_tickets').values(row).execute(); }
 async peekTicket(ticketHash: string) { return this.db.selectFrom('identity_return_tickets').selectAll().where('ticket_hash','=',ticketHash).executeTakeFirst(); }
 async consumeTicket(tx: Transaction<Database>, ticketHash: string, challenge: string, now: Date) {
  return tx.updateTable('identity_return_tickets').set({consumed_at:now}).where('ticket_hash','=',ticketHash)
   .where('return_challenge','=',challenge).where('consumed_at','is',null).where('expires_at','>',now).returningAll().executeTakeFirst();
 }
 async insertSession(tx: Transaction<Database>, row: Omit<Selectable<Database['identity_sessions']>,'issued_at'|'provider_logout'> & {issued_at:Date}) { await tx.insertInto('identity_sessions').values(row).execute(); }
 async sessionByHash(handleHash: string) { return this.db.selectFrom('identity_sessions').selectAll().where('handle_hash','=',handleHash).executeTakeFirst(); }
 async session(tx: Transaction<Database>, id: string, accountId: string) { return tx.selectFrom('identity_sessions').selectAll().where('id','=',id).where('account_id','=',accountId).forUpdate().executeTakeFirst(); }
 async touch(tx: Transaction<Database>, id: string, now: Date) { await tx.updateTable('identity_sessions').set({last_active_at:now}).where('id','=',id).execute(); }
 async saveProviderTokens(tx:Transaction<Database>,id:string,sealed:{ciphertext:string;keyId:string},now:Date) {
  await tx.updateTable('identity_sessions').set({tokens_ciphertext:sealed.ciphertext,tokens_key_id:sealed.keyId,provider_refreshed_at:now}).where('id','=',id).execute();
 }
 async revoke(tx: Transaction<Database>, accountId: string, now: Date, selector?: {sessionId?:string; deviceId?:string}) {
  let q=tx.updateTable('identity_sessions').set({revoked_at:now}).where('account_id','=',accountId).where('revoked_at','is',null);
  if(selector?.sessionId) q=q.where('id','=',selector.sessionId);
  if(selector?.deviceId) q=q.where('device_id','=',selector.deviceId);
  return q.returningAll().execute();
 }
 async audit(tx: Transaction<Database>, accountId: string, deviceId: string | null, operation: string, now: Date) {
  await tx.insertInto('identity_audit_events').values({id:randomUUID(),account_id:accountId,device_id:deviceId,operation,outcome:'accepted',occurred_at:now,policy_revision:'b1-synthetic-retention-unapproved'}).execute();
 }
 async insertLogoutTicket(tx: Transaction<Database>, row: Omit<Selectable<Database['identity_logout_tickets']>,'revocation_succeeded'|'attempts'>) { await tx.insertInto('identity_logout_tickets').values(row).execute(); }
 async consumeLogoutTicket(ticketHash:string,now:Date) {
  return this.db.updateTable('identity_logout_tickets').set({consumed_at:now,attempts:sql<number>`attempts+1`}).where('ticket_hash','=',ticketHash).where('consumed_at','is',null).where('attempts','<',3).where('expires_at','>',now).returningAll().executeTakeFirst();
 }
 async retryLogoutTicket(ticketId:string,now:Date) { await this.db.updateTable('identity_logout_tickets').set({consumed_at:null}).where('id','=',ticketId).where('revocation_succeeded','=',false).where('attempts','<',3).where('expires_at','>',now).execute(); }
 async markProviderRevoked(ticketId:string) { await this.db.updateTable('identity_logout_tickets').set({revocation_succeeded:true}).where('id','=',ticketId).execute(); }
 async completeLogout(tx:Transaction<Database>,stateHash:string,now:Date) {
  const ticket=await tx.updateTable('identity_logout_tickets').set({callback_at:now}).where('callback_state_hash','=',stateHash)
   .where('consumed_at','is not',null).where('callback_at','is',null).where('revocation_succeeded','=',true).where('expires_at','>',now).returningAll().executeTakeFirst();
  if(!ticket) throw new Error('logout_refused');
  await tx.updateTable('identity_sessions').set({provider_logout:'complete'}).where('id','=',ticket.session_id).where('revoked_at','is not',null).execute();
 }
 async recordLogout(tx:Transaction<Database>,input:{issuer:string;jti:string;sid:string;issuedAt:number}) {
  return tx.insertInto('identity_logout_events').values({issuer:input.issuer,jti:input.jti,sid:input.sid,issued_at:new Date(input.issuedAt*1000)})
   .onConflict(c=>c.columns(['issuer','jti']).doNothing()).returning('jti').executeTakeFirst();
 }
 async sidLoggedOut(tx:Transaction<Database>,issuer:string,sid:string) { return !!await tx.selectFrom('identity_logout_events').select('jti').where('issuer','=',issuer).where('sid','=',sid).executeTakeFirst(); }
 async accountsForSid(connection:Connection,issuer:string,sid:string) {
  const sessions=connection.selectFrom('identity_sessions').innerJoin('identity_accounts','identity_accounts.id','identity_sessions.account_id')
   .select('identity_sessions.account_id').where('identity_accounts.issuer','=',issuer).where('provider_sid','=',sid);
  const pending=connection.selectFrom('identity_return_tickets').innerJoin('identity_accounts','identity_accounts.id','identity_return_tickets.account_id')
   .select('identity_return_tickets.account_id').where('identity_accounts.issuer','=',issuer).where('provider_sid','=',sid);
  return sessions.union(pending).orderBy('account_id').execute();
 }
 async revokeSid(tx:Transaction<Database>,accountId:string,sid:string,now:Date) { await tx.updateTable('identity_sessions').set({revoked_at:now}).where('account_id','=',accountId).where('provider_sid','=',sid).where('revoked_at','is',null).execute(); }
}
