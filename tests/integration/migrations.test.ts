import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations } from '../../src/platform/database/migrate.js';
import { postgresFixture } from './fixtures/postgres.js';
test('empty_schema_up previous_schema_upgrade repeat_up_no_change down_up_reapply', async () => {
  const f = await postgresFixture();
  try {
    await runMigrations(f.connection, 'up', 1);
    assert.equal((await f.pool.query("SELECT to_regclass('identity_sessions') AS name")).rows[0].name, null);
    await runMigrations(f.connection, 'up'); await runMigrations(f.connection, 'up');
    assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM backend_migrations')).rows[0].n, 3);
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
test('concurrent_migration_lock_refused', async () => {
  const f = await postgresFixture(); const client = await f.pool.connect();
  try {
    // node-pg-migrate's canonical advisory lock: held by an independent session.
    await client.query('SELECT pg_advisory_lock(7241865325823964)');
    await assert.rejects(runMigrations(f.connection, 'up'), { message: 'migration_failed' });
  } finally { await client.query('SELECT pg_advisory_unlock(7241865325823964)'); client.release(); await f.close(); }
});
