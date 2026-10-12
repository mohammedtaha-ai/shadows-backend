import test from 'node:test';
import assert from 'node:assert/strict';
import { createProbeServer } from './server.mjs';

test('chat streams a bounded synthetic reply to the Linux preview', async () => {
  const server = createProbeServer({
    selectedId: '11111111-1111-4111-8111-111111111111',
    shadowsUrl: 'http://127.0.0.1:4318',
    runConversation: async ({ message, send }) => {
      assert.equal(message, 'Name the selected project');
      send('delta', { text: 'Synthetic Lighthouse' });
      send('done', { status: 'complete' });
    },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:5173' },
      body: JSON.stringify({ message: 'Name the selected project' }),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    assert.match(await response.text(), /Synthetic Lighthouse/);
  } finally { server.close(); }
});

test('chat refuses an oversized message before a provider call', async () => {
  let calls = 0;
  const server = createProbeServer({
    selectedId: '11111111-1111-4111-8111-111111111111',
    shadowsUrl: 'http://127.0.0.1:4318',
    runConversation: async () => { calls++; },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:5173' },
      body: JSON.stringify({ message: 'x'.repeat(2200) }),
    });
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally { server.close(); }
});

test('native Linux Tauri preview origin is allowed for its local probe', async () => {
  const server = createProbeServer({
    selectedId: '11111111-1111-4111-8111-111111111111',
    shadowsUrl: 'http://127.0.0.1:4318',
    runConversation: async ({ send }) => send('done', { status: 'complete' }),
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = 'tauri://localhost';
    const response = await fetch(`http://127.0.0.1:${server.address().port}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  } finally { server.close(); }
});

test('unrecognized browser origin is refused before conversation', async () => {
  let calls = 0;
  const server = createProbeServer({
    selectedId: '11111111-1111-4111-8111-111111111111',
    shadowsUrl: 'http://127.0.0.1:4318',
    runConversation: async () => { calls++; },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://untrusted.example' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(response.status, 403);
    assert.equal(calls, 0);
  } finally { server.close(); }
});
