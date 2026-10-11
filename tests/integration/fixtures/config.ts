import { randomBytes } from 'node:crypto';
export function configEnv(databaseUrl: string) {
  return { B1_DATA_MODE:'synthetic', DATABASE_URL: databaseUrl, OIDC_ISSUER: 'https://identity.example.invalid/realms/b1',
    OIDC_CLIENT_ID: 'backend', OIDC_CLIENT_SECRET: randomBytes(32).toString('hex'),
    OIDC_CALLBACK_URL: 'https://backend.example.invalid/v1/auth/callback',
    OIDC_LOGOUT_CALLBACK_URL: 'https://backend.example.invalid/v1/auth/logout-callback',
    TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'), TOKEN_ENCRYPTION_KEY_ID: 'b1-test', PORT: '0' };
}
