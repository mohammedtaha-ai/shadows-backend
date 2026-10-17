import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { checkServerIdentity } from 'node:tls';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { APICallError, wrapLanguageModel } from 'ai';
import type { ValidatedDestination } from '../../modules/provider-settings/index.js';

interface Deadlines { connectMs: number; idleMs: number; totalMs: number }
export const PROVIDER_DEADLINES: Readonly<Deadlines> = Object.freeze({ connectMs: 5000, idleMs: 30000, totalMs: 120000 });
type Refusal = 'credential_rejected' | 'model_unavailable' | 'quota' | 'network' | 'destination_refused';
class ProviderFailure extends Error {
  constructor(readonly code: Refusal) { super(code); this.name = 'ProviderFailure'; }
}
const statusCode = (status: number): Refusal => status === 401 || status === 403 ? 'credential_rejected'
  : status === 404 ? 'model_unavailable' : status === 429 ? 'quota' : 'network';
function safeError(error: unknown): ProviderFailure {
  if (error instanceof ProviderFailure) return new ProviderFailure(error.code);
  if (APICallError.isInstance(error) && error.statusCode) return new ProviderFailure(statusCode(error.statusCode));
  return new ProviderFailure('network');
}

function pinnedFetch(destination: ValidatedDestination & { baseUrl: string }, deadlines: Deadlines): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, { ...init, redirect: 'error' });
    const url = new URL(request.url), base = new URL(destination.baseUrl), address = destination.addresses[0];
    if (!address || !isIP(address.address) || url.origin !== destination.origin || url.protocol !== 'https:'
      || url.pathname !== base.pathname.replace(/\/$/, '') + '/chat/completions'
      || url.search || url.hash || url.username || url.password || request.method !== 'POST') throw new ProviderFailure('destination_refused');
    const body = Buffer.from(await request.arrayBuffer());
    if (request.signal.aborted) throw new ProviderFailure('network');
    return new Promise<Response>((resolve, reject) => {
      let finished = false, idleTimer: NodeJS.Timeout | undefined;
      const cleanup = () => {
        clearTimeout(connectTimer); clearTimeout(totalTimer); clearTimeout(idleTimer);
        request.signal.removeEventListener('abort', abort);
      };
      const fail = (code: Refusal) => {
        if (finished) return;
        finished = true; cleanup();
        const error = new ProviderFailure(code);
        outgoing.destroy(error); reject(error);
      };
      const abort = () => fail('network');
      const armIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => fail('network'), deadlines.idleMs); };
      const outgoing = httpsRequest({
        // Connect to exactly one approved literal, with no DNS or address fallback.
        hostname: address.address, family: address.family, port: destination.port, method: 'POST', path: url.pathname,
        servername: isIP(destination.host) ? undefined : destination.host,
        checkServerIdentity: (_hostname, certificate) => checkServerIdentity(destination.host, certificate),
        rejectUnauthorized: true, agent: false,
        headers: { ...Object.fromEntries(request.headers), host: url.host, 'content-length': String(body.length) },
      }, incoming => {
        const status = incoming.statusCode ?? 0;
        if (status >= 300 && status < 400) { fail('destination_refused'); incoming.destroy(); return; }
        if (status < 200 || status >= 300) { fail(statusCode(status)); incoming.destroy(); return; }
        armIdle();
        incoming.on('data', armIdle);
        incoming.once('end', () => { finished = true; cleanup(); });
        incoming.once('error', () => fail('network'));
        incoming.once('close', () => {
          if (!finished) fail('network');
        });
        // No provider response headers or request body survive into SDK metadata.
        const headers = new Headers();
        if (incoming.headers['content-type']) headers.set('content-type', incoming.headers['content-type']);
        resolve(new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, { status, headers }));
      });
      const connectTimer = setTimeout(() => fail('network'), deadlines.connectMs);
      const totalTimer = setTimeout(() => fail('network'), deadlines.totalMs);
      outgoing.once('socket', socket => { socket.once('secureConnect', () => { clearTimeout(connectTimer); armIdle(); }); });
      outgoing.once('error', () => fail('network'));
      request.signal.addEventListener('abort', abort, { once: true });
      if (request.signal.aborted) { abort(); return; }
      outgoing.end(body);
    });
  };
}

export function createOpenAICompatibleModel(connection: {
  destination: ValidatedDestination & { baseUrl: string }; model: string; apiKey: string;
}, options: { deadlines?: Partial<Deadlines> } = {}) {
  const deadlines = { ...PROVIDER_DEADLINES };
  for (const name of ['connectMs', 'idleMs', 'totalMs'] as const) {
    const value = options.deadlines?.[name];
    if (value !== undefined) {
      if (!Number.isFinite(value) || value <= 0) throw new ProviderFailure('network');
      deadlines[name] = Math.min(PROVIDER_DEADLINES[name], value);
    }
  }
  const provider = createOpenAICompatible({ name: 'account-provider', baseURL: connection.destination.baseUrl,
    apiKey: connection.apiKey, fetch: pinnedFetch({ ...connection.destination,
      addresses: connection.destination.addresses.map(address => ({ ...address })) }, deadlines) });
  const model = wrapLanguageModel({ model: provider.chatModel(connection.model), middleware: {
    wrapGenerate: async ({ doGenerate }) => {
      try { const result = await doGenerate(); return { ...result, request: undefined, response: undefined }; }
      catch (error) { throw safeError(error); }
    },
    wrapStream: async ({ doStream }) => {
      try {
        const result = await doStream(), reader = result.stream.getReader();
        return { stream: new ReadableStream({
          async pull(controller) {
            try {
              const next = await reader.read();
              if (next.done) controller.close();
              else if (next.value.type === 'error') {
                controller.enqueue({ ...next.value, error: safeError(next.value.error) });
                await reader.cancel(); controller.close();
              } else controller.enqueue(next.value);
            } catch (error) { controller.error(safeError(error)); }
          },
          cancel() { return reader.cancel(); },
        }) };
      } catch (error) { throw safeError(error); }
    },
  } });
  // Safe generic failures also prevent the SDK's default API-error retry path.
  return { model, maxRetries: 0 as const };
}
