import * as oidc from 'openid-client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { IdentitySettings } from './model.js';
import type { OidcPort } from './oidc-port.js';

export class OidcRefusal extends Error {
 constructor(readonly code: string, readonly providerError?: 'invalid_grant') { super('oidc_refused'); }
}
function refusal(error: unknown): OidcRefusal {
 const e=error as {code?:unknown;error?:unknown};
 const codes=['OAUTH_INVALID_RESPONSE','OAUTH_JWT_CLAIM_COMPARISON_FAILED','OAUTH_RESPONSE_BODY_ERROR','OAUTH_KEY_SELECTION_FAILED','OAUTH_JWT_TIMESTAMP_CHECK_FAILED'];
 return new OidcRefusal(typeof e?.code === 'string' && codes.includes(e.code)?e.code:'oidc_unavailable',e?.error === 'invalid_grant'?'invalid_grant':undefined);
}
export function createOidcClient(settings:IdentitySettings):OidcPort {
 let configuration:Promise<oidc.Configuration>|undefined;
 let jwks:ReturnType<typeof createRemoteJWKSet>|undefined;
 async function config() {
  configuration ??= oidc.discovery(new URL(settings.issuer),settings.clientId,
   {client_secret:settings.clientSecret,id_token_signed_response_alg:'RS256',[oidc.clockTolerance]:30},
   oidc.ClientSecretBasic(settings.clientSecret),{execute:[oidc.enableNonRepudiationChecks],timeout:15})
   .then(c=>{
    const metadata=c.serverMetadata();
    if(metadata.issuer !== settings.issuer) throw new Error('oidc_unavailable');
    for(const key of ['authorization_endpoint','token_endpoint','jwks_uri','revocation_endpoint','end_session_endpoint','introspection_endpoint'] as const) {
     const url=new URL(metadata[key]!); if(url.protocol !== 'https:' || url.origin !== new URL(settings.issuer).origin || url.username || url.password || url.hash) throw new Error('oidc_unavailable');
    }
    jwks=createRemoteJWKSet(new URL(metadata.jwks_uri!),{timeoutDuration:15000,cooldownDuration:0});
    return c;
   }).catch(()=>{configuration=undefined;throw new OidcRefusal('oidc_unavailable');});
  return configuration;
 }
 return {
  async authorizationUrl(binding) {
   try { return oidc.buildAuthorizationUrl(await config(),{redirect_uri:settings.callbackUrl,scope:'openid profile',
    response_type:'code',state:binding.state,nonce:binding.nonce,code_challenge:await oidc.calculatePKCECodeChallenge(binding.verifier),code_challenge_method:'S256'}).href; }
   catch(error) {throw refusal(error);}
  },
  async exchange(callback,binding) {
   try {
    if(callback.origin+callback.pathname !== settings.callbackUrl) throw new OidcRefusal('OAUTH_INVALID_RESPONSE');
    const tokens=await oidc.authorizationCodeGrant(await config(),callback,{pkceCodeVerifier:binding.verifier,expectedState:binding.state,expectedNonce:binding.nonce,idTokenExpected:true});
    const claims=tokens.claims();
    if(claims?.iss !== settings.issuer || typeof claims.sub !== 'string' || !claims.sub || typeof claims.sid !== 'string' || !claims.sid || !tokens.refresh_token || !tokens.id_token) throw new OidcRefusal('OAUTH_INVALID_RESPONSE');
    return {identity:{issuer:claims.iss,subject:claims.sub,providerSessionId:claims.sid},providerTokens:{refreshToken:tokens.refresh_token,idToken:tokens.id_token}};
   } catch(error) {throw refusal(error);}
  },
  async revokeAndLogout(tokens,callback) {
   try {
    if(callback.redirectUri !== settings.logoutCallbackUrl) throw 0;
    const c=await config(); await oidc.tokenRevocation(c,tokens.refreshToken,{token_type_hint:'refresh_token'});
    return {logoutUrl:oidc.buildEndSessionUrl(c,{id_token_hint:tokens.idToken,post_logout_redirect_uri:settings.logoutCallbackUrl,state:callback.state}).href};
   } catch {throw new Error('logout_refused');}
  },
  async isSessionActive(tokens) {
   try {const c=await config();const result=await oidc.tokenIntrospection(c,tokens.refreshToken,{token_type_hint:'refresh_token'});return result.active===true;}
   catch{throw new Error('provider_unavailable');}
  },
  async refreshSession(tokens,identity) {
   try {
    const refreshed=await oidc.refreshTokenGrant(await config(),tokens.refreshToken);
    const claims=refreshed.claims();
    if(claims && (claims.iss!==identity.issuer || claims.sub!==identity.subject || claims.sid!==identity.providerSessionId))throw 0;
    return {refreshToken:refreshed.refresh_token ?? tokens.refreshToken,idToken:refreshed.id_token ?? tokens.idToken};
   }catch{throw new Error('provider_unavailable');}
  },
  async verifyLogout(jwt) {
   try {
    await config();
    const {payload}=await jwtVerify(jwt,jwks!,{issuer:settings.issuer,audience:settings.clientId,algorithms:['RS256'],clockTolerance:30,maxTokenAge:300,requiredClaims:['iss','aud','iat','sid','jti','events']});
    const events=payload.events;
    if('nonce' in payload || typeof payload.sid !== 'string' || !payload.sid || payload.sid.length>512 || typeof payload.jti !== 'string' || !payload.jti || payload.jti.length>128 ||
     typeof payload.iat !== 'number' || !Number.isInteger(payload.iat) || !events || typeof events !== 'object' || Array.isArray(events)) throw 0;
    const event=(events as Record<string,unknown>)['http://schemas.openid.net/event/backchannel-logout'];
    if(!event || typeof event !== 'object' || Array.isArray(event) || Object.keys(event).length) throw 0;
    return {issuer:settings.issuer,sid:payload.sid,jti:payload.jti,issuedAt:payload.iat};
   } catch {throw new Error('logout_refused');}
  }
 };
}
