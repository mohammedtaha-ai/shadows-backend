import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations } from '../../src/platform/database/migrate.js';
import { postgresFixture } from './fixtures/postgres.js';

test('conversations_upgrade_owns_tables_and_preserves_laptop_activity_on_rollback', async () => {
  const f = await postgresFixture();
  try {
    await runMigrations(f.connection, 'up', 9);
    await runMigrations(f.connection, 'up');
    for (const name of ['topics','messages','turns','intents','events','receipts']) {
      assert.equal((await f.pool.query('SELECT to_regclass($1) AS name', [`conversations_${name}`])).rows[0].name, `conversations_${name}`);
    }
    const account='00000000-0000-4000-8000-000000000001',laptop='00000000-0000-4000-8000-000000000002';
    await f.pool.query('INSERT INTO activity_cursors(account_id,high_water) VALUES($1,2)',[account]);
    await f.pool.query("INSERT INTO activity_events(account_id,seq,kind,laptop_id,payload,expires_at) VALUES($1,1,'laptop_offline',$2,'{}',now()+interval '1 day'),($1,2,'topic_deleted',null,'{}',now()+interval '1 day')",[account,laptop]);
    await assert.rejects(f.pool.query("INSERT INTO activity_events(account_id,seq,kind,payload,expires_at) VALUES($1,3,'laptop_offline','{}',now()+interval '1 day')",[account]),{code:'23514'});
    await assert.rejects(f.pool.query("UPDATE activity_events SET laptop_id=$1 WHERE kind='topic_deleted'",[laptop]),{code:'23514'});
    await runMigrations(f.connection,'down',2);
    assert.deepEqual((await f.pool.query('SELECT kind,laptop_id FROM activity_events')).rows,[{kind:'laptop_offline',laptop_id:laptop}]);
    assert.equal(Number((await f.pool.query('SELECT floor FROM activity_cursors')).rows[0].floor),2);
    await assert.rejects(f.pool.query("INSERT INTO activity_events(account_id,seq,kind,payload,expires_at) VALUES($1,3,'topic_deleted','{}',now()+interval '1 day')",[account]),{code:'23502'});
    await runMigrations(f.connection,'up');
  } finally { await f.close(); }
});
test('empty_schema_up previous_schema_upgrade repeat_up_no_change down_up_reapply', async () => {
  const f = await postgresFixture();
  try {
    await runMigrations(f.connection, 'up', 1);
    assert.equal((await f.pool.query("SELECT to_regclass('identity_sessions') AS name")).rows[0].name, null);
    await runMigrations(f.connection, 'up'); await runMigrations(f.connection, 'up');
    assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM backend_migrations')).rows[0].n, 11);
    await runMigrations(f.connection, 'down');
    assert.equal((await f.pool.query("SELECT to_regclass('identity_accounts') AS name")).rows[0].name, null);
    await runMigrations(f.connection, 'up');
    const columns = (await f.pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='identity_sessions'")).rows.map(r => r.column_name);
    assert.ok(columns.includes('handle_hash')); assert.ok(columns.includes('tokens_ciphertext')); assert.ok(!columns.includes('handle'));
    const accounts = ['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
    for (const [i, id] of accounts.entries()) await f.pool.query('INSERT INTO identity_accounts(id,issuer,subject) VALUES($1,$2,$3)', [id,'synthetic',String(i)]);
    const device = '00000000-0000-4000-8000-000000000003';
    await f.pool.query('INSERT INTO devices(id,account_id) VALUES($1,$2)', [device,accounts[0]]);
    await assert.rejects(f.pool.query("INSERT INTO identity_sessions(id,handle_hash,account_id,device_id,provider_sid,tokens_ciphertext,tokens_key_id,absolute_expires_at) VALUES($1,'hashed',$2,$3,'sid','encrypted','key',now()+interval '1 day')", ['00000000-0000-4000-8000-000000000004',accounts[1],device]), { code: '23503' });
  } finally { await f.close(); }
});

test('provider_settings_migration_preserves_existing_rows_and_enforces_owned_constraints', async () => {
  const f = await postgresFixture();
  try {
    await runMigrations(f.connection, 'up', 8);
    await f.pool.query("INSERT INTO identity_accounts(id,issuer,subject) VALUES('00000000-0000-4000-8000-000000000001','synthetic','provider-upgrade')");
    await runMigrations(f.connection, 'up');
    assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_accounts')).rows[0].n, 1);
    assert.ok((await f.pool.query("SELECT to_regclass('provider_settings_connections') AS name")).rows[0].name);
    await f.pool.query("INSERT INTO provider_settings_accounts(account_id) VALUES('00000000-0000-4000-8000-000000000001')");
    await f.pool.query("INSERT INTO provider_settings_connections(id,account_id,name,format,origin,base_path,model,credential_revision,sealed_key,key_id,state,revision,created_at,updated_at) VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','Synthetic','openai_compatible','https://provider.example','/v1','synthetic-model',1,'synthetic-ciphertext','synthetic-key-id','active',1,now(),now())");
    await assert.rejects(f.pool.query("UPDATE provider_settings_accounts SET default_connection_id='00000000-0000-4000-8000-000000000002'"), { code: '23503' });
    await assert.rejects(f.pool.query("UPDATE provider_settings_connections SET state='removed'"), { code: '23514' });
    await runMigrations(f.connection, 'down', 3);
    assert.equal((await f.pool.query("SELECT to_regclass('provider_settings_connections') AS name")).rows[0].name, null);
    assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_accounts')).rows[0].n, 1);
    await runMigrations(f.connection, 'up');
  } finally { await f.close(); }
});
test('concurrent_migration_lock_refused', async () => {
  const f = await postgresFixture(); const client = await f.pool.connect();
  try {
    // node-pg-migrate's canonical advisory lock: held by an independent session.
    await client.query('SELECT pg_advisory_lock(7241865325823964)');
    await assert.rejects(runMigrations(f.connection, 'up'), { message: 'migration_failed' });
  } finally { await client.query('SELECT pg_advisory_unlock(7241865325823964)'); client.release(); await f.close(); }
});

test('enrollment_upgrade_preserves_legacy_session_without_minting_proof',async()=>{
 const f=await postgresFixture();
 try {
  await runMigrations(f.connection,'up',3);
  await f.pool.query("INSERT INTO identity_accounts(id,issuer,subject) VALUES('00000000-0000-4000-8000-000000000001','synthetic','legacy')");
  await f.pool.query("INSERT INTO devices(id,account_id) VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001')");
  await f.pool.query("INSERT INTO identity_sessions(id,handle_hash,account_id,device_id,provider_sid,tokens_ciphertext,tokens_key_id,absolute_expires_at) VALUES('00000000-0000-4000-8000-000000000003','legacy-hash','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','legacy-sid','encrypted','key',now()+interval '1 day')");
  await runMigrations(f.connection,'up');
  assert.equal((await f.pool.query('SELECT enrollment_hash FROM devices')).rows[0].enrollment_hash,null);
  assert.equal((await f.pool.query('SELECT revoked_at,handle_hash FROM identity_sessions')).rows[0].revoked_at,null);
  assert.equal((await f.pool.query('SELECT handle_hash FROM identity_sessions')).rows[0].handle_hash,'legacy-hash');
 }finally{await f.close();}
});
