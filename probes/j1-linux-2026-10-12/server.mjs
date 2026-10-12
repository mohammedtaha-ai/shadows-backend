// Disposable local preview server. It is not a product auth or conversation API.
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const previewOrigin = 'http://127.0.0.1:5173';

export function createProbeServer({ selectedId, shadowsUrl, runConversation }) {
  return createServer(async (request, response) => {
    if (request.headers.origin && request.headers.origin !== previewOrigin) {
      response.writeHead(403).end(); return;
    }
    response.setHeader('access-control-allow-origin', previewOrigin);
    response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
    response.setHeader('access-control-allow-headers', 'content-type');
    if (request.method === 'OPTIONS' && request.url === '/chat') {
      response.writeHead(204).end(); return;
    }
    if (request.method !== 'POST' || request.url !== '/chat' ||
        !request.headers['content-type']?.startsWith('application/json')) {
      response.writeHead(404).end(); return;
    }
    let bytes = 0;
    const parts = [];
    for await (const part of request) {
      bytes += part.length;
      if (bytes > 2300) { response.writeHead(400).end(); return; }
      parts.push(part);
    }
    let message;
    try { message = JSON.parse(Buffer.concat(parts).toString()).message; } catch { /* refused below */ }
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      response.writeHead(400).end(); return;
    }
    response.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    const send = (event, data) => { if (!response.destroyed) response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
    try {
      const run = runConversation ?? (await import('./conversation.mjs')).runConversation;
      await run({ message, selectedId, shadowsUrl, send, signal: AbortSignal.timeout(45000) });
    } catch { send('error', { code: 'probe_failed' }); }
    response.end();
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const selectedId = process.env.SHADOWS_PROJECT_ID;
  if (!selectedId || !process.env.MINIMAX_API_KEY) {
    process.stderr.write('SHADOWS_PROJECT_ID and MINIMAX_API_KEY are required\n');
    process.exit(2);
  }
  createProbeServer({ selectedId, shadowsUrl: 'http://127.0.0.1:4318' })
    .listen(8765, '127.0.0.1', () => process.stdout.write('probe listening on 127.0.0.1:8765\n'));
}
