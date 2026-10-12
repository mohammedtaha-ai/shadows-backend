import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMinimaxFetch, forwardProbePart } from './conversation.mjs';

test('MiniMax adapter fixes endpoint and disables reasoning for this probe', async () => {
  let sent;
  const fetcher = async (_url, init) => { sent = JSON.parse(init.body); return new Response('{}'); };
  const call = boundedMinimaxFetch(fetcher);
  await call('https://api.minimax.io/v1/chat/completions', {
    body: JSON.stringify({ model: 'MiniMax-M3', messages: [{role:'user',content:'fixture'}], max_tokens: 1000 }),
  });
  assert.deepEqual(sent.thinking, { type: 'disabled' });
  assert.equal(sent.max_completion_tokens, 256);
  assert.equal('max_tokens' in sent, false);
  await assert.rejects(call('https://example.com/v1/chat/completions', { body:'{}' }), /provider_endpoint_refused/);
});

test('an owner tool error cannot become a completed answer', () => {
  const sent = [];
  assert.throws(() => forwardProbePart({ type: 'tool-error' }, (event, payload) => sent.push([event, payload])), /owner_or_tool_failed/);
  assert.deepEqual(sent, []);
});
