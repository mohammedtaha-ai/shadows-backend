// NON-PRODUCT. Dedicated disposable PostgreSQL cluster; never consumes DATABASE_URL.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { PgBoss } from 'pg-boss';
import { runner } from 'node-pg-migrate';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, save } from './record.mjs';
import { applyOrReplayRemote } from './remote-fixture.mjs';
const password = randomUUID();
const probeDir = fileURLToPath(new URL('.', import.meta.url));
assert.equal(resolve('.'), resolve(probeDir), 'run only from the dedicated probe directory');
const clusterDir = resolve(probeDir, '.cluster');
assert.equal(clusterDir, resolve('E:/Globalprojects/shadows-backend/probes/b0-2026-10-10/.cluster'), 'verify disposable cleanup target stays inside the authorized workspace');
const cluster = new EmbeddedPostgres({ databaseDir: clusterDir, user: 'b0', password, port: 45872, persistent: false, authMethod: 'scram-sha-256', createPostgresUser: false, onLog: () => {}, onError: () => {} });
let pool, db, boss;
try {
await cluster.initialise(); await appendFile('.cluster/postgresql.conf', "\nlisten_addresses = '127.0.0.1'\n"); await cluster.start(); await cluster.createDatabase('b0_capability');
const connectionString = `postgresql://b0:${password}@127.0.0.1:45872/b0_capability`;
pool = new pg.Pool({ connectionString }); db = new Kysely({ dialect: new PostgresDialect({ pool }) });
const migrate = direction => runner({ databaseUrl: connectionString, dir: 'migrations', direction, count: Infinity, migrationsTable: 'b0_migration_history', log: () => {} });
await check('migration empty upgrade rollback and reapply', async () => {
  await runner({ databaseUrl: connectionString, dir: 'migrations', direction: 'up', count: 1, migrationsTable: 'b0_migration_history', log: () => {} });
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='probe_item' AND column_name='fixture_note'")).rows[0].n, 0);
  const competing = await Promise.allSettled([migrate('up'), migrate('up')]); assert.equal(competing.filter(r => r.status === 'fulfilled').length, 1); assert.equal(competing.filter(r => r.status === 'rejected').length, 1);
  assert.match(competing.find(r => r.status === 'rejected').reason.message, /Another migration is already running/);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='probe_item' AND column_name='fixture_note'")).rows[0].n, 1);
  await migrate('up'); await migrate('down'); assert.equal((await pool.query("SELECT to_regclass('probe_item') AS name")).rows[0].name, null); await migrate('up');
  const version = (await pool.query('SELECT version() AS version')).rows[0].version;
  return { version, emptyUp: true, priorSchemaUpgrade: true, concurrentMigrationRefused: true, repeatUp: true, downUp: true };
});
await check('scoped queries rollback concurrent revision conflict', async () => {
  await db.insertInto('probe_item').values({ id: 'fixture', account: 'a', revision: 0 }).execute();
  assert.equal((await db.selectFrom('probe_item').selectAll().where('account', '=', 'b').execute()).length, 0);
  await assert.rejects(db.transaction().execute(async trx => { await trx.updateTable('probe_item').set({ revision: 99 }).where('id', '=', 'fixture').execute(); throw new Error('synthetic rollback'); }), /synthetic rollback/);
  assert.equal((await db.selectFrom('probe_item').selectAll().executeTakeFirst()).revision, 0);
  const update = () => db.transaction().execute(trx => trx.updateTable('probe_item').set({ revision: 1 }).where('id', '=', 'fixture').where('account', '=', 'a').where('revision', '=', 0).returningAll().execute());
  const outcomes = await Promise.all([update(), update()]); assert.deepEqual(outcomes.map(x => x.length).sort(), [0, 1]);
  return { foreignRows: 0, rollbackRevision: 0, competingWrites: outcomes.map(x => x.length).sort() };
});
boss = new PgBoss({ connectionString, schema: 'b0_jobs', superviseIntervalSeconds: 1, monitorIntervalSeconds: 1 }); boss.on('error', () => {}); await boss.start(); await boss.createQueue('delivery', { retryLimit: 1, retryDelay: 0, expireInSeconds: 2 });
// Parameterized SQL must use CompiledQuery on the same transaction, not sql.raw interpolation.
const { CompiledQuery } = await import('kysely');
const transactionAdapter = trx => ({ executeSql: async (text, values) => ({ rows: (await trx.executeQuery(CompiledQuery.raw(text, values))).rows }) });
await check('atomic domain write and enqueue rollback and commit', async () => {
  await assert.rejects(db.transaction().execute(async trx => { await trx.insertInto('probe_delivery').values({ id: 'rolledback', fingerprint: 'v1' }).execute(); await boss.send('delivery', { id: 'rolledback', fingerprint: 'v1' }, { db: transactionAdapter(trx) }); throw new Error('synthetic rollback'); }), /synthetic rollback/);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM probe_delivery WHERE id='rolledback'")).rows[0].n, 0);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM b0_jobs.job WHERE data->>'id'='rolledback'")).rows[0].n, 0);
  await db.transaction().execute(async trx => { await trx.insertInto('probe_delivery').values({ id: 'committed', fingerprint: 'v1' }).execute(); await boss.send('delivery', { id: 'committed', fingerprint: 'v1' }, { db: transactionAdapter(trx) }); });
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM b0_jobs.job WHERE data->>'id'='committed'")).rows[0].n, 1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM probe_delivery WHERE id='committed'")).rows[0].n, 1);
  return { rollbackDomainRows: 0, rollbackJobs: 0, committedDomainRows: 1, committedJobs: 1 };
});
await check('interrupted lease restart recovery external reconciliation', async () => {
  const job = (await pool.query("SELECT id FROM b0_jobs.job WHERE data->>'id'='committed'")).rows[0]; assert.ok(job);
  await boss.stop({ graceful: false });
  // Real separate worker dies after remote commit, without calling complete().
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, ['worker-crash.mjs'], { stdio: ['pipe', 'ignore', 'ignore'] }); child.stdin.end(connectionString); const exit = await new Promise(r => child.on('exit', r)); assert.equal(exit, 73);
  boss = new PgBoss({ connectionString, schema: 'b0_jobs', superviseIntervalSeconds: 1, monitorIntervalSeconds: 1 }); boss.on('error', () => {}); await boss.start();
  let recovered; const deadline = Date.now() + 15000;
  while (Date.now() < deadline && !recovered) { await new Promise(r => setTimeout(r, 500)); [recovered] = await boss.fetch('delivery'); }
  assert.ok(recovered, 'expired job must become fetchable'); assert.equal(recovered.id, job.id);
  const prior = (await pool.query('SELECT * FROM probe_remote_effect WHERE id=$1', [recovered.data.id])).rows[0]; assert.equal(prior.fingerprint, recovered.data.fingerprint);
  const remote = new pg.Client({ connectionString }); await remote.connect();
  try {
    await applyOrReplayRemote(remote, recovered.data.id, recovered.data.fingerprint);
    await applyOrReplayRemote(remote, recovered.data.id, recovered.data.fingerprint);
    await assert.rejects(applyOrReplayRemote(remote, recovered.data.id, 'different-content'), /fingerprint conflict/);
  } finally { await remote.end(); }
  await pool.query('UPDATE probe_delivery SET outcome=$2 WHERE id=$1', [recovered.data.id, 'reconciled']); await boss.complete('delivery', recovered.id);
  assert.equal((await pool.query('SELECT outcome FROM probe_delivery WHERE id=$1', [recovered.data.id])).rows[0].outcome, 'reconciled');
  assert.equal((await pool.query('SELECT state FROM b0_jobs.job WHERE id=$1', [recovered.id])).rows[0].state, 'completed');
  assert.equal((await pool.query('SELECT sum(effects)::int AS n FROM probe_remote_effect')).rows[0].n, 1);
  return { sameJobRecovered: true, remoteEffects: 1, outcome: 'reconciled', changedFingerprintRefused: true, workerExit: 73 };
});
await check('retry exhaustion remains visible', async () => {
  const id = await boss.send('delivery', { id: 'exhaustion', fingerprint: 'v1' });
  const [first] = await boss.fetch('delivery'); assert.equal(first.id, id); await boss.fail('delivery', id, { reason: 'synthetic failure' });
  const [second] = await boss.fetch('delivery'); assert.equal(second.id, id); await boss.fail('delivery', id, { reason: 'synthetic failure' });
  const row = (await pool.query('SELECT state, retry_count FROM b0_jobs.job WHERE id=$1', [id])).rows[0]; assert.equal(row.state, 'failed');
  return { state: row.state, retryCount: row.retry_count };
});
} finally { if (boss) await boss.stop({ graceful: false }); if (db) await db.destroy(); else if (pool) await pool.end(); await cluster.stop(); await save('database-results'); }
