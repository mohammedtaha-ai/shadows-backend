import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streamText } from 'ai';
import { createOpenAICompatibleModel, PROVIDER_DEADLINES } from '../../src/integrations/providers/openai-compatible.js';
import { fakeProvider, type FakeProviderMode } from './fixtures/fake-provider.js';

const connection = (f: Awaited<ReturnType<typeof fakeProvider>>) => ({
  destination: f.destination, model: 'synthetic-model', apiKey: 'synthetic-provider-key',
});
async function collect(client: ReturnType<typeof createOpenAICompatibleModel>, signal?: AbortSignal) {
  const errors: unknown[] = [];
  const result = streamText({ ...client, prompt: 'Synthetic test message', abortSignal: signal,
    onError: ({ error }) => { errors.push(error); } });
  let text = '';
  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') text += part.text;
    if (part.type === 'error') throw part.error;
  }
  if (errors.length) throw errors[0];
  return text;
}

test('provider_adapter_streams_text_over_verified_pinned_https_with_zero_retries', async () => {
  const f = await fakeProvider();
  try {
    const client = createOpenAICompatibleModel(connection(f));
    assert.equal(client.maxRetries, 0);
    assert.deepEqual(PROVIDER_DEADLINES, { connectMs: 5000, idleMs: 30000, totalMs: 120000 });
    assert.equal(await collect(client), 'Hello world');
    assert.equal(f.requests, 1);
    assert.equal(f.lastPath, '/v1/chat/completions');
    assert.equal(f.lastHost, new URL(f.baseUrl).host);
  } finally { await f.close(); }
});

test('provider_adapter_maps_http_failures_to_safe_nonretryable_categories', async () => {
  for (const [status, code] of [[401, 'credential_rejected'], [403, 'credential_rejected'], [404, 'model_unavailable'], [429, 'quota'], [500, 'network']] as const) {
    const f = await fakeProvider({ mode: 'error', status });
    try {
      const client = createOpenAICompatibleModel(connection(f));
      await assert.rejects(collect(client), error => {
        assert.ok(error instanceof Error); assert.equal(error.message, code);
        assert.ok(!JSON.stringify(error, Object.getOwnPropertyNames(error)).includes('synthetic-provider-key'));
        assert.ok(!('cause' in error)); return true;
      });
      assert.equal(f.requests, 1);
      // Even a caller using the SDK's default retry setting cannot repeat a paid call.
      const defaults = streamText({ model: client.model, prompt: 'Synthetic', onError() {} });
      for await (const _part of defaults.fullStream) { /* drain safe failure */ }
      assert.equal(f.requests, 2);
    } finally { await f.close(); }
  }
});

test('provider_adapter_refuses_redirects_and_invalid_tls_hostnames_without_following_dns', async () => {
  const f = await fakeProvider({ mode: 'redirect' });
  try {
    await assert.rejects(collect(createOpenAICompatibleModel(connection(f))), { message: 'destination_refused' });
    assert.equal(f.requests, 1);
    const alternate = { ...connection(f), destination: { ...f.destination,
      origin: `https://must-not-resolve.example:${f.destination.port}`, host: 'must-not-resolve.example',
      baseUrl: `https://must-not-resolve.example:${f.destination.port}/v1` } };
    await assert.rejects(collect(createOpenAICompatibleModel(alternate)), { message: 'network' });
    assert.equal(f.requests, 1, 'TLS hostname refusal occurs before any HTTP request');
    assert.equal(f.connections, 2, 'unresolvable hostname was reached only through its pinned address');
  } finally { await f.close(); }
});

test('provider_adapter_enforces_connect_idle_and_total_deadlines', async () => {
  for (const mode of ['connect-stall', 'stall', 'forever'] as const satisfies readonly FakeProviderMode[]) {
    const f = await fakeProvider({ mode, delayMs: 10 });
    try {
      const client = createOpenAICompatibleModel(connection(f), {
        deadlines: mode === 'connect-stall' ? { connectMs: 100 } : mode === 'stall' ? { idleMs: 100 } : { totalMs: 180 },
      });
      await assert.rejects(collect(client), { message: 'network' });
      assert.equal(f.requests, mode === 'connect-stall' ? 0 : 1);
    } finally { await f.close(); }
  }
});

test('provider_adapter_abort_closes_the_owned_request_without_retry', async () => {
  const f = await fakeProvider({ mode: 'forever' });
  try {
    const controller = new AbortController();
    const result = streamText({ ...createOpenAICompatibleModel(connection(f)), prompt: 'Synthetic',
      abortSignal: controller.signal, onError() {} });
    for await (const delta of result.textStream) { assert.equal(delta, 'x'); controller.abort(); break; }
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(f.requests, 1);
    assert.ok(f.closed >= 1);
  } finally { await f.close(); }
});

test('provider_adapter_sanitizes_malformed_stream_errors_and_does_not_reresolve_pinned_addresses', async () => {
  const f = await fakeProvider({ mode: 'malformed' });
  try {
    await assert.rejects(collect(createOpenAICompatibleModel(connection(f))), { message: 'network' });
    assert.equal(f.requests, 1);
    const unavailable = { ...connection(f), destination: { ...f.destination, addresses: [{ address: '127.0.0.2', family: 4 as const }] } };
    await assert.rejects(collect(createOpenAICompatibleModel(unavailable)), { message: 'network' });
    assert.equal(f.requests, 1, 'pinned failure must never fall back to URL hostname');
  } finally { await f.close(); }
});
