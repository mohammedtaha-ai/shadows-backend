import { streamText, type LanguageModel } from 'ai';
import { NYLRA_INSTRUCTIONS } from './instructions.js';

export interface ReplyInput {
  model: LanguageModel;
  history: readonly { role: 'user' | 'assistant'; content: string }[];
  message: string;
  signal?: AbortSignal;
  maxOutputTokens?: number;
}
export type FailureCategory = 'credential_rejected' | 'model_unavailable' | 'quota' | 'network' | 'destination_refused' | 'context_too_large';
const CATEGORIES: readonly string[] = ['credential_rejected', 'model_unavailable', 'quota', 'network', 'destination_refused', 'context_too_large'];
export type ReplyPart = string | { finish: 'done' | 'length' } | { finish: 'error'; category?: FailureCategory };
// Only a fixed category name survives; messages, causes and bodies are never read.
function categoryOf(error: unknown): FailureCategory | undefined {
  if (error instanceof Error && error.name === 'ProviderFailure' && CATEGORIES.includes(error.message)) return error.message as FailureCategory;
  return undefined;
}
export async function* replyStream(input: ReplyInput): AsyncGenerator<ReplyPart> {
  if (input.signal?.aborted) { yield { finish: 'error' }; return; }
  const requested = input.maxOutputTokens ?? 4096;
  if (!Number.isInteger(requested) || requested < 1) { yield { finish: 'error' }; return; }
  let finish: 'done' | 'length' | 'error' = 'error';
  let category: FailureCategory | undefined;
  try {
    const result = streamText({
      model: input.model,
      system: NYLRA_INSTRUCTIONS,
      messages: [...input.history.map(({ role, content }) => ({ role, content })), { role: 'user', content: input.message }],
      abortSignal: input.signal,
      maxOutputTokens: Math.min(requested, 4096),
      maxRetries: 0,
      onError() { /* The host receives only the terminal category. */ },
    });
    for await (const part of result.fullStream) {
      if (input.signal?.aborted) break;
      if (part.type === 'text-delta') yield part.text;
      if (part.type === 'error' || part.type === 'abort') {
        finish = 'error'; if (part.type === 'error') category = categoryOf(part.error);
        break;
      }
      if (part.type === 'finish') finish = part.finishReason === 'stop' ? 'done' : part.finishReason === 'length' ? 'length' : 'error';
    }
  } catch (error) { finish = 'error'; category = categoryOf(error); }
  if (input.signal?.aborted || finish === 'error') yield category && !input.signal?.aborted ? { finish: 'error', category } : { finish: 'error' };
  else yield { finish };
}
