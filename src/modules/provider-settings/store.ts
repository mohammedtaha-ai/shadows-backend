import type { Insertable, Selectable, Transaction, Updateable } from 'kysely';
import type { Database } from '../../platform/database/schema.js';

type Tx = Transaction<Database>;
type Table = Database['provider_settings_connections'];
export type ConnectionRow = Selectable<Table>;

export class ProviderSettingsStore {
  async guard(tx: Tx, accountId: string) {
    await tx.insertInto('provider_settings_accounts').values({ account_id: accountId })
      .onConflict(conflict => conflict.column('account_id').doNothing()).execute();
    await tx.selectFrom('provider_settings_accounts').selectAll().where('account_id', '=', accountId).forUpdate().executeTakeFirstOrThrow();
  }
  list(tx: Tx, accountId: string) {
    return tx.selectFrom('provider_settings_connections').selectAll().where('account_id', '=', accountId)
      .where('state', '=', 'active').orderBy('created_at').orderBy('id').execute();
  }
  lock(tx: Tx, accountId: string, id: string) {
    return tx.selectFrom('provider_settings_connections').selectAll().where('account_id', '=', accountId)
      .where('id', '=', id).where('state', '=', 'active').forUpdate().executeTakeFirst();
  }
  async insert(tx: Tx, row: Insertable<Table>) {
    return tx.insertInto('provider_settings_connections').values(row).returningAll().executeTakeFirstOrThrow();
  }
  async update(tx: Tx, accountId: string, id: string, patch: Updateable<Table>) {
    return tx.updateTable('provider_settings_connections').set(patch).where('account_id', '=', accountId)
      .where('id', '=', id).where('state', '=', 'active').returningAll().executeTakeFirstOrThrow();
  }
  async getDefault(tx: Tx, accountId: string) {
    const row = await tx.selectFrom('provider_settings_accounts').select('default_connection_id')
      .where('account_id', '=', accountId).executeTakeFirst();
    return row?.default_connection_id ?? null;
  }
  async setDefault(tx: Tx, accountId: string, connectionId: string | null) {
    await tx.updateTable('provider_settings_accounts').set({ default_connection_id: connectionId })
      .where('account_id', '=', accountId).execute();
  }
}
