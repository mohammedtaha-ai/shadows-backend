import { runner } from 'node-pg-migrate';
import type pg from 'pg';
import { fileURLToPath } from 'node:url';
export async function runMigrations(connection: pg.ConnectionConfig, direction: 'up' | 'down', count = Infinity): Promise<void> {
  try {
    await runner({ databaseUrl: connection, dir: fileURLToPath(new URL('../../../migrations', import.meta.url)),
      direction, count, migrationsTable: 'backend_migrations', checkOrder: true, log: () => {}, logger: { info() {}, warn() {}, error() {} } });
  } catch { throw new Error('migration_failed'); }
}
