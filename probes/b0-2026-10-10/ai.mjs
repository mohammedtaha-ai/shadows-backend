// NON-PRODUCT. Real SDK and OpenAI adapter; entirely synthetic loopback provider.
import { createServer } from 'node:http';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import assert from 'node:assert/strict';
import { check, save } from './record.mjs';
let mode = 'complete', closed = 0;
const server = createServer(async (req, res) => {
  for await (const _ of req) {};
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const chunk = (delta, finish_reason = null, usage) => res.write(`data: ${JSON.stringify({ id: 'synthetic', object: 'chat.completion.chunk', created: 0, model: 'b0', choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}) })}\n\n`);
  res.on('close', () => closed++);
  if (mode.startsWith('tool')) {
    chunk({ role: 'assistant', tool_calls: [{ index: 0, id: 'call-fixture', type: 'function', function: { name: 'readFixture', arguments: mode === 'tool-valid' ? '{"count":1}' : '{"count":"wrong"}' } }] });
    chunk({}, 'tool_calls'); res.end('data: [DONE]\n\n'); return;
  }
  chunk({ role: 'assistant', content: 'partial' });
  if (mode === 'partial-failure') { setTimeout(() => res.destroy(), 40); return; }
  if (mode === 'cancel') { const interval = setInterval(() => chunk({ content: '-more' }), 30); res.on('close', () => clearInterval(interval)); return; }
  chunk({ content: '-complete' }); chunk({}, 'stop', { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 }); res.end('data: [DONE]\n\n');
});
await new Promise(r => server.listen(45873, '127.0.0.1', r));
const model = createOpenAI({ apiKey: 'synthetic-not-a-credential', baseURL: 'http://127.0.0.1:45873/v1' }).chat('b0-fixture');
try {
await check('synthetic provider completion usage', async () => {
  mode = 'complete'; const result = streamText({ model, prompt: 'synthetic', maxRetries: 0 }); const parts = []; for await (const part of result.fullStream) parts.push(part);
  assert.equal(await result.text, 'partial-complete'); assert.equal(await result.finishReason, 'stop'); const usage = await result.usage; assert.equal(usage.totalTokens, 5);
  return { text: await result.text, finishReason: await result.finishReason, totalTokens: usage.totalTokens };
});
await check('synthetic partial transport failure preserves text and explicit error', async () => {
  mode = 'partial-failure'; const result = streamText({ model, prompt: 'synthetic', maxRetries: 0, onError: () => {} }); const parts = []; let thrownType;
  try { for await (const part of result.fullStream) parts.push(part); } catch (e) { thrownType = e.name; }
  assert.ok(parts.some(x => x.type === 'text-delta' && x.text === 'partial')); assert.ok(thrownType || parts.some(x => x.type === 'error'));
  return { partialText: 'partial', errorParts: parts.filter(x => x.type === 'error').length, thrownType: thrownType ?? null };
});
await check('synthetic explicit cancellation propagates to provider socket', async () => {
  mode = 'cancel'; const before = closed; const controller = new AbortController(); const parts = [];
  const result = streamText({ model, prompt: 'synthetic', abortSignal: controller.signal, maxRetries: 0, onError: () => {} });
  for await (const part of result.fullStream) { parts.push(part); if (part.type === 'text-delta') controller.abort(); }
  await new Promise(r => setTimeout(r, 100)); assert.ok(closed > before); assert.ok(parts.some(x => x.type === 'abort'));
  return { preservedChunks: parts.filter(x => x.type === 'text-delta').length, abortParts: parts.filter(x => x.type === 'abort').length, socketClosed: true };
});
for (const valid of [true, false]) await check(`synthetic tool input ${valid ? 'valid execution' : 'invalid refusal'}`, async () => {
  mode = valid ? 'tool-valid' : 'tool-invalid'; let executions = 0;
  const result = streamText({ model, prompt: 'synthetic', maxRetries: 0, onError: () => {}, tools: { readFixture: tool({ inputSchema: z.object({ count: z.number().int().positive() }), execute: async ({ count }) => { executions++; return { count }; } }) } });
  const parts = []; for await (const part of result.fullStream) parts.push(part);
  assert.equal(executions, valid ? 1 : 0); assert.ok(parts.some(x => x.type === (valid ? 'tool-result' : 'tool-error')));
  return { executions, resultPart: valid ? 'tool-result' : 'tool-error' };
});
} finally { await new Promise(r => server.close(r)); await save('ai-synthetic-results'); }
