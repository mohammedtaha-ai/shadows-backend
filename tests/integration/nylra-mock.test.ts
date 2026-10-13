import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Value } from '@sinclair/typebox/value';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';
import * as S from '../../src/transports/http/nylra-schema.js';
import { buildNylraMock, type NylraFixtures } from '../../scripts/mock-nylra.js';

const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8')) as NylraFixtures;
const app = buildNylraMock(fixtures);
const bearer = { authorization: 'Bearer synthetic' };
const ids: Record<string, string> = {
  laptopId: '00000000-0000-4000-8000-000000000010', topicId: '00000000-0000-4000-8000-000000000030',
  turnId: '00000000-0000-4000-8000-000000000055', sessionId: '00000000-0000-4000-8000-000000000060',
  approvalId: '00000000-0000-4000-8000-000000000070', grantId: '00000000-0000-4000-8000-000000000080',
};
const decide = (approvalId: string, decision = 'allow') => app.inject({
  method: 'POST', url: `/v1/nylra/approvals/${approvalId}/decide`, headers: bearer,
  payload: { commandId: '00000000-0000-4000-8000-0000000000c4', decision },
});
const seqs = (body: string) => [...body.matchAll(/^id: (\d+)$/gm)].map(match => Number(match[1]));

test('nylra_mock refuses a request without a bearer', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/nylra/approvals' });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { code: 'unauthorized' });
});

test('nylra_mock answers every operation with a value its schema accepts', async () => {
  for (const op of nylraOperations.filter(op => op.okType !== 'text/event-stream')) {
    const url = op.path.replace(/\{(\w+)\}/g, (_, name: string) => ids[name]!);
    const name = op.body && Object.entries(S).find(([, value]) => value === op.body)![0];
    const payload = op.body ? (name === 'Empty' ? {} : fixtures.valid[name!]) : undefined;
    const response = await app.inject({ method: op.method.toUpperCase() as 'GET', url, headers: bearer, payload: payload as object });
    assert.equal(response.statusCode, 200, `${op.method} ${op.path}: ${response.body}`);
    assert.ok(Value.Check(op.ok, response.json()), `${op.method} ${op.path}`);
  }
});

test('nylra_mock replays a stream after its cursor without gap or duplicate', async () => {
  const events = (after?: number) => app.inject({
    method: 'GET', url: `/v1/nylra/topics/${ids.topicId}/events${after === undefined ? '' : `?after=${after}`}`, headers: bearer,
  });
  assert.deepEqual(seqs((await events()).body), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seqs((await events(2)).body), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seqs((await events(6)).body), [7, 8]);
  assert.deepEqual(seqs((await events(8)).body), []);
  for (const cursor of [1, 9]) {
    const response = await events(cursor);
    assert.equal(response.statusCode, 410, `after=${cursor}`);
    assert.deepEqual(response.json(), { code: 'resnapshot_required' });
  }
});

test('nylra_mock refuses a decided, expired or unknown approval and an invalid decision', async () => {
  for (const [approvalId, code] of [
    [fixtures.mock.decidedApprovalId, 'approval_already_decided'],
    [fixtures.mock.expiredApprovalId, 'approval_expired'],
  ]) {
    const response = await decide(approvalId!);
    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.json(), { code });
  }
  assert.equal((await decide('00000000-0000-4000-8000-0000000000ff')).statusCode, 404);
  const invalid = await decide(ids.approvalId!, 'approve');
  assert.equal(invalid.statusCode, 400);
  assert.deepEqual(invalid.json(), { code: 'request_invalid' });
});

test('nylra_mock refuses JSON body types that differ from the wire contract', async () => {
  const response = await app.inject({
    method: 'POST', url: `/v1/nylra/topics/${ids.topicId}/turns`, headers: bearer,
    payload: { commandId: '00000000-0000-4000-8000-0000000000c3', message: 123 },
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { code: 'request_invalid' });
});

test('nylra_mock malformed JSON uses the shared refusal shape', async () => {
  const response = await app.inject({
    method: 'POST', url: `/v1/nylra/approvals/${ids.approvalId}/decide`,
    headers: { ...bearer, 'content-type': 'application/json' }, payload: '{',
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { code: 'request_invalid' });
});

test('nylra_mock replays each stream as schema-valid SSE frames', async () => {
  for (const [url, schema, expected] of [
    [`/v1/nylra/topics/${ids.topicId}/events?after=4`, S.TopicEvent, [5, 6, 7, 8]],
    [`/v1/nylra/sessions/${ids.sessionId}/events?after=2`, S.SessionEvent, [3, 4]],
    ['/v1/nylra/events?after=12', S.AccountEvent, [13, 14, 15, 16, 17, 18]],
  ] as const) {
    const response = await app.inject({ method: 'GET', url, headers: bearer });
    assert.equal(response.statusCode, 200);
    assert.match(response.headers['content-type']!, /^text\/event-stream/);
    assert.deepEqual(seqs(response.body), expected);
    for (const frame of response.body.trim().split('\n\n')) {
      const data = JSON.parse(/^data: (.+)$/m.exec(frame)![1]!);
      assert.ok(Value.Check(schema, data));
      assert.equal(Number(/^id: (\d+)$/m.exec(frame)![1]), data.seq);
      assert.equal(/^event: (.+)$/m.exec(frame)![1], data.type);
    }
  }
});

test('nylra_mock refuses malformed integer cursor spellings without truncation', async () => {
  for (const after of ['8.9', '2e1', '-1', 'Infinity', '', '9007199254740993']) {
    const response = await app.inject({
      method: 'GET', url: `/v1/nylra/topics/${ids.topicId}/events?after=${after}`, headers: bearer,
    });
    assert.equal(response.statusCode, 400, `after=${after}`);
    assert.deepEqual(response.json(), { code: 'request_invalid' });
  }
});

test('nylra_mock denial returns the denied approval fixture', async () => {
  const response = await decide(ids.approvalId!, 'deny');
  assert.equal(response.statusCode, 200);
  assert.ok(Value.Check(S.Approval, response.json()));
  assert.equal(response.json().state, 'denied');
  assert.deepEqual(response.json().decidedBy, { kind: 'person' });
});
