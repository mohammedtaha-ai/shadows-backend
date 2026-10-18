import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { seal, open, type CredentialAad, type KeyRing } from '../../src/modules/provider-settings/credential-seal.js';

const aad: CredentialAad = {
  accountId: 'synthetic-account', connectionId: 'synthetic-connection',
  destination: 'https://provider.example/v1', credentialRevision: 1,
};
const ring = (): KeyRing => ({ activeKeyId: 'synthetic-current', keys: new Map([['synthetic-current', randomBytes(32)]]) });

test('credential_seal_round_trip_uses_fresh_nonce_and_active_key', () => {
  const keyRing = ring();
  const first = seal(keyRing, aad, 'synthetic-provider-key');
  const second = seal(keyRing, aad, 'synthetic-provider-key');
  assert.equal(first.keyId, keyRing.activeKeyId);
  assert.equal(open(keyRing, aad, first.keyId, first.sealed), 'synthetic-provider-key');
  assert.notEqual(first.sealed, second.sealed);
  const packed = Buffer.from(first.sealed, 'base64url');
  assert.equal(packed.length, 12 + 16 + Buffer.byteLength('synthetic-provider-key'));
  assert.notDeepEqual(packed.subarray(0, 12), Buffer.from(second.sealed, 'base64url').subarray(0, 12));
});

test('credential_seal_binds_every_aad_field_and_unambiguous_field_boundaries', () => {
  const keyRing = ring(), value = seal(keyRing, aad, 'synthetic-provider-key');
  for (const changed of [
    { ...aad, accountId: 'another-account' }, { ...aad, connectionId: 'another-connection' },
    { ...aad, destination: 'https://another.example/v1' }, { ...aad, credentialRevision: 2 },
  ]) assert.throws(() => open(keyRing, changed, value.keyId, value.sealed), { message: 'credential_refused' });
  const boundary = seal(keyRing, { ...aad, accountId: 'a|b', connectionId: 'c' }, 'synthetic-provider-key');
  assert.throws(() => open(keyRing, { ...aad, accountId: 'a', connectionId: 'b|c' }, boundary.keyId, boundary.sealed),
    { message: 'credential_refused' });
});

test('credential_seal_refuses_tampering_unknown_keys_and_malformed_ciphertext', () => {
  const keyRing = ring(), value = seal(keyRing, aad, 'synthetic-provider-key');
  for (const offset of [0, 12, 28]) {
    const changed = Buffer.from(value.sealed, 'base64url');
    changed[offset] = changed[offset]! ^ 1;
    assert.throws(() => open(keyRing, aad, value.keyId, changed.toString('base64url')), { message: 'credential_refused' });
  }
  for (const sealed of ['', 'not base64url!', value.sealed + '=', Buffer.alloc(27).toString('base64url')])
    assert.throws(() => open(keyRing, aad, value.keyId, sealed), { message: 'credential_refused' });
  assert.throws(() => open(keyRing, aad, 'unknown', value.sealed), { message: 'credential_refused' });
  const alias = { ...keyRing, keys: new Map([...keyRing.keys, ['alias', keyRing.keys.get(value.keyId)!]]) };
  assert.throws(() => open(alias, aad, 'alias', value.sealed), { message: 'credential_refused' });
  const wrongKey = { ...keyRing, keys: new Map([[value.keyId, randomBytes(32)]]) };
  assert.throws(() => open(wrongKey, aad, value.keyId, value.sealed), { message: 'credential_refused' });
});

test('credential_seal_rotation_reads_retained_previous_keys_and_writes_only_active_key', () => {
  const oldRing = ring(), value = seal(oldRing, aad, 'synthetic-provider-key');
  const rotated: KeyRing = { activeKeyId: 'synthetic-next', keys: new Map([
    ...oldRing.keys, ['synthetic-next', randomBytes(32)],
  ]) };
  assert.equal(open(rotated, aad, value.keyId, value.sealed), 'synthetic-provider-key');
  const next = seal(rotated, aad, 'synthetic-replacement-key');
  assert.equal(next.keyId, rotated.activeKeyId);
  assert.equal(open(rotated, aad, next.keyId, next.sealed), 'synthetic-replacement-key');
  assert.throws(() => open(rotated, aad, rotated.activeKeyId, value.sealed), { message: 'credential_refused' });
  assert.throws(() => open(oldRing, aad, next.keyId, next.sealed), { message: 'credential_refused' });
});

test('credential_seal_invalid_inputs_fail_with_a_fixed_safe_error', () => {
  for (const keyRing of [
    { activeKeyId: 'missing', keys: new Map() },
    { activeKeyId: 'invalid:id', keys: new Map([['invalid:id', randomBytes(32)]]) },
    { activeKeyId: 'short', keys: new Map([['short', randomBytes(31)]]) },
  ]) assert.throws(() => seal(keyRing, aad, 'synthetic-provider-key'), { message: 'credential_refused' });
  assert.throws(() => seal(ring(), { ...aad, credentialRevision: 0 }, 'synthetic-provider-key'), { message: 'credential_refused' });
});
