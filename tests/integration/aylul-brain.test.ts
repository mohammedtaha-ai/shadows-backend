import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APICallError } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import { replyStream } from 'aylul-brain';
import { NYLRA_INSTRUCTIONS } from '../../packages/aylul-brain/src/instructions.js';

async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const parts: T[] = []; for await (const part of stream) parts.push(part); return parts;
}

function model(finish: 'stop' | 'length' = 'stop') {
  return new MockLanguageModelV3({ doStream: async () => ({
    stream: new ReadableStream({ start(controller) {
      controller.enqueue({ type: 'text-start', id: 'text' });
      controller.enqueue({ type: 'text-delta', id: 'text', delta: 'Hello' });
      controller.enqueue({ type: 'text-delta', id: 'text', delta: ' world' });
      controller.enqueue({ type: 'text-end', id: 'text' });
      controller.enqueue({ type: 'finish', finishReason: { unified: finish, raw: finish },
        usage: { inputTokens: { total: 3, noCache: 3, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 2, text: 2, reasoning: 0 } } });
      controller.close();
    } }),
  }) });
}

test('brain_sends_instructions_then_ordered_history_and_new_message_with_bounded_output', async () => {
  const fake = model();
  const parts = await collect(replyStream({ model: fake, history: [
    { role: 'user', content: 'First' }, { role: 'assistant', content: 'Second' },
  ], message: 'Third', maxOutputTokens: 100 }));
  assert.deepEqual(parts, ['Hello', ' world', { finish: 'done' }]);
  const call = fake.doStreamCalls[0]!;
  assert.deepEqual(call.prompt.map(({ role, content }) => ({ role, content })), [
    { role: 'system', content: NYLRA_INSTRUCTIONS },
    { role: 'user', content: [{ type: 'text', text: 'First' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'Second' }] },
    { role: 'user', content: [{ type: 'text', text: 'Third' }] },
  ]);
  assert.equal(call.maxOutputTokens, 100);
  assert.ok(!call.tools?.length);
  await collect(replyStream({ model: fake, history: [], message: 'Bound', maxOutputTokens: 9000 }));
  assert.equal(fake.doStreamCalls[1]!.maxOutputTokens, 4096);
});

test('brain_reports_length_finish', async () => {
  assert.deepEqual(await collect(replyStream({ model: model('length'), history: [], message: 'Synthetic' })),
    ['Hello', ' world', { finish: 'length' }]);
});

test('brain_abort_ends_active_stream_and_preaborted_calls_do_not_dispatch', async () => {
  const abort = new AbortController();
  const fake = new MockLanguageModelV3({ doStream: async () => ({
    stream: new ReadableStream({ start(c) {
      c.enqueue({ type: 'text-start', id: 'text' });
      c.enqueue({ type: 'text-delta', id: 'text', delta: 'First' });
    } }),
  }) });
  const parts = [];
  for await (const part of replyStream({ model: fake, history: [], message: 'Synthetic', signal: abort.signal })) {
    parts.push(part);
    if (typeof part === 'string') abort.abort();
  }
  assert.deepEqual(parts, ['First', { finish: 'error' }]);
  assert.ok(fake.doStreamCalls[0]!.abortSignal?.aborted);
  assert.deepEqual(await collect(replyStream({ model: fake, history: [], message: 'Synthetic', signal: abort.signal })), [{ finish: 'error' }]);
  assert.equal(fake.doStreamCalls.length, 1);
});

test('brain_provider_failure_is_terminal_safe_and_never_retried', async () => {
  const fake = new MockLanguageModelV3({ doStream: async () => { throw new APICallError({
    message: 'private-provider-body', url: 'https://synthetic.invalid', requestBodyValues: {},
    statusCode: 503, isRetryable: true,
  }); } });
  assert.deepEqual(await collect(replyStream({ model: fake, history: [], message: 'Synthetic' })), [{ finish: 'error' }]);
  assert.equal(fake.doStreamCalls.length, 1);
});

test('brain_refuses_invalid_token_limits_before_dispatch', async () => {
  const fake = model();
  for (const maxOutputTokens of [0, -1, 1.5, Infinity, NaN]) {
    assert.deepEqual(await collect(replyStream({ model: fake, history: [], message: 'Synthetic', maxOutputTokens })), [{ finish: 'error' }]);
  }
  assert.equal(fake.doStreamCalls.length, 0);
});
