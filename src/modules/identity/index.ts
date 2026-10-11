import { IdentityService } from './service.js';
export { hash } from './service.js';
export type { Principal, NativeLoginRequest, LoginStart, LoginReturn, SessionGrant, LogoutResult, VerifiedIdentity,Enrollment,ReturnRequest } from './model.js';
export type { OidcPort } from './oidc-port.js';
export type { DeviceRegistrationPort } from './device-registration-port.js';
export type { DeviceTrustPort } from './device-trust-port.js';
export type { IdentityService } from './service.js';
export function createIdentity(...args:ConstructorParameters<typeof IdentityService>):IdentityService { return new IdentityService(...args); }

export { createOidcClient } from './oidc-client.js';
export type { IdentitySettings } from './model.js';
