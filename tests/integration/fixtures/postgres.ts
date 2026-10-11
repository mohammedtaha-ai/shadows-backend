import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { appendFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

export async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fixture_port');
  await new Promise<void>(resolve => server.close(() => resolve()));
  return address.port;
}

export async function postgresFixture() {
  if (process.getuid?.() === 0) throw new Error('fixture_refuses_root');
  // Never reads DATABASE_URL; all resources originate here.
  const root = resolve('.test-runtime'); await mkdir(root, { recursive: true });
  const directory = await mkdtemp(resolve(root, 'pg-'));
  const port = await freePort(), password = randomBytes(32).toString('hex');
  const cluster = new EmbeddedPostgres({ databaseDir: resolve(directory, 'cluster'), user: 'b1', password,
    port, persistent: false, authMethod: 'scram-sha-256', createPostgresUser: false, onLog: () => {}, onError: () => {} });
  let pool: pg.Pool | undefined; let closing = false;
  try {
    await cluster.initialise();
    await appendFile(resolve(directory, 'cluster/postgresql.conf'), "\nlisten_addresses = '127.0.0.1'\n");
    await cluster.start(); await cluster.createDatabase('b1_acceptance');
    const connection = { host: '127.0.0.1', port, user: 'b1', password, database: 'b1_acceptance' };
    pool = new pg.Pool(connection);
    pool.on('error', () => { if (!closing) throw new Error('fixture_database_error'); });
    const version = (await pool.query('SHOW server_version')).rows[0].server_version as string;
    if (!version.startsWith('18.4')) throw new Error('fixture_version');
    return { connection, pool, version, url: `postgresql://b1:${password}@127.0.0.1:${port}/b1_acceptance`,
      async close() { closing = true; await pool!.end(); await cluster.stop(); await rm(directory, { recursive: true, force: true }); } };
  } catch { await pool?.end(); await cluster.stop().catch(() => {}); await rm(directory, { recursive: true, force: true }); throw new Error('postgres_fixture_setup'); }
}
