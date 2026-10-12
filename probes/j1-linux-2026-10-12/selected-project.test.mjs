import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readSelectedProject } from './selected-project.mjs';

const selectedId = '11111111-1111-4111-8111-111111111111';
const foreignId = '22222222-2222-4222-8222-222222222222';

test('a selected Shadows project is read through the owner API', async () => {
  let requests = 0;
  const server = createServer((_req, response) => {
    requests++;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify([
      { id: selectedId, name: 'Synthetic Lighthouse', slug: 'lighthouse' },
      { id: foreignId, name: 'Private Fixture', slug: 'private' },
    ]));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await readSelectedProject({
      projectId: selectedId, selectedId,
      baseUrl: `http://127.0.0.1:${server.address().port}`,
    });
    assert.deepEqual(result, { id: selectedId, name: 'Synthetic Lighthouse', slug: 'lighthouse' });
    assert.equal(requests, 1);
  } finally { server.close(); }
});

test('a foreign project is refused before any owner request', async () => {
  let requests = 0;
  const fetcher = async () => { requests++; throw new Error('must not fetch'); };
  await assert.rejects(readSelectedProject({
    projectId: foreignId, selectedId, baseUrl: 'http://127.0.0.1:4318', fetcher,
  }), /project_scope_refused/);
  assert.equal(requests, 0);
});

test('an unavailable Shadows owner is reported as unavailable', async () => {
  await assert.rejects(readSelectedProject({
    projectId: selectedId, selectedId, baseUrl: 'http://127.0.0.1:4318',
    fetcher: async () => { throw new Error('connection refused'); },
  }), /owner_unavailable/);
});
