// NON-PRODUCT: synthetic transport and schema compatibility experiment.
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { check, save } from './record.mjs';
const app = Fastify({ logger: false, ajv: { customOptions: { removeAdditional: false, coerceTypes: false } } });
await app.register(swagger, { openapi: { openapi: '3.0.3', info: { title: 'NON-PRODUCT B0', version: '0.0.1' } } });
const Reply = Type.Object({ id: Type.String(), revision: Type.Integer({ minimum: 0 }) }, { additionalProperties: false });
app.post('/probe', { schema: { operationId: 'probe', body: Reply, response: { 200: Reply } } }, async r => ({ ...r.body, internal: 'must be stripped' }));
app.get('/bad-response', { schema: { response: { 200: Reply } } }, async () => ({ id: 'synthetic' }));
app.get('/invalid-response', { schema: { response: { 200: Reply } } }, async () => ({ id: 'synthetic', revision: -1 }));
app.get('/strict-response', { schema: { response: { 200: Reply } } }, async () => {
  const value = { id: 'synthetic', revision: -1 }; if (!Value.Check(Reply, value)) throw new Error('Synthetic outgoing schema refusal'); return value;
});
let disconnects = 0;
app.get('/stream', { schema: { response: { 200: { type: 'string', description: 'NDJSON synthetic events; replay is outside OpenAPI' } } } }, async (r, reply) => {
  reply.hijack(); reply.raw.writeHead(200, { 'content-type': 'application/x-ndjson' });
  reply.raw.write(JSON.stringify({ kind: 'start', sequence: 0 }) + '\n');
  let n = 0; const timer = setInterval(() => { reply.raw.write(JSON.stringify({ kind: 'chunk', sequence: ++n, text: 'synthetic' }) + '\n'); if (r.query.fail === '1' && n === 2) { reply.raw.end(JSON.stringify({ kind: 'error', sequence: ++n, code: 'synthetic_failure' }) + '\n'); clearInterval(timer); } else if (n === 5) { reply.raw.end(JSON.stringify({ kind: 'end', sequence: ++n }) + '\n'); clearInterval(timer); } }, 30);
  reply.raw.on('close', () => { clearInterval(timer); disconnects++; });
});
await check('response serializer limit and explicit outgoing validation', async () => {
  const unchecked = await app.inject('/invalid-response'); assert.equal(unchecked.statusCode, 200); assert.equal(unchecked.json().revision, -1);
  const checked = await app.inject('/strict-response'); assert.equal(checked.statusCode, 500);
  return { serializerAloneAcceptsNegativeRevision: true, explicitTypeBoxCheckRefuses: 500 };
});
await app.listen({ host: '127.0.0.1', port: 45871 });
try {
await check('request validation and response serialization', async () => {
  const valid = await app.inject({ method: 'POST', url: '/probe', payload: { id: 'fixture', revision: 1 } });
  assert.equal(valid.statusCode, 200); assert.deepEqual(valid.json(), { id: 'fixture', revision: 1 });
  for (const payload of [{ id: 'fixture', revision: '1' }, { id: 'fixture', revision: -1 }, { id: 'fixture', revision: 1, foreign: true }]) assert.equal((await app.inject({ method: 'POST', url: '/probe', payload })).statusCode, 400);
  assert.equal((await app.inject('/bad-response')).statusCode, 500);
  return { valid: 200, invalidCases: 3, missingRequiredResponse: 500, privateFieldStripped: true };
});
await check('HTTP stream completion and disconnect', async () => {
  const full = await (await fetch('http://127.0.0.1:45871/stream')).text();
  const events = full.trim().split('\n').map(JSON.parse); assert.equal(events[0].kind, 'start'); assert.equal(events.at(-1).kind, 'end'); assert.equal(events.length, 7);
  const failed = (await (await fetch('http://127.0.0.1:45871/stream?fail=1')).text()).trim().split('\n').map(JSON.parse); assert.equal(failed.at(-1).kind, 'error'); assert.equal(failed.filter(x => x.kind === 'chunk').length, 2);
  const controller = new AbortController(); const response = await fetch('http://127.0.0.1:45871/stream', { signal: controller.signal }); const reader = response.body.getReader(); await reader.read(); controller.abort();
  await new Promise(r => setTimeout(r, 100)); assert.equal(disconnects, 3);
  return { completedEvents: events.length, partialFailureChunks: 2, errorTerminal: true, closedConnections: disconnects };
});
await mkdir('artifacts', { recursive: true }); await writeFile('artifacts/openapi.json', JSON.stringify(app.swagger(), null, 2));
await writeFile('artifacts/reply.json', JSON.stringify({ id: 'fixture', revision: 1 }));
await check('schema validation generated TypeScript and compiled Dart HTTP consumers', async () => {
  const { execFile } = await import('node:child_process'); const { promisify } = await import('node:util'); const run = promisify(execFile);
  const { default: parser } = await import('@apidevtools/swagger-parser'); await parser.validate(app.swagger());
  await run(process.execPath, ['node_modules/openapi-typescript/bin/cli.js', 'artifacts/openapi.json', '-o', 'artifacts/schema.d.ts']);
  await run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--module', 'nodenext', '--target', 'es2022', 'consumer.ts']);
  const ts = await run(process.execPath, ['--import', 'tsx', 'consumer.ts']);
  await run(process.execPath, ['dart-generate.mjs']);
  const dart = 'C:/src/flutter/bin/cache/dart-sdk/bin/dart.exe';
  await run(dart, ['analyze', 'artifacts/consumer.dart']);
  await run(dart, ['compile', 'exe', 'artifacts/consumer.dart', '-o', 'consumer.exe']);
  const compiled = await run(new URL('./consumer.exe', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), []);
  return { openapi: '3.0.3 valid', typescript: ts.stdout.trim(), dart: compiled.stdout.trim(), generatorScope: 'flat fixture DTO only' };
});
} finally { app.server.closeAllConnections(); await app.close(); await save('http-results'); }
