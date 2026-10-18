import { createServer as createHttpsServer } from 'node:https';
import { createServer as createTcpServer, type Socket } from 'node:net';
import { tlsFixture } from './tls.js';

export type FakeProviderMode = 'stream' | 'stall' | 'forever' | 'redirect' | 'error' | 'connect-stall' | 'malformed';
export async function fakeProvider(options: {
  mode?: FakeProviderMode; status?: number; errorMessage?: string; deltas?: string[]; delayMs?: number; finishReason?: 'stop' | 'length';
} = {}) {
  const tls = await tlsFixture(), sockets = new Set<Socket>();
  let requests = 0, connections = 0, closed = 0, lastHost = '', lastPath = '', lastBody: unknown;
  const mode = options.mode ?? 'stream';
  const server = mode === 'connect-stall' ? createTcpServer() : createHttpsServer({ key: tls.key, cert: tls.cert }, (request, response) => {
    requests++; lastHost = request.headers.host ?? ''; lastPath = request.url ?? '';
    let body = '';
    request.on('data', chunk => { body += chunk.toString(); });
    request.on('end', () => {
      try { lastBody = JSON.parse(body); } catch { lastBody = null; }
      if (mode === 'redirect') { response.writeHead(302, { location: 'https://must-not-resolve.example/' }); response.end(); return; }
      if (mode === 'error') {
        response.writeHead(options.status ?? 401, { 'content-type': 'application/json', 'x-sensitive': 'synthetic-provider-key' });
        response.end(JSON.stringify({ error: { message: options.errorMessage ?? 'synthetic-provider-key private provider detail', type: 'invalid_request_error' } }));
        return;
      }
      response.writeHead(200, { 'content-type': 'text/event-stream', 'x-sensitive': 'synthetic-provider-key' });
      response.flushHeaders();
      if (mode === 'stall') return;
      if (mode === 'malformed') { response.end('data: synthetic-provider-key malformed\n\n'); return; }
      let index = 0;
      const deltas = options.deltas ?? ['Hello', ' world'];
      const timer = setInterval(() => {
        if (response.destroyed) { clearInterval(timer); return; }
        const text = mode === 'forever' ? 'x' : deltas[index++];
        const chunk = { id: 'synthetic-reply', object: 'chat.completion.chunk', created: 0, model: 'synthetic-model',
          choices: [{ index: 0, delta: text === undefined ? {} : { content: text }, finish_reason: text === undefined ? options.finishReason ?? 'stop' : null }] };
        response.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (text === undefined) { clearInterval(timer); response.end('data: [DONE]\n\n'); }
      }, options.delayMs ?? 10);
      response.once('close', () => { clearInterval(timer); });
    });
  });
  server.on('connection', socket => {
    connections++;
    sockets.add(socket);
    socket.once('close', () => { closed++; sockets.delete(socket); });
  });
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('fake_provider_address');
    const baseUrl = `https://127.0.0.1:${address.port}/v1`;
    return { baseUrl, get requests() { return requests; }, get connections() { return connections; }, get closed() { return closed; },
      get lastHost() { return lastHost; }, get lastPath() { return lastPath; }, get lastBody() { return lastBody; },
      destination: { origin: new URL(baseUrl).origin, host: '127.0.0.1', port: address.port,
        addresses: [{ address: '127.0.0.1', family: 4 as const }], baseUrl },
      async close() { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())); await tls.close(); },
    };
  } catch (error) { for (const socket of sockets) socket.destroy(); server.close(); await tls.close(); throw error; }
}
