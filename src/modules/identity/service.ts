import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
import type { IdentitySettings } from './model.js';
import type { DeviceRegistrationPort } from './device-registration-port.js';
import type { DeviceTrustPort } from './device-trust-port.js';
import type { OidcPort } from './oidc-port.js';
import type { LoginBinding, Principal, NativeLoginRequest, LoginStart, LoginReturn, ProviderTokens, SessionGrant, LogoutResult } from './model.js';
import { IdentityStore } from './store.js';
import { TokenVault } from './token-vault.js';
export const hash = (input:string) => createHash('sha256').update(input).digest('base64url');
const opaque = () => randomBytes(32).toString('base64url');
const add = (now:Date,ms:number) => new Date(now.getTime()+ms);
function decodeObject(value:string): Record<string,unknown> {
 const parsed:unknown=JSON.parse(value); if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('vault_refused');
 return parsed as Record<string,unknown>;
}
function decodeBinding(value:string):LoginBinding {
 const parsed=decodeObject(value); if(typeof parsed.state !== 'string' || typeof parsed.nonce !== 'string' || typeof parsed.verifier !== 'string') throw new Error('vault_refused');
 return {state:parsed.state,nonce:parsed.nonce,verifier:parsed.verifier};
}
function decodeTokens(value:string):ProviderTokens {
 const parsed=decodeObject(value); if(typeof parsed.refreshToken !== 'string' || typeof parsed.idToken !== 'string' || !parsed.refreshToken || !parsed.idToken) throw new Error('vault_refused');
 return {refreshToken:parsed.refreshToken,idToken:parsed.idToken};
}
export class IdentityService {
 private readonly store:IdentityStore; private readonly vault:TokenVault;
 constructor(private readonly db:Kysely<Database>, private readonly config:IdentitySettings, private readonly oidc:OidcPort,
  private readonly registration:DeviceRegistrationPort, private readonly trust:DeviceTrustPort, private readonly clock:()=>Date=()=>new Date()) {
  this.store=new IdentityStore(db); this.vault=new TokenVault(config.encryptionKey,config.encryptionKeyId);
 }
 async beginLogin(input:NativeLoginRequest):Promise<LoginStart> {
  try {
   const uri=new URL(input.returnUri);
   if(input.platform !== 'windows' || uri.protocol !== 'http:' || uri.hostname !== '127.0.0.1' || !uri.port || Number(uri.port)<1024 ||
    uri.pathname !== '/oidc-return' || uri.hash || uri.search || uri.username || uri.password || !/^[A-Za-z0-9_-]{43}$/.test(input.returnChallenge)) throw 0;
   const id=randomUUID(), binding={state:opaque(),nonce:opaque(),verifier:opaque()}, now=this.clock();
   const sealed=await this.vault.seal(JSON.stringify(binding),'attempt:'+id);
   const authorizationUrl=await this.oidc.authorizationUrl(binding);
   await this.store.insertAttempt({id,state_hash:hash(binding.state),binding_ciphertext:sealed.ciphertext,binding_key_id:sealed.keyId,
    return_uri:uri.href,return_challenge:input.returnChallenge,expires_at:add(now,300000),claimed_at:null});
   return {attemptId:id,authorizationUrl};
  } catch { throw new Error('login_refused'); }
 }
 async finishLogin(callback:URL):Promise<LoginReturn> {
  try {
   if(callback.origin+callback.pathname !== this.config.callbackUrl || callback.hash || callback.username || callback.password ||
    callback.searchParams.getAll('state').length !== 1 || callback.searchParams.getAll('code').length !== 1 || callback.searchParams.has('error')) throw 0;
   const now=this.clock(), attempt=await this.store.claimAttempt(hash(callback.searchParams.get('state')!),now); if(!attempt) throw 0;
   const binding=decodeBinding(await this.vault.open({ciphertext:attempt.binding_ciphertext,keyId:attempt.binding_key_id},'attempt:'+attempt.id));
   const verified=await this.oidc.exchange(callback,binding);
   if(verified.identity.issuer !== this.config.issuer || !verified.identity.subject || !verified.identity.providerSessionId) throw 0;
   const ticket=opaque(), id=randomUUID();
   const sealed=await this.vault.seal(JSON.stringify(verified.providerTokens),'return:'+id);
   await this.db.transaction().execute(async tx=>{
    const accountId=await this.store.mapAccount(tx,verified.identity.issuer,verified.identity.subject);
    await this.store.insertTicket(tx,{id,ticket_hash:hash(ticket),account_id:accountId,return_challenge:attempt.return_challenge,
     provider_sid:verified.identity.providerSessionId,tokens_ciphertext:sealed.ciphertext,tokens_key_id:sealed.keyId,expires_at:add(this.clock(),60000),consumed_at:null});
   });
   return {returnUri:attempt.return_uri,ticket};
  } catch { throw new Error('login_refused'); }
 }
 async redeemReturn(input:{ticket:string;returnVerifier:string}):Promise<SessionGrant> {
  try {
   if(!/^[A-Za-z0-9_-]{43}$/.test(input.ticket) || !/^[A-Za-z0-9._~-]{43,128}$/.test(input.returnVerifier)) throw 0;
   const hint=await this.store.peekTicket(hash(input.ticket)); if(!hint) throw 0;
   return await this.db.transaction().execute(async tx=>{
    const now=this.clock(), account=await this.store.lockAccount(tx,hint.account_id); if(account?.status !== 'active') throw 0;
    const returned=await this.store.consumeTicket(tx,hash(input.ticket),hash(input.returnVerifier),now); if(!returned || await this.store.sidLoggedOut(tx,this.config.issuer,returned.provider_sid)) throw 0;
    const tokens=decodeTokens(await this.vault.open({ciphertext:returned.tokens_ciphertext,keyId:returned.tokens_key_id},'return:'+returned.id));
    const deviceId=await this.registration.create(tx,returned.account_id), sessionId=randomUUID(), handle=opaque();
    const sealed=await this.vault.seal(JSON.stringify(tokens),'session:'+sessionId), expiresAt=add(now,30*24*3600000);
    await this.store.insertSession(tx,{id:sessionId,handle_hash:hash(handle),account_id:returned.account_id,device_id:deviceId,provider_sid:returned.provider_sid,
     tokens_ciphertext:sealed.ciphertext,tokens_key_id:sealed.keyId,issued_at:now,last_active_at:now,absolute_expires_at:expiresAt,revoked_at:null});
    await this.store.audit(tx,returned.account_id,deviceId,'session-issued',now);
    return {handle,principal:{accountId:returned.account_id,deviceId,sessionId},expiresAt:expiresAt.toISOString()};
   });
  } catch { throw new Error('return_refused'); }
 }
 async authorizeTransaction(tx:Transaction<Database>,principal:Principal):Promise<void> {
  const account=await this.store.lockAccount(tx,principal.accountId), now=this.clock();
  const session=await this.store.session(tx,principal.sessionId,principal.accountId);
  if(account?.status !== 'active' || !session || session.device_id !== principal.deviceId || session.revoked_at ||
   session.absolute_expires_at.getTime()<=now.getTime() || session.last_active_at.getTime()+24*3600000<=now.getTime() ||
   !await this.trust.isActive(tx,principal.accountId,principal.deviceId)) throw new Error('unauthorized');
 }
 async authenticate(handle:string):Promise<Principal|null> {
  try {
   if(!/^[A-Za-z0-9_-]{43}$/.test(handle)) return null;
   const session=await this.store.sessionByHash(hash(handle)); if(!session) return null;
   const principal={accountId:session.account_id,deviceId:session.device_id,sessionId:session.id};
   return await this.db.transaction().execute(async tx=>{ await this.authorizeTransaction(tx,principal); await this.store.touch(tx,session.id,this.clock()); return principal; });
  } catch { return null; }
 }
 async revokeDeviceSessions(tx:Transaction<Database>,accountId:string,deviceId:string):Promise<void> { await this.store.revoke(tx,accountId,this.clock(),{deviceId}); }
 async recordDeviceRevocation(tx:Transaction<Database>,principal:Principal,deviceId:string):Promise<void> { await this.store.audit(tx,principal.accountId,deviceId,'device-revoked',this.clock()); }
 async logout(principal:Principal):Promise<LogoutResult> { return this.revokeAndPrepareLogout(principal,false); }
 async logoutAll(principal:Principal):Promise<LogoutResult> { return this.revokeAndPrepareLogout(principal,true); }
 private async revokeAndPrepareLogout(principal:Principal,all:boolean):Promise<LogoutResult> {
  try {
   await this.db.transaction().execute(async tx=>{
    await this.authorizeTransaction(tx,principal);
    await this.store.revoke(tx,principal.accountId,this.clock(),all?undefined:{sessionId:principal.sessionId});
    await this.store.audit(tx,principal.accountId,principal.deviceId,all?'logout-all':'logout',this.clock());
   });
  } catch { throw new Error('unauthorized'); }
  // Local authorization is already revoked. Failure here cannot resurrect it.
  try {
   const ticket=opaque(),state=opaque(),id=randomUUID(),now=this.clock();
   await this.db.transaction().execute(async tx=>{
    const session=await this.store.session(tx,principal.sessionId,principal.accountId); if(!session) throw 0;
    const tokens=decodeTokens(await this.vault.open({ciphertext:session.tokens_ciphertext,keyId:session.tokens_key_id},'session:'+session.id));
    const sealed=await this.vault.seal(JSON.stringify({...tokens,state}),'logout:'+id);
    await this.store.insertLogoutTicket(tx,{id,ticket_hash:hash(ticket),session_id:session.id,input_ciphertext:sealed.ciphertext,input_key_id:sealed.keyId,
     callback_state_hash:hash(state),expires_at:add(now,60000),consumed_at:null,callback_at:null});
   });
   const url=new URL('/v1/auth/provider-logout',this.config.callbackUrl);url.searchParams.set('ticket',ticket);
   return {local:'revoked',provider:'pending',browserLogoutUrl:url.href};
  } catch { return {local:'revoked',provider:'pending'}; }
 }
 async beginProviderLogout(ticket:string):Promise<string> {
  let claimed:string|undefined;
  try {
   const row=await this.store.consumeLogoutTicket(hash(ticket),this.clock()); if(!row) throw 0; claimed=row.id;
   const value=await this.vault.open({ciphertext:row.input_ciphertext,keyId:row.input_key_id},'logout:'+row.id), parsed=decodeObject(value);
   if(typeof parsed.state !== 'string') throw 0;
   const {logoutUrl}=await this.oidc.revokeAndLogout(decodeTokens(value),{state:parsed.state,redirectUri:this.config.logoutCallbackUrl});
   await this.store.markProviderRevoked(row.id); return logoutUrl;
  } catch { if(claimed) await this.store.retryLogoutTicket(claimed,this.clock()).catch(()=>{}); throw new Error('logout_refused'); }
 }
 async finishProviderLogout(state:string):Promise<void> {
  try { await this.db.transaction().execute(tx=>this.store.completeLogout(tx,hash(state),this.clock())); }
  catch { throw new Error('logout_refused'); }
 }
 async backchannelLogout(jwt:string):Promise<void> {
  try {
   const verified=await this.oidc.verifyLogout(jwt); if(verified.issuer !== this.config.issuer) throw 0;
   await this.db.transaction().execute(async tx=>{
    if(!await this.store.recordLogout(tx,verified)) return;
    for(const account of await this.store.accountsForSid(tx,verified.issuer,verified.sid)) {
     await this.store.lockAccount(tx,account.account_id); await this.store.revokeSid(tx,account.account_id,verified.sid,this.clock());
    }
   });
  } catch { throw new Error('logout_refused'); }
 }
}
