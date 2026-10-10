// NON-PRODUCT: explicit opt-in real MiniMax probe. Never serialize SDK errors.
import { loadEnvFile } from 'node:process';
import { writeFile } from 'node:fs/promises';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

loadEnvFile(new URL('../../.env', import.meta.url));
if (!process.env.API_KEY) throw new Error('Missing API_KEY');
const results = [];
const endpoint = 'https://api.minimax.io/v1';
const modelId = 'MiniMax-M3';
let mode, sawText, injected, cancelled;
const safeFetch = async (url, init) => {
  if (new URL(url).origin !== 'https://api.minimax.io') throw new Error('Host refused');
  const body = JSON.parse(init.body);
  body.thinking = { type: 'disabled' };
  const response = await fetch(url, { ...init, body: JSON.stringify(body), redirect: 'error' });
  if (mode !== 'cut' || !response.ok || !response.body) return response;
  const reader = response.body.getReader();
  return new Response(new ReadableStream({
    async pull(controller) {
      if (sawText) {
        injected = true;
        await reader.cancel();
        controller.error(new Error('B0 injected client transport cut'));
        return;
      }
      const next = await reader.read();
      if (next.done) controller.close(); else controller.enqueue(next.value);
    },
    async cancel() { await reader.cancel(); },
  }), { status: response.status, headers: response.headers });
};
const model = createOpenAI({ apiKey: process.env.API_KEY, baseURL: endpoint, fetch: safeFetch }).chat(modelId);
for (const name of ['complete', 'cancel', 'cut', 'tool']) {
  mode = name; sawText = false; injected = false; cancelled = false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  const counts = {}; let chars = 0, executions = 0, validTool = false;
  let thrown = false, httpStatus = null, finishReason = null, usage = null;
  const started = Date.now();
  const onError = ({ error }) => { if (Number.isInteger(error?.statusCode)) httpStatus = error.statusCode; };
  try {
    const result = streamText({
      model, maxRetries: 0, maxOutputTokens: 512, abortSignal: controller.signal, onError,
      prompt: name === 'complete' ? 'Reply with exactly B0_OK.' : name === 'tool'
        ? 'Call readFixture with count 1. Do not perform any other action.'
        : 'Write a numbered list of 100 short color names. Start immediately.',
      ...(name === 'tool' ? {
        toolChoice: 'required',
        tools: { readFixture: tool({
          description: 'Read a synthetic integer fixture; no external side effects.',
          inputSchema: z.object({ count: z.number().int().min(1).max(1) }),
          execute: async ({ count }) => { executions++; validTool = count === 1; return { count }; },
        }) },
      } : {}),
    });
    for await (const part of result.fullStream) {
      counts[part.type] = (counts[part.type] || 0) + 1;
      if (part.type === 'text-delta' && part.text.length) {
        chars += part.text.length; sawText = true;
        if (name === 'cancel' && !cancelled) { cancelled = true; controller.abort(); }
      }
      if (part.type === 'error') onError(part);
    }
    finishReason = await result.finishReason;
    const u = await result.usage;
    usage = { inputTokens: u.inputTokens ?? null, outputTokens: u.outputTokens ?? null, totalTokens: u.totalTokens ?? null };
  } catch { thrown = true; }
  finally { clearTimeout(timer); }
  const failed = !!counts.error || thrown;
  const pass = name === 'complete' ? chars > 0 && finishReason === 'stop' && !failed
    : name === 'cancel' ? cancelled && chars > 0 && !!counts.abort
    : name === 'cut' ? injected && chars > 0 && failed
    : executions === 1 && validTool && !!counts['tool-result'] && !failed;
  const record = { name, pass, elapsedMs: Date.now() - started, counts, chars, executions,
    validTool, injected, cancelled, thrown, httpStatus, finishReason, usage };
  results.push(record);
  console.log(JSON.stringify(record));
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) break;
}
const report = { date: '2026-10-11', endpoint, requestedModel: modelId,
  limitations: ['No raw text, tokens, headers or SDK errors retained.',
    'Cut is locally injected into a real response, not a provider incident.',
    'Client cancellation does not prove provider computation or billing stopped.',
    'One-step tool execution only; multi-turn reasoning continuity not proven.'], results };
await writeFile(new URL('artifacts/ai-minimax-results.json', import.meta.url), JSON.stringify(report, null, 2));
process.exitCode = results.length === 4 && results.every(x => x.pass) ? 0 : 1;
