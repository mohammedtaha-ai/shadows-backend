import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../../src/app/config.js';
import { compose } from '../../src/app/compose.js';
import { postgresFixture } from './fixtures/postgres.js';
import { configEnv } from './fixtures/config.js';

test('missing_config_refuses_start', () => assert.throws(() => readConfig({}), { message: 'config_invalid' }));
test('real_identity_data_disabled_until_retention_review', () => {
 const env=configEnv('postgresql://synthetic:synthetic@127.0.0.1:5432/test');
 assert.throws(()=>readConfig({...env,B1_DATA_MODE:'production'}),{message:'config_invalid'});
 assert.throws(()=>readConfig({...env,B1_DATA_MODE:undefined}),{message:'config_invalid'});
});
test('non_https_issuer_refused', () => {
  const env = configEnv('postgresql://synthetic:synthetic@127.0.0.1:5432/test');
  assert.throws(() => readConfig({ ...env, OIDC_ISSUER: 'http://127.0.0.1/realms/b1' }), { message: 'config_invalid' });
  for (const key of ['TOKEN_ENCRYPTION_KEY', 'OIDC_CALLBACK_URL', 'PORT'])
    assert.throws(() => readConfig({ ...env, [key]: 'sensitive-invalid-value' }), { message: 'config_invalid' });
});
test('graceful_shutdown_closes_pool', async () => {
  const fixture = await postgresFixture();
  try {
    const app = await compose(readConfig(configEnv(fixture.url)));
    await app.start(); const address = app.server.server.address(); assert.ok(address);
    const response = await app.server.inject('/health'); assert.equal(response.statusCode, 200);
    await app.stop(); await app.stop();
    assert.equal(app.server.server.listening, false); assert.equal(app.pool.ended, true);
  } finally { await fixture.close(); }
});
