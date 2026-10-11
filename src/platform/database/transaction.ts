import type { Kysely, Transaction } from 'kysely';
import type { Database } from './schema.js';
export function withTransaction<T>(db: Kysely<Database>, operation: (tx: Transaction<Database>) => Promise<T>): Promise<T> {
  return db.transaction().execute(operation);
}
