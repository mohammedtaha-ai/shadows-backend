import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../../src/app/config.js';
import { compose } from '../../src/app/compose.js';
import { postgresFixture } from './fixtures/postgres.js';
import { configEnv } from './fixtures/config.js';
import {runMigrations} from '../../src/platform/database/migrate.js';

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
