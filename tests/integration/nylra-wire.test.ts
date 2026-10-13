import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { Value } from '@sinclair/typebox/value';
import * as S from '../../src/transports/http/nylra-schema.js';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';
import { nylraSchema, nylraVersion } from '../../scripts/export-nylra-schema.js';

const schemas = S as unknown as Record<string, Parameters<typeof Value.Check>[0]>;
const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8'));
const streams: Record<string, string> = { TopicEvents: 'TopicEvent', SessionEvents: 'SessionEvent', AccountEvents: 'AccountEvent' };

test('nylra_wire fixtures pass and invalid samples refuse for their stated reason', () => {
  for (const [name, value] of Object.entries(fixtures.valid)) {
    const schema = schemas[streams[name] ?? name];
    assert.ok(schema, name);
    for (const item of streams[name] ? value as unknown[] : [value])
      assert.ok(Value.Check(schema, item), `${name}: ${[...Value.Errors(schema, item)][0]?.message}`);
  }
  for (const [name, events] of Object.entries(fixtures.valid).filter(([name]) => streams[name])) {
    const seqs = (events as { seq: number }[]).map(event => event.seq);
    assert.deepEqual(seqs, seqs.map((_, index) => seqs[0]! + index), `${name} is gapless`);
  }
  for (const sample of fixtures.invalid) {
    const value = JSON.parse(JSON.stringify(sample.value)
      .replace('@@LONG_MESSAGE@@', 'x'.repeat(2001)).replace('@@LONG_SUMMARY@@', 'x'.repeat(201)));
    assert.equal(Value.Check(schemas[sample.schema]!, value), false, sample.why);
  }
  for (const refusal of fixtures.refusals) assert.ok(Value.Check(S.NylraRefusal, refusal.body));
});

test('nylra_wire snapshots match the canonical schema', async () => {
  const document = nylraSchema();
  assert.equal(document, await readFile('api/nylra-v1.openapi.json', 'utf8'));
  assert.ok(!document.includes('"const"'), 'OpenAPI 3.0 has no const');
  assert.ok(!document.includes('"type": "null"'), 'OpenAPI 3.0 has no null type');
  await mkdir('.test-runtime', { recursive: true });
  const directory = await mkdtemp(resolve('.test-runtime/nylra-schema-'));
  try {
    await promisify(execFile)(resolve('node_modules/.bin/openapi-typescript'), [resolve('api/nylra-v1.openapi.json'), '-o', resolve(directory, 'schema.d.ts')]);
    assert.equal(await readFile(resolve(directory, 'schema.d.ts'), 'utf8'), await readFile('api/nylra-v1.d.ts', 'utf8'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('nylra_wire every operation is bearer-protected and refuses with the shared shape', () => {
  const document = JSON.parse(nylraSchema());
  assert.equal(document.info.version, nylraVersion);
  assert.equal(fixtures.contractVersion, nylraVersion);
  for (const op of nylraOperations) {
    assert.ok(op.path.startsWith('/v1/nylra/'), op.path);
    const operation = document.paths[op.path][op.method];
    assert.deepEqual(operation.security, [{ backendBearer: [] }]);
    for (const status of [400, 401, 503])
      assert.deepEqual(operation.responses[status].content['application/json'].schema, { $ref: '#/components/schemas/NylraRefusal' });
  }
});

test('nylra_wire every operation has a fixture the mock can answer with', () => {
  for (const op of nylraOperations) {
    if (op.okType === 'text/event-stream' || op.ok === S.Empty) continue;
    const name = Object.entries(S).find(([, value]) => value === op.ok)![0];
    const value = fixtures.responses[`${op.method.toUpperCase()} ${op.path}`] ?? fixtures.valid[name];
    assert.ok(value && Value.Check(op.ok, value), `${op.method} ${op.path}`);
  }
});
