// NON-PRODUCT. Maintained OIDC provider, synthetic account, loopback HTTP only.
// Auto-consent below is a test fixture, never an authentication implementation.
import { Provider } from 'oidc-provider';
import * as client from 'openid-client';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { check, save } from './record.mjs';
const issuer = 'http://127.0.0.1:45874';
const redirect = 'http://127.0.0.1:45875/return';
const provider = new Provider(issuer, {
  clients: [{ client_id: 'b0-native', application_type: 'native', token_endpoint_auth_method: 'none', redirect_uris: [redirect], post_logout_redirect_uris: [redirect], response_types: ['code'], grant_types: ['authorization_code', 'refresh_token'] }],
  features: { devInteractions: { enabled: false }, revocation: { enabled: true }, rpInitiatedLogout: { enabled: true, logoutSource: async (ctx, form) => { ctx.body = form; } } },
  ttl: { AccessToken: 2 },
  clockTolerance: 0,
  pkce: { required: () => true },
  interactions: { url: (_ctx, interaction) => `/fixture-interaction/${interaction.uid}` },
  findAccount: async (_ctx, id) => ({ accountId: id, claims: async () => ({ sub: id }) }),
});
const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/fixture-interaction/')) {
      const details = await provider.interactionDetails(req, res);
      if (details.prompt.name === 'login') await provider.interactionFinished(req, res, { login: { accountId: 'synthetic-account' } }, { mergeWithLastSubmission: false });
      else {
        const grant = new provider.Grant({ accountId: details.session.accountId, clientId: details.params.client_id }); grant.addOIDCScope('openid offline_access');
        await provider.interactionFinished(req, res, { consent: { grantId: await grant.save() } }, { mergeWithLastSubmission: true });
      }
    } else provider.callback()(req, res);
  } catch { res.writeHead(500); res.end('Fixture failure (details withheld)'); }
});
await new Promise(r => server.listen(45874, '127.0.0.1', r));
try {
const config = await client.discovery(new URL(issuer), 'b0-native', undefined, client.None(), { execute: [client.allowInsecureRequests] });
await check('synthetic OIDC PKCE state nonce code replay and refresh revocation', async () => {
  const verifier = client.randomPKCECodeVerifier(), state = client.randomState(), nonce = client.randomNonce();
  let url = client.buildAuthorizationUrl(config, { redirect_uri: redirect, scope: 'openid offline_access', prompt: 'consent', code_challenge: await client.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256', state, nonce });
  const cookies = new Map();
  for (let n = 0; n < 15 && !url.href.startsWith(redirect); n++) {
    const response = await fetch(url, { redirect: 'manual', headers: { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') } });
    for (const item of response.headers.getSetCookie()) { const [pair] = item.split(';'); const pos = pair.indexOf('='); cookies.set(pair.slice(0, pos), pair.slice(pos + 1)); }
    assert.ok(response.headers.get('location'), 'fixture must redirect'); url = new URL(response.headers.get('location'), issuer);
  }
  assert.ok(url.href.startsWith(redirect));
  await assert.rejects(client.authorizationCodeGrant(config, url, { pkceCodeVerifier: verifier, expectedState: 'wrong-state', expectedNonce: nonce }));
  const tokens = await client.authorizationCodeGrant(config, url, { pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce }); assert.equal(tokens.claims().sub, 'synthetic-account');
  assert.ok(tokens.refresh_token);
  assert.equal((await client.fetchUserInfo(config, tokens.access_token, 'synthetic-account')).sub, 'synthetic-account');
  await new Promise(r => setTimeout(r, 2200)); await assert.rejects(client.fetchUserInfo(config, tokens.access_token, 'synthetic-account'));
  const refreshed = await client.refreshTokenGrant(config, tokens.refresh_token);
  const refreshToRevoke = refreshed.refresh_token ?? tokens.refresh_token;
  await client.tokenRevocation(config, refreshToRevoke, { token_type_hint: 'refresh_token' });
  await assert.rejects(client.refreshTokenGrant(config, refreshToRevoke));
  await assert.rejects(client.authorizationCodeGrant(config, url, { pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce }));
  const logout = client.buildEndSessionUrl(config, { id_token_hint: tokens.id_token, post_logout_redirect_uri: redirect, state: 'fixture-logout' }); assert.equal(logout.origin, issuer);
  const cookieHeader = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  const response = await fetch(logout, { redirect: 'manual', headers: { cookie: cookieHeader() } }); const html = await response.text();
  const action = /action="([^"]+)"/.exec(html)?.[1]; const xsrf = /name="xsrf" value="([^"]+)"/.exec(html)?.[1]; assert.ok(action); assert.ok(xsrf);
  const signedOut = await fetch(new URL(action, issuer), { method: 'POST', redirect: 'manual', headers: { cookie: cookieHeader(), 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ xsrf, logout: 'yes' }) });
  assert.ok([302, 303].includes(signedOut.status));
  for (const item of signedOut.headers.getSetCookie()) { const [pair] = item.split(';'); const pos = pair.indexOf('='); cookies.set(pair.slice(0, pos), pair.slice(pos + 1)); }
  const silent = client.buildAuthorizationUrl(config, { redirect_uri: redirect, scope: 'openid', prompt: 'none', code_challenge: await client.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256', state });
  const silentResult = await fetch(silent, { redirect: 'manual', headers: { cookie: cookieHeader() } }); const refused = new URL(silentResult.headers.get('location'), issuer); assert.equal(refused.searchParams.get('error'), 'login_required');
  return { PKCE: 'S256', wrongStateRefused: true, codeReplayRefused: true, refreshAfterRevocationRefused: true, expiredAccessRefused: true, logoutSilentLoginRefused: true };
});
} finally { await new Promise(r => server.close(r)); await save('oidc-synthetic-results'); }
