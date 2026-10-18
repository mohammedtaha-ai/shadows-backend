import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { identityFixture } from './fixtures/identity.js';
import { createProviderSettings } from '../../src/modules/provider-settings/index.js';

const input = { name: 'Synthetic provider', format: 'openai_compatible' as const,
  baseUrl: 'https://provider.example/v1', model: 'synthetic-model', apiKey: 'synthetic-provider-key' };
async function fixture() {
  const f = await identityFixture();
  let addresses = [{ address: '93.184.216.34', family: 4 }];
  const service = createProviderSettings(f.db, f.identity,
    { activeKeyId: 'synthetic-byok', keys: new Map([['synthetic-byok', randomBytes(32)]]) },
    async () => addresses, () => f.now);
  const person = await f.login();
  return { ...f, service, person, unsafeDns() { addresses = [{ address: '10.0.0.1', family: 4 }]; } };
}

test('provider_settings_owns_encrypted_credentials_and_isolates_accounts_and_defaults', async () => {
  const f = await fixture();
  try {
    const { principal } = f.person;
    assert.deepEqual(await f.service.getDefault(principal), { connectionId: null });
    const connection = await f.service.create(principal, input);
    assert.equal(connection.keyConfigured, true);
    assert.equal(connection.revision, 1);
    assert.ok(!JSON.stringify(connection).includes('apiKey'));
    const stored = (await f.pool.query('SELECT * FROM provider_settings_connections')).rows[0];
    assert.ok(!JSON.stringify(stored).includes(input.apiKey));
    assert.ok(stored.sealed_key && stored.key_id);
    assert.deepEqual(await f.service.setDefault(principal, connection.connectionId), { connectionId: connection.connectionId });
    const list = await f.service.list(principal);
    assert.deepEqual(list.connections, [connection]);
    assert.ok(!JSON.stringify(list).includes('sealed'));
    f.setSubject('synthetic-other');
    const other = await f.login();
    assert.deepEqual(await f.service.list(other.principal), { connections: [] });
    assert.deepEqual(await f.service.getDefault(other.principal), { connectionId: null });
    await assert.rejects(f.service.update(other.principal, connection.connectionId, { name: 'Taken' }), { message: 'not_found' });
    await assert.rejects(f.service.remove(other.principal, connection.connectionId), { message: 'not_found' });
    await assert.rejects(f.service.setDefault(other.principal, connection.connectionId), { message: 'not_found' });
    await assert.rejects(f.db.transaction().execute(tx => f.service.resolveForDispatch(tx, other.principal.accountId, connection.connectionId, 1)), { message: 'not_found' });
    const resolved = await f.db.transaction().execute(async tx => {
      await f.identity.authorizeTransaction(tx, principal);
      return f.service.resolveForDispatch(tx, principal.accountId, connection.connectionId, 1);
    });
    assert.equal(resolved.apiKey, input.apiKey);
    assert.equal(resolved.model, input.model);
    assert.equal(resolved.destination.baseUrl, input.baseUrl);
    assert.deepEqual(resolved.destination.addresses, [{ address: '93.184.216.34', family: 4 }]);
    const otherConnection = await f.service.create(other.principal, input);
    await f.service.setDefault(other.principal, otherConnection.connectionId);
    assert.deepEqual(await f.service.getDefault(principal), { connectionId: connection.connectionId });
    await f.identity.logout(f.person.principal);
    await assert.rejects(f.service.list(principal), { message: 'unauthorized' });
  } finally { await f.close(); }
});

