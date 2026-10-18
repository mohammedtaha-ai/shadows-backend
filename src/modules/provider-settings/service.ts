import { randomUUID } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
import type { IdentityService, Principal } from '../identity/index.js';
import type { ConnectionCreate, ConnectionUpdate, ConnectionView } from './model.js';
import { open, seal, type KeyRing } from './credential-seal.js';
import { validateDestination, type DestinationResolver } from './destination.js';
import { ProviderSettingsStore, type ConnectionRow } from './store.js';

type Tx = Transaction<Database>;
const allowed = new Set(['request_invalid', 'not_found', 'unauthorized', 'operation_failed', 'command_conflict',
  'rate_limited', 'destination_refused', 'credential_rejected', 'no_connection']);
function refusal(error: unknown): Error {
  if ((error as { code?: string })?.code === '23505') return new Error('command_conflict');
  return new Error(error instanceof Error && allowed.has(error.message) ? error.message : 'operation_failed');
}
const revision = (value: string) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('operation_failed');
  return number;
};
const increment = (value: string) => {
  const number = revision(value) + 1;
  if (!Number.isSafeInteger(number)) throw new Error('operation_failed');
  return number;
};
const baseUrl = (row: ConnectionRow) => row.origin + row.base_path;
const aad = (row: ConnectionRow) => ({ accountId: row.account_id, connectionId: row.id,
  destination: baseUrl(row), credentialRevision: revision(row.credential_revision) });
function validateInput(input: ConnectionUpdate, create: boolean) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length
    || Object.keys(input).some(key => !['name', 'format', 'baseUrl', 'model', 'apiKey'].includes(key))) throw new Error('request_invalid');
  for (const [key, max] of [['name', 80], ['baseUrl', 2048], ['model', 200], ['apiKey', 512]] as const) {
    const value = input[key];
    if (create || key in input) {
      if (typeof value !== 'string' || !value.length || value.length > max) throw new Error('request_invalid');
    }
  }
  if ((create || 'format' in input) && input.format !== 'openai_compatible') throw new Error('request_invalid');
}
const view = (row: ConnectionRow): ConnectionView => ({
  connectionId: row.id, name: row.name, format: row.format, baseUrl: baseUrl(row), model: row.model,
  keyConfigured: row.sealed_key !== null && row.key_id !== null, revision: revision(row.revision),
  createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
});

