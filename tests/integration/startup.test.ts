import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../../src/app/config.js';
import { compose } from '../../src/app/compose.js';
import { postgresFixture } from './fixtures/postgres.js';
import { configEnv } from './fixtures/config.js';
import {runMigrations} from '../../src/platform/database/migrate.js';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { localEnvironment } from '../../docker/runtime.js';

test('byok_config_refuses_invalid_keys_ids_and_ambiguous_key_rings', () => {
  const env = {
    ...configEnv('postgresql://synthetic:synthetic@127.0.0.1:5432/test'),
    BYOK_KEY: Buffer.alloc(32, 1).toString('base64'), BYOK_KEY_ID: 'synthetic-current',
  };
  const previous = Buffer.alloc(32, 2).toString('base64');
  for (const override of [
    { BYOK_KEY: undefined }, { BYOK_KEY_ID: undefined },
    { BYOK_KEY: Buffer.alloc(31).toString('base64') }, { BYOK_KEY: Buffer.alloc(33).toString('base64') },
    { BYOK_KEY: 'sensitive-invalid-value' }, { BYOK_KEY: env.BYOK_KEY + '\n' },
    { BYOK_KEY_ID: '' }, { BYOK_KEY_ID: 'invalid:id' }, { BYOK_KEY_ID: 'x'.repeat(65) },
    { BYOK_PREVIOUS_KEYS: 'old:sensitive-invalid-value' },
    { BYOK_PREVIOUS_KEYS: `invalid id:${previous}` },
    { BYOK_PREVIOUS_KEYS: `synthetic-current:${previous}` },
    { BYOK_PREVIOUS_KEYS: `old:${previous},old:${previous}` },
    { BYOK_PREVIOUS_KEYS: `old:${previous},` }, { BYOK_PREVIOUS_KEYS: '' },
  ]) assert.throws(() => readConfig({ ...env, ...override }), { message: 'config_invalid' });
});

test('byok_config_loads_active_and_retained_previous_keys_separately_from_identity', () => {
  const env = configEnv('postgresql://synthetic:synthetic@127.0.0.1:5432/test');
  const previous = Buffer.alloc(32, 2).toString('base64');
  const config = readConfig({ ...env, BYOK_PREVIOUS_KEYS: `synthetic-old:${previous}` });
  assert.equal(config.byokKeyId, env.BYOK_KEY_ID);
  assert.deepEqual(config.byokKey, Buffer.from(env.BYOK_KEY, 'base64'));
  assert.notDeepEqual(config.byokKey, config.encryptionKey);
  assert.equal(config.byokPreviousKeys.size, 1);
  assert.deepEqual(config.byokPreviousKeys.get('synthetic-old'), Buffer.from(previous, 'base64'));
  assert.equal(readConfig(env).byokPreviousKeys.size, 0);
});

test('byok_local_bootstrap_and_runtime_use_isolated_synthetic_files_and_preserve_existing_keys', async () => {
  await mkdir('.test-runtime', { recursive: true });
  const directory = await mkdtemp(resolve('.test-runtime/byok-bootstrap-'));
  const previousRoot = process.env.LOCAL_RUNTIME;
  const bootstrap = () => promisify(execFile)(process.execPath, ['docker/bootstrap.mjs'], {
    env: { ...process.env, LOCAL_BOOTSTRAP_ROOT: directory },
  });
  try {
    await bootstrap();
    const original = await readFile(directory + '/secrets/byok-key', 'utf8');
    assert.equal(Buffer.from(original, 'base64').length, 32);
    const identityKey = await readFile(directory + '/secrets/token-key', 'utf8');
    assert.notEqual(original, identityKey);
    await bootstrap();
    assert.equal(await readFile(directory + '/secrets/byok-key', 'utf8'), original);
    process.env.LOCAL_RUNTIME = directory;
    const env = await localEnvironment();
    assert.equal(env.BYOK_KEY, original);
    assert.equal(readConfig(env).byokKey.length, 32);
    await rm(directory + '/secrets/byok-key');
    await bootstrap();
    assert.equal(Buffer.from(await readFile(directory + '/secrets/byok-key', 'utf8'), 'base64').length, 32);
    assert.equal(await readFile(directory + '/secrets/token-key', 'utf8'), identityKey);
    // Existing invalid material is preserved for explicit operator repair, never silently replaced.
    await writeFile(directory + '/secrets/byok-key', 'synthetic-invalid-existing-key');
    await bootstrap();
    assert.equal(await readFile(directory + '/secrets/byok-key', 'utf8'), 'synthetic-invalid-existing-key');
    assert.throws(() => readConfig({ ...env, BYOK_KEY: 'synthetic-invalid-existing-key' }), { message: 'config_invalid' });
  } finally {
    if (previousRoot === undefined) delete process.env.LOCAL_RUNTIME;
    else process.env.LOCAL_RUNTIME = previousRoot;
    await rm(directory, { recursive: true, force: true });
  }
});

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
    await runMigrations(fixture.connection,'up');
    const app = await compose(readConfig(configEnv(fixture.url)));
    await app.start(); const address = app.server.server.address(); assert.ok(address);
    const response = await app.server.inject('/health'); assert.equal(response.statusCode, 200);
    await app.stop(); await app.stop();
    assert.equal(app.server.server.listening, false); assert.equal(app.pool.ended, true);
  } finally { await fixture.close(); }
});

test('health_refuses_after_database_disconnect',async()=>{
 const f=await postgresFixture();await runMigrations(f.connection,'up');const app=await compose(readConfig(configEnv(f.url)));
 try{await app.start();await app.pool.end();const r=await app.server.inject('/health');assert.equal(r.statusCode,503);assert.deepEqual(r.json(),{status:'unavailable'});}
 finally{await app.stop();await f.close();}
});

test('stop_unstarted_application_closes_uninitialized_pool',async()=>{
 const f=await postgresFixture();try{
  const app=await compose(readConfig(configEnv(f.url)));await app.stop();await app.stop();
  assert.equal(app.pool.ended,true);assert.equal(app.server.server.listening,false);
 }finally{await f.close();}
});