test('provider_settings_serializes_limits_and_unique_names_per_account', async () => {
  const f = await fixture();
  try {
    const principal = f.person.principal;
    const same = await Promise.allSettled([f.service.create(principal, input), f.service.create(principal, input)]);
    assert.equal(same.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((same.find(result => result.status === 'rejected') as PromiseRejectedResult).reason.message, 'command_conflict');
    for (let i = 1; i < 19; i++) await f.service.create(principal, { ...input, name: `Synthetic ${i}` });
    const last = await Promise.allSettled([
      f.service.create(principal, { ...input, name: 'Last A' }), f.service.create(principal, { ...input, name: 'Last B' }),
    ]);
    assert.equal(last.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((last.find(result => result.status === 'rejected') as PromiseRejectedResult).reason.message, 'rate_limited');
    assert.equal((await f.service.list(principal)).connections.length, 20);
    const first = (await f.service.list(principal)).connections[0]!;
    await f.service.remove(principal, first.connectionId);
    await f.service.create(principal, { ...input, name: first.name });
    assert.equal((await f.service.list(principal)).connections.length, 20);
  } finally { await f.close(); }
});

test('provider_settings_destination_changes_require_new_keys_and_fence_old_revisions', async () => {
  const f = await fixture();
  try {
    const principal = f.person.principal, connection = await f.service.create(principal, input);
    const resolve = (revision: number) => f.db.transaction().execute(tx =>
      f.service.resolveForDispatch(tx, principal.accountId, connection.connectionId, revision));
    for (const baseUrl of ['https://new.example/v1', 'https://provider.example/v2'])
      await assert.rejects(f.service.update(principal, connection.connectionId, { baseUrl }), { message: 'request_invalid' });
    assert.equal((await resolve(1)).apiKey, input.apiKey);
    const changed = await f.service.update(principal, connection.connectionId,
      { baseUrl: 'https://new.example/v2', apiKey: 'synthetic-new-key', model: 'synthetic-new-model' });
    assert.equal(changed.revision, 2);
    await assert.rejects(resolve(1), { message: 'command_conflict' });
    assert.equal((await resolve(2)).apiKey, 'synthetic-new-key');
    const stored = (await f.pool.query('SELECT credential_revision FROM provider_settings_connections')).rows[0];
    assert.equal(Number(stored.credential_revision), 2);
    const renamed = await f.service.update(principal, connection.connectionId, { name: 'Renamed' });
    assert.equal(renamed.revision, 3);
    assert.equal((await resolve(3)).apiKey, 'synthetic-new-key');
    f.unsafeDns();
    await assert.rejects(resolve(3), { message: 'destination_refused' });
  } finally { await f.close(); }
});

test('provider_settings_remove_blocks_use_clears_default_and_purges_ciphertext', async () => {
  const f = await fixture();
  try {
    const principal = f.person.principal, connection = await f.service.create(principal, input);
    await f.service.setDefault(principal, connection.connectionId);
    await f.service.remove(principal, connection.connectionId);
    assert.deepEqual(await f.service.getDefault(principal), { connectionId: null });
    assert.deepEqual(await f.service.list(principal), { connections: [] });
    await assert.rejects(f.db.transaction().execute(tx => f.service.resolveForDispatch(tx, principal.accountId, connection.connectionId, 1)), { message: 'not_found' });
    const row = (await f.pool.query('SELECT state,sealed_key,key_id FROM provider_settings_connections')).rows[0];
    assert.deepEqual(row, { state: 'removed', sealed_key: null, key_id: null });
  } finally { await f.close(); }
});

test('provider_settings_tampered_credentials_refuse_without_destroying_stored_evidence', async () => {
  const f = await fixture();
  try {
    const principal = f.person.principal, connection = await f.service.create(principal, input);
    const tampered = Buffer.alloc(48, 1).toString('base64url');
    await f.pool.query('UPDATE provider_settings_connections SET sealed_key=$1 WHERE id=$2', [tampered, connection.connectionId]);
    await assert.rejects(f.db.transaction().execute(tx => f.service.resolveForDispatch(tx, principal.accountId, connection.connectionId, 1)), { message: 'credential_rejected' });
    assert.equal((await f.pool.query('SELECT sealed_key FROM provider_settings_connections')).rows[0].sealed_key, tampered);
    await assert.rejects(f.service.update(principal, connection.connectionId, { baseUrl: 'https://new.example/v1' }), { message: 'request_invalid' });
    const fixed = await f.service.update(principal, connection.connectionId, { apiKey: 'synthetic-repaired-key' });
    assert.equal(fixed.revision, 2);
    const repaired = await f.db.transaction().execute(tx => f.service.resolveForDispatch(tx, principal.accountId, connection.connectionId, 2));
    assert.equal(repaired.apiKey, 'synthetic-repaired-key');
  } finally { await f.close(); }
});
