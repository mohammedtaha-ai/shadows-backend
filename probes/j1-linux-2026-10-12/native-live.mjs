// Launch a disposable Shadows owner and this probe beside the native Linux UI.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createProbeServer } from './server.mjs';
import { runConversation } from './conversation.mjs';

const out = process.argv[2];
if (!out || !process.env.MINIMAX_API_KEY) throw new Error('probe_configuration_missing');
const log = openSync(`${out}/owner.log`, 'w');
const owner = spawn('/workspace/shadows/target/debug/shadows', [
  'serve', '--db', `${out}/shadows.sqlite3`,
  '--node', '/usr/local/bin/node',
  '--adapter', '/workspace/shadows/harness/claude/node_modules/@agentclientprotocol/claude-agent-acp/dist/index.js',
  '--harness', '/workspace/.tools/claude/node_modules/@anthropic-ai/claude-code/bin/claude.exe',
], { stdio: ['ignore', log, log] });
closeSync(log);
let server;
const stop = () => { server?.close(); owner.kill('SIGINT'); };
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
try {
  let available = false;
  for (let i = 0; i < 100; i++) {
    if (owner.exitCode !== null) throw new Error('owner_start_failed');
    try { available = (await fetch('http://127.0.0.1:4318/api/projects')).ok; } catch {}
    if (available) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!available) throw new Error('owner_start_timeout');
  const response = await fetch('http://127.0.0.1:4318/api/projects', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command_id: randomUUID(), slug: 'synthetic-lighthouse',
      name: 'Synthetic Lighthouse', directory: '/workspace/.tools/probe/synthetic-lighthouse' }),
  });
  if (!response.ok) throw new Error('fixture_create_failed');
  const project = await response.json();
  server = createProbeServer({ selectedId: project.id, shadowsUrl: 'http://127.0.0.1:4318',
    runConversation: async args => {
      try {
        const providerFetch = process.env.PROBE_PROVIDER_FIXTURE === '1'
          ? (await import('./provider-fixture.mjs')).createFixtureFetch(project.id) : fetch;
        const result = await runConversation({ ...args, providerFetch });
        process.stdout.write(JSON.stringify({ event: 'turn-complete', ...result,
          providerFixture: process.env.PROBE_PROVIDER_FIXTURE === '1' }) + '\n');
      } catch {
        process.stdout.write(JSON.stringify({ event: 'turn-failed' }) + '\n');
        throw new Error('native_probe_failed');
      }
    },
  });
  await new Promise(resolve => server.listen(8765, '127.0.0.1', resolve));
  await writeFile(`${out}/ready`, 'synthetic probe ready\n');
} catch {
  stop();
  process.stderr.write('native live probe startup failed\n');
  process.exitCode = 1;
}