export function createProviderSettings(db: Kysely<Database>, access: Pick<IdentityService, 'authorizeTransaction'>,
  keyRing: KeyRing, resolver: DestinationResolver, clock: () => Date = () => new Date()) {
  const store = new ProviderSettingsStore();
  const run = async <T>(principal: Principal, operation: (tx: Tx) => Promise<T>): Promise<T> => {
    try {
      return await db.transaction().execute(async tx => {
        await access.authorizeTransaction(tx, principal);
        return operation(tx);
      });
    } catch (error) { throw refusal(error); }
  };
  const requireConnection = async (tx: Tx, accountId: string, id: string) => {
    const row = await store.lock(tx, accountId, id);
    if (!row) throw new Error('not_found');
    return row;
  };
  return {
    list(principal: Principal) {
      return run(principal, async tx => ({ connections: (await store.list(tx, principal.accountId)).map(view) }));
    },
    create(principal: Principal, input: ConnectionCreate) {
      return run(principal, async tx => {
        validateInput(input, true);
        await store.guard(tx, principal.accountId);
        if ((await store.list(tx, principal.accountId)).length >= 20) throw new Error('rate_limited');
        const destination = await validateDestination(input.baseUrl, resolver), url = new URL(input.baseUrl);
        const id = randomUUID(), now = clock();
        const credential = seal(keyRing, { accountId: principal.accountId, connectionId: id,
          destination: destination.origin + url.pathname, credentialRevision: 1 }, input.apiKey);
        return view(await store.insert(tx, { id, account_id: principal.accountId, name: input.name,
          format: input.format, origin: destination.origin, base_path: url.pathname, model: input.model,
          credential_revision: 1, sealed_key: credential.sealed, key_id: credential.keyId,
          state: 'active', revision: 1, created_at: now, updated_at: now }));
      });
    },
    update(principal: Principal, id: string, input: ConnectionUpdate) {
      return run(principal, async tx => {
        await store.guard(tx, principal.accountId);
        const row = await requireConnection(tx, principal.accountId, id);
        validateInput(input, false);
        let origin = row.origin, path = row.base_path;
        if (input.baseUrl !== undefined) {
          const destination = await validateDestination(input.baseUrl, resolver);
          origin = destination.origin; path = new URL(input.baseUrl).pathname;
        }
        const changedDestination = origin !== row.origin || path !== row.base_path;
        if (changedDestination && input.apiKey === undefined) throw new Error('request_invalid');
        const credentialRevision = input.apiKey === undefined ? revision(row.credential_revision) : increment(row.credential_revision);
        const credential = input.apiKey === undefined ? null : seal(keyRing, {
          accountId: principal.accountId, connectionId: id, destination: origin + path, credentialRevision,
        }, input.apiKey);
        return view(await store.update(tx, principal.accountId, id, {
          name: input.name ?? row.name, format: input.format ?? row.format, origin, base_path: path,
          model: input.model ?? row.model, revision: increment(row.revision), updated_at: clock(),
          credential_revision: credentialRevision,
          ...(credential ? { sealed_key: credential.sealed, key_id: credential.keyId } : {}),
        }));
      });
    },
    remove(principal: Principal, id: string) {
      return run(principal, async tx => {
        await store.guard(tx, principal.accountId);
        const row = await requireConnection(tx, principal.accountId, id);
        if (await store.getDefault(tx, principal.accountId) === id) await store.setDefault(tx, principal.accountId, null);
        await store.update(tx, principal.accountId, id, { state: 'removed', sealed_key: null, key_id: null,
          revision: increment(row.revision), updated_at: clock() });
      });
    },
    getDefault(principal: Principal) {
      return run(principal, async tx => ({ connectionId: await store.getDefault(tx, principal.accountId) }));
    },
    setDefault(principal: Principal, id: string) {
      return run(principal, async tx => {
        await store.guard(tx, principal.accountId);
        await requireConnection(tx, principal.accountId, id);
        await store.setDefault(tx, principal.accountId, id);
        return { connectionId: id };
      });
    },
    // Caller must freshly authorize the principal in this same transaction.
    // Locks serialize default selection/removal/updates without opening a nested
    // identity transaction or decrypting credentials for a metadata-only read.
    async selectForTopic(tx: Tx, accountId: string, connectionId?: string) {
      try {
        await store.guard(tx, accountId);
        const id = connectionId ?? await store.getDefault(tx, accountId);
        if (!id) throw new Error('no_connection');
        return view(await requireConnection(tx, accountId, id));
      } catch (error) { throw refusal(error); }
    },
    // The owning dispatch workflow must freshly authorize its origin principal
    // in this same transaction before resolving this account-scoped revision.
    async resolveForDispatch(tx: Tx, accountId: string, id: string, expectedRevision: number) {
      try {
        const row = await requireConnection(tx, accountId, id);
        if (revision(row.revision) !== expectedRevision) throw new Error('command_conflict');
        const destination = await validateDestination(baseUrl(row), resolver);
        let apiKey: string;
        try { apiKey = open(keyRing, aad(row), row.key_id!, row.sealed_key!); }
        catch { throw new Error('credential_rejected'); }
        return { destination: { ...destination, baseUrl: baseUrl(row) }, model: row.model, apiKey };
      } catch (error) { throw refusal(error); }
    },
  };
}
export type ProviderSettingsService = ReturnType<typeof createProviderSettings>;
