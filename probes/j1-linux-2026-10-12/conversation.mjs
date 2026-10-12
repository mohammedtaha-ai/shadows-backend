// Disposable SDK probe. Model text is streamed to the client and never persisted.
import { streamText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { readSelectedProject } from './selected-project.mjs';

const endpoint = 'https://api.minimax.io/v1/chat/completions';

export function boundedMinimaxFetch(fetcher = fetch) {
  let calls = 0;
  return async (url, init) => {
    if (new URL(url).href !== endpoint) throw new Error('provider_endpoint_refused');
    if (++calls > 2) throw new Error('provider_call_bound');
    const body = JSON.parse(init.body);
    body.thinking = { type: 'disabled' };
    body.max_completion_tokens = 256;
    delete body.max_tokens;
    const serialized = JSON.stringify(body);
    if (Buffer.byteLength(serialized) > 32768) throw new Error('provider_input_bound');
    return fetcher(url, { ...init, body: serialized, redirect: 'error' });
  };
}

export function forwardProbePart(part, send) {
  if (part.type === 'tool-error') throw new Error('owner_or_tool_failed');
  if (part.type === 'error') throw new Error('provider_flow_failed');
  if (part.type === 'text-delta') {
    send('delta', { text: part.text });
    return part.text.length;
  }
  return 0;
}

export async function runConversation({ message, selectedId, shadowsUrl, send, signal }) {
  if (!process.env.MINIMAX_API_KEY) throw new Error('provider_unavailable');
  const model = createOpenAI({
    apiKey: process.env.MINIMAX_API_KEY,
    baseURL: 'https://api.minimax.io/v1',
    fetch: boundedMinimaxFetch(),
  }).chat('MiniMax-M3');
  let toolExecutions = 0, steps = 0, textChars = 0;
  const result = streamText({
    model,
    maxRetries: 0,
    maxOutputTokens: 256,
    abortSignal: signal,
    system: `You are in a synthetic integration test. Call readSelectedProject for project ${selectedId} before answering. Answer the user's question using only that returned project. Do not invent project facts. Keep the answer under 100 words.`,
    prompt: message,
    tools: {
      readSelectedProject: tool({
        description: 'Read the selected synthetic project from the local Shadows owner.',
        inputSchema: z.object({ projectId: z.string().uuid() }),
        execute: async ({ projectId }) => {
          toolExecutions++;
          return readSelectedProject({ projectId, selectedId, baseUrl: shadowsUrl });
        },
      }),
    },
    toolChoice: 'required',
    stopWhen: stepCountIs(2),
    prepareStep: ({ stepNumber }) => ({ toolChoice: stepNumber === 0 ? 'required' : 'none' }),
    onStepFinish: () => { steps++; },
  });
  for await (const part of result.fullStream) {
    textChars += forwardProbePart(part, send);
    if (textChars > 2048) throw new Error('provider_output_bound');
  }
  const finishReason = await result.finishReason;
  if (toolExecutions !== 1 || steps !== 2) throw new Error('provider_flow_failed');
  send('done', { status: 'complete' });
  return { toolExecutions, steps, textChars, finishReason };
}
