import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { runConversation } from './conversation.mjs';
import { createFixtureFetch } from './provider-fixture.mjs';

test('provider fixture goes through AI SDK and reads the owner before replying', async () => {
  const selectedId = '11111111-1111-4111-8111-111111111111';
  let ownerReads = 0;
  const owner = createServer((_request, response) => {
    ownerReads++;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify([{ id: selectedId, name: 'Synthetic Lighthouse', slug: 'lighthouse' }]));
  });
  await new Promise(resolve => owner.listen(0, '127.0.0.1', resolve));
  const originalKey = process.env.MINIMAX_API_KEY;
  process.env.MINIMAX_API_KEY = 'synthetic-test-key';
  try {
    const events = [];
    const result = await runConversation({ message: 'Name the selected project', selectedId,
      shadowsUrl: `http://127.0.0.1:${owner.address().port}`, signal: AbortSignal.timeout(5000),
      send: (event, data) => events.push({ event, data }), providerFetch: createFixtureFetch(selectedId) });
    assert.equal(ownerReads, 1);
    assert.equal(result.toolExecutions, 1);
    assert.equal(result.steps, 2);
    assert.equal(events.filter(event => event.event === 'delta').map(event => event.data.text).join(''), 'Synthetic Lighthouse');
    assert.equal(events.at(-1).event, 'done');
  } finally {
    owner.close();
    if (originalKey === undefined) delete process.env.MINIMAX_API_KEY;
    else process.env.MINIMAX_API_KEY = originalKey;
  }
});

test('provider rejection is terminal and never printed as a raw SDK error', async () => {
  const originalKey = process.env.MINIMAX_API_KEY;
  process.env.MINIMAX_API_KEY = 'synthetic-test-key';
  const originalError = console.error;
  const printed = [];
  console.error = (...args) => printed.push(args);
  try {
    const events = [];
    await assert.rejects(runConversation({ message: 'synthetic prompt',
      selectedId: '11111111-1111-4111-8111-111111111111', shadowsUrl: 'http://127.0.0.1:4318',
      signal: AbortSignal.timeout(5000), send: event => events.push(event),
      providerFetch: async () => new Response(JSON.stringify({ error: { message: 'synthetic quota failure', type: 'insufficient_balance_error' } }), {
        status: 429, headers: { 'content-type': 'application/json' },
      }) }), /provider_flow_failed/);
    assert.equal(events.includes('done'), false);
    assert.equal(printed.length, 0);
  } finally {
    console.error = originalError;
    if (originalKey === undefined) delete process.env.MINIMAX_API_KEY;
    else process.env.MINIMAX_API_KEY = originalKey;
  }
});
