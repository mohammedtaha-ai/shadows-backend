// Configuration-only tests. No SDK, provider call, repository .env or real credential.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureApiKey } from './runtime-api-key.mjs';

test('runtime API_KEY skips local loading, including a synthetic proxy placeholder', () => {
  ensureApiKey({ env: { API_KEY: 'synthetic-placeholder' }, loadLocal: () => assert.fail('local loader invoked') });
});
test('optional local loading preserves legacy configuration', () => {
  const env = {};
  ensureApiKey({ env, loadLocal: () => { env.API_KEY = 'synthetic-local'; } });
});
test('missing or failed local configuration produces only a sanitized refusal', () => {
  assert.throws(() => ensureApiKey({ env: {}, loadLocal: () => { throw new Error('synthetic-private-detail'); } }), /^Error: B0 API_KEY unavailable \(details withheld\)$/);
  assert.throws(() => ensureApiKey({ env: {}, loadLocal: () => {} }), /^Error: B0 API_KEY unavailable \(details withheld\)$/);
});
