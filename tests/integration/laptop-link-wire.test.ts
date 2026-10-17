import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';

test('laptop_link_wire_generation_and_bounds', async () => {
  const issue = nylraOperations.find(op => (op as {operationId?:string}).operationId === 'issueLaptopCode');
  assert.ok(issue, 'pairing issuance must be a canonical operation');
  const S = await import('../../src/transports/laptop-link/schema.js');
  const { Value } = await import('@sinclair/typebox/value');
  const hello = { type:'hello', protocolVersion:1, producerId:'00000000-0000-4000-8000-000000000001', lastAck:0 };
  assert.ok(S.checkClientFrame(hello));
  for (const wrong of [{...hello, protocolVersion:2}, {...hello, accountId:'foreign'}, {...hello,lastAck:9007199254740992}]) assert.equal(S.checkClientFrame(wrong),false);
  const step = {type:'step',localSessionId:'local',localStepId:'step',at:'2026-10-17T00:00:00Z',tool:'Read',path:'a.ts'};
  const batch = {type:'batch',entries:[{seq:1,event:step},{seq:2,event:step}]};
  assert.ok(S.checkClientFrame(batch));
  for (const wrong of [
    {...batch, entries:[{seq:1,event:{...step,summary:'secret'}}]},
    {...batch, entries:[{seq:1,event:{...step,target:'command'}}]},
    {...batch, entries:[{seq:1,event:{...step,toolInput:{command:'secret'}}}]},
    {...batch, entries:[{seq:1,event:step},{seq:3,event:step}]},
    {...batch, entries:Array.from({length:21},(_,i)=>({seq:i+1,event:step}))},
  ]) assert.equal(S.checkClientFrame(wrong),false);
  assert.ok(Value.Check(S.ServerFrame,{type:'ack',epoch:1,ackThrough:2,dropped:[]}));
  const {laptopLinkArtifacts} = await import('../../scripts/export-laptop-link-schema.js');
  const {checkLaptopLinkArtifacts} = await import('../../scripts/check-laptop-link-schema.js');
  const artifacts = await laptopLinkArtifacts();
  assert.deepEqual(artifacts,await laptopLinkArtifacts());
  assert.equal(artifacts.schema,await readFile('api/laptop-link-v1.schema.json','utf8'));
  assert.equal(artifacts.declarations,await readFile('api/laptop-link-v1.d.ts','utf8'));
  await mkdir('.test-runtime',{recursive:true});
  const root = await mkdtemp(resolve('.test-runtime/link-wire-'));
  try {
    await mkdir(resolve(root,'api'));
    await writeFile(resolve(root,'api/laptop-link-v1.schema.json'),artifacts.schema);
    await writeFile(resolve(root,'api/laptop-link-v1.d.ts'),artifacts.declarations);
    await checkLaptopLinkArtifacts(root);
    await writeFile(resolve(root,'api/laptop-link-v1.d.ts'),artifacts.declarations+'// drift\n');
    await assert.rejects(checkLaptopLinkArtifacts(root),/artifact_drift/);
  } finally {await rm(root,{recursive:true,force:true});}
});
