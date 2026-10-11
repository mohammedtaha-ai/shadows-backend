export type VerifiedIdentity = { issuer: string; subject: string; providerSessionId: string };
export type Principal = { accountId: string; deviceId: string; sessionId: string };
export type NativeLoginRequest = { platform: 'windows'; returnUri: string; returnChallenge: string };
export type LoginStart = { attemptId: string; authorizationUrl: string };
export type LoginReturn = { returnUri: string; ticket: string };
export type Enrollment = {mode:'new'} | {mode:'reuse';credential:string};
export type ReturnRequest = {ticket:string;returnVerifier:string;enrollment:Enrollment};
export type SessionGrant = { handle: string; principal: Principal; expiresAt: string; enrollmentCredential?:string };
export type LogoutResult = { local: 'revoked'; provider: 'complete' | 'pending'; browserLogoutUrl?: string };
export type ProviderTokens = { refreshToken: string; idToken: string };
export type LoginBinding = { state: string; nonce: string; verifier: string };

export type IdentitySettings = {
 issuer:string;clientId:string;clientSecret:string;callbackUrl:string;logoutCallbackUrl:string;encryptionKey:Buffer;encryptionKeyId:string;
};
