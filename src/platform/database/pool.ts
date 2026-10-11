import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { Database } from './schema.js';
export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000, statement_timeout: 15000, max: 10 });
  pool.on('error', () => {}); // No driver exception or connection data in diagnostics.
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
  return { pool, db };
}
