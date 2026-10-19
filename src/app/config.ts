import type { IdentitySettings } from '../modules/identity/index.js';
export type AppConfig = IdentitySettings & {
  hermes?:{origin:string;network?:string;keyFile:string};
  databaseUrl:string;port:number;
  byokKey: Buffer; byokKeyId: string; byokPreviousKeys: ReadonlyMap<string, Buffer>;
};
export function readConfig(env: NodeJS.ProcessEnv): AppConfig {
  try {
    if(env.B1_DATA_MODE !== 'synthetic') throw 0;
    const required = (key: string) => { const value = env[key]; if (!value || value.trim() !== value) throw 0; return value; };
    const https = (key: string) => { const value = required(key), url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw 0; return value; };
    const databaseUrl = required('DATABASE_URL'), db = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(db.protocol) || !db.hostname || db.hash) throw 0;
    const issuer = https('OIDC_ISSUER'), callbackUrl = https('OIDC_CALLBACK_URL'), logoutCallbackUrl = https('OIDC_LOGOUT_CALLBACK_URL');
    if (new URL(callbackUrl).pathname !== '/v1/auth/callback' || new URL(logoutCallbackUrl).pathname !== '/v1/auth/logout-callback' || new URL(callbackUrl).origin !== new URL(logoutCallbackUrl).origin) throw 0;
    const keyText = required('TOKEN_ENCRYPTION_KEY'), encryptionKey = Buffer.from(keyText, 'base64');
    if (encryptionKey.length !== 32 || encryptionKey.toString('base64') !== keyText) throw 0;
    const encryptionKeyId = required('TOKEN_ENCRYPTION_KEY_ID'); if (!/^[a-zA-Z0-9_-]{1,64}$/.test(encryptionKeyId)) throw 0;
    const byokKeyId = required('BYOK_KEY_ID'); if (!/^[a-zA-Z0-9_-]{1,64}$/.test(byokKeyId)) throw 0;
    const decodeByokKey = (value: string) => {
      const key = Buffer.from(value, 'base64');
      if (key.length !== 32 || key.toString('base64') !== value) throw 0;
      return key;
    };
    const byokKey = decodeByokKey(required('BYOK_KEY'));
    const byokPreviousKeys = new Map<string, Buffer>();
    if (env.BYOK_PREVIOUS_KEYS !== undefined) {
      for (const item of required('BYOK_PREVIOUS_KEYS').split(',')) {
        const pair = /^([a-zA-Z0-9_-]{1,64}):([^:]+)$/.exec(item);
        if (!pair || pair[1] === byokKeyId || byokPreviousKeys.has(pair[1]!)) throw 0;
        byokPreviousKeys.set(pair[1]!, decodeByokKey(pair[2]!));
      }
    }
    const portText = required('PORT'); if (!/^\d{1,5}$/.test(portText)) throw 0;
    const port = Number(portText); if (port > 65535) throw 0;
    let hermes:AppConfig['hermes'];
    if(env.HERMES_API_URL||env.HERMES_API_KEY_FILE)hermes={origin:required('HERMES_API_URL'),keyFile:required('HERMES_API_KEY_FILE'),network:env.HERMES_NETWORK};
    return { databaseUrl, issuer, callbackUrl, logoutCallbackUrl, encryptionKey, encryptionKeyId, port,...(hermes?{hermes}:{}),
      byokKey, byokKeyId, byokPreviousKeys,
      clientId: required('OIDC_CLIENT_ID'), clientSecret: required('OIDC_CLIENT_SECRET') };
  } catch { throw new Error('config_invalid'); }
}
