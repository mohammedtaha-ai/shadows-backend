import { randomBytes } from 'node:crypto';
import { readConfig } from '../../../src/app/config.js';
import { createDatabase } from '../../../src/platform/database/pool.js';
import { runMigrations } from '../../../src/platform/database/migrate.js';
import { createIdentity, hash } from '../../../src/modules/identity/index.js';
import { createDevices } from '../../../src/modules/devices/index.js';
import { postgresFixture } from './postgres.js';
import { configEnv } from './config.js';
export async function identityFixture() {
 const f = await postgresFixture(); await runMigrations(f.connection, 'up');
 const config = readConfig(configEnv(f.url)), { db, pool } = createDatabase(f.url);
 let now = new Date(), subject = 'subject-one', failProvider = false, exchanges = 0;
 const oidc = {
  async authorizationUrl(binding: {state: string; nonce: string; verifier: string}) { const u = new URL(config.issuer + '/authorize'); u.searchParams.set('state',binding.state); u.searchParams.set('nonce',binding.nonce); u.searchParams.set('code_challenge',hash(binding.verifier)); return u.href; },
  async exchange(_callback: URL, _binding: unknown) { exchanges++; return { identity: { issuer: config.issuer, subject, providerSessionId: subject + '-sid' }, providerTokens: { refreshToken: 'synthetic-refresh-sensitive', idToken: 'synthetic-id-sensitive' } }; },
  async revokeAndLogout(_tokens: unknown, callback: { state: string; redirectUri: string }) { if (failProvider) throw new Error('synthetic-sensitive-provider-error'); const u = new URL(callback.redirectUri); u.searchParams.set('state',callback.state); return { logoutUrl: u.href }; },
  async verifyLogout(_jwt: string) { return { issuer: config.issuer, sid: subject + '-sid', jti: 'synthetic-jti', issuedAt: Math.floor(now.getTime()/1000) }; }
 };
 try {
 const devices = createDevices(db, () => now);
 const identity = createIdentity(db, config, oidc, devices.registration, devices.trust, () => now);
 devices.bindIdentity(identity);
 const verifier = () => randomBytes(32).toString('base64url');
 async function pending() {
   const returnVerifier = verifier(); const start = await identity.beginLogin({ platform: 'windows', returnUri: 'http://127.0.0.1:49152/oidc-return', returnChallenge: hash(returnVerifier) });
   const state = new URL(start.authorizationUrl).searchParams.get('state')!;
   const callback = new URL(config.callbackUrl); callback.searchParams.set('state',state); callback.searchParams.set('code','synthetic-code');
   return { returnVerifier, start, callback };
 }
 async function login() { const p = await pending(); const returned = await identity.finishLogin(p.callback); return identity.redeemReturn({ ticket: returned.ticket, returnVerifier: p.returnVerifier }); }
 return { ...f, db, appPool: pool, config, identity, devices, oidc, pending, login, verifier,
   get exchanges() { return exchanges; }, get now() { return now; }, advance(ms: number) { now = new Date(now.getTime()+ms); }, setSubject(value: string) { subject=value; }, failProvider() { failProvider=true; },
   async close() { await db.destroy(); if(!pool.ended) await pool.end(); await f.close(); } };
 } catch (error) { await db.destroy(); if(!pool.ended) await pool.end(); await f.close(); throw error; }
}
