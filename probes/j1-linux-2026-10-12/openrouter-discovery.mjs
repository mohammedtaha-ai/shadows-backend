// Read the temporary key from non-echoing stdin; never write it to disk or logs.
import { createInterface } from 'node:readline';
import { classifyRouterFailure } from './provider-failure.mjs';

const lines = createInterface({ input: process.stdin, terminal: false });
const key = await new Promise(resolve => lines.once('line', resolve));
lines.close();
process.stdin.pause();
if (!key || typeof key !== 'string') throw new Error('temporary_key_missing');
const headers = { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
async function request(path, init = {}) {
  const response = await fetch(`https://openrouter.ai/api/v1/${path}`, {
    ...init, headers, redirect: 'error', signal: AbortSignal.timeout(30000),
  });
  let body;
  try { body = await response.json(); } catch { body = { probe_invalid_json: true }; }
  return { response, body };
}
try {
  const account = await request('key');
  console.log(JSON.stringify({ event: 'key-check', status: account.response.status,
    freeTier: account.body.data?.is_free_tier,
    remainingCredits: account.body.data?.limit_remaining,
    contentType: account.response.headers.get('content-type'),
    reason: account.body.probe_invalid_json ? 'unexpected_non_json_response' : account.response.ok && account.body.data ? 'authenticated' : classifyRouterFailure(account.response.status, account.body.error) }));
  if (!account.response.ok || account.body.probe_invalid_json || !account.body.data) process.exit(1);
  const catalog = await request('models');
  const free = (catalog.body.data ?? []).filter(model => model.id.endsWith(':free') &&
    Number(model.pricing?.prompt) === 0 && Number(model.pricing?.completion) === 0);
  const score = model => ['qwen', 'nvidia', 'stepfun', 'meta-llama', 'arcee'].findIndex(prefix => model.id.startsWith(prefix));
  free.sort((a,b) => (score(a) < 0 ? 100 : score(a)) - (score(b) < 0 ? 100 : score(b)));
  console.log(JSON.stringify({ event: 'free-catalog', count: free.length,
    candidates: free.slice(0,8).map(model => ({ id: model.id, tools: model.supported_parameters?.includes('tools') ?? false })) }));
  let attempts = 0;
  for (const model of free.filter(model => model.supported_parameters?.includes('tools')).slice(0,3)) {
    attempts++;
    const started = Date.now();
    try {
      const {response, body} = await request('chat/completions', { method: 'POST', body: JSON.stringify({
        model: model.id, max_tokens: 256, reasoning: { enabled: false },
        messages: [{ role: 'user', content: 'Synthetic transport test. Reply with exactly synthetic-probe-ok.' }],
      }) });
      const choice = body.choices?.[0];
      const text = choice?.message?.content;
      const errorCode = typeof body.error?.code === 'number' ? body.error.code : undefined;
      console.log(JSON.stringify({ event: 'model-check', requestedModel: model.id,
        status: response.status, completed: response.ok && !body.error && typeof text === 'string' && text.length > 0,
        hasExpectedMarker: typeof text === 'string' && text.includes('synthetic-probe-ok'),
        observedModel: body.model, finishReason: choice?.finish_reason,
        reason: body.error ? classifyRouterFailure(errorCode ?? response.status, body.error) : response.ok ? (text ? 'response_received' : 'empty_content_not_quota_evidence') : classifyRouterFailure(response.status),
        errorCode, provider: body.error?.metadata?.provider_name,
        cost: typeof body.usage?.cost === 'number' ? body.usage.cost : undefined,
        retryAfter: response.headers.get('retry-after'), elapsedMs: Date.now()-started }));
    } catch (error) {
      console.log(JSON.stringify({ event: 'model-check', requestedModel: model.id,
        completed: false, reason: error.name === 'TimeoutError' ? 'network_or_provider_timeout' : 'network_or_decode_failure', elapsedMs: Date.now()-started }));
    }
  }
  if (!attempts) console.log(JSON.stringify({ event: 'no_free_tool_models' }));
} catch (error) {
  console.log(JSON.stringify({ event: 'discovery-failed', reason: error.name === 'TimeoutError' ? 'network_timeout' : 'network_or_decode_failure', errorType: error.name, networkCode: error.code ?? error.cause?.code }));
  process.exitCode = 1;
}
