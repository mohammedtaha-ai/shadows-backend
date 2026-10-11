import type { LoginBinding, ProviderTokens, VerifiedIdentity } from './model.js';
export interface OidcPort {
 authorizationUrl(binding: LoginBinding): Promise<string>;
 exchange(callback: URL, binding: LoginBinding): Promise<{identity: VerifiedIdentity; providerTokens: ProviderTokens}>;
 revokeAndLogout(tokens: ProviderTokens, callback: {state: string; redirectUri: string}): Promise<{logoutUrl: string}>;
 verifyLogout(jwt: string): Promise<{issuer: string; sid: string; jti: string; issuedAt: number}>;
}
