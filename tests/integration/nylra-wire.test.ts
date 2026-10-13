import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Value } from '@sinclair/typebox/value';
import * as S from '../../src/transports/http/nylra-schema.js';

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
