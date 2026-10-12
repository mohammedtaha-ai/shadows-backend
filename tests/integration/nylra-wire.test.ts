import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { Value } from '@sinclair/typebox/value';
import { Type } from '@sinclair/typebox';
import * as S from '../../src/transports/http/nylra-schema.js';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';
import { nylraSchema } from '../../scripts/export-nylra-schema.js';
const schemas=S as unknown as Record<string,Parameters<typeof Value.Check>[0]>;
const fixtures=JSON.parse(await readFile('api/nylra-v1.fixtures.json','utf8'));
test('nylra_wire snapshots match the canonical schema',async()=>{
 const actual=nylraSchema();assert.equal(actual,await readFile('api/nylra-v1.openapi.json','utf8'));
 const directory=await mkdtemp(resolve('.test-runtime/nylra-schema-'));
 try{
  await promisify(execFile)(resolve('node_modules/.bin/openapi-typescript'),[resolve('api/nylra-v1.openapi.json'),'-o',resolve(directory,'schema.d.ts')]);
  assert.equal(await readFile(resolve(directory,'schema.d.ts'),'utf8'),await readFile('api/nylra-v1.d.ts','utf8'));
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('nylra_wire every operation is bearer-protected and refuses with the shared shape',()=>{
 const document=JSON.parse(nylraSchema());assert.equal(document.info.version,fixtures.contractVersion);
 for(const op of nylraOperations){
  assert.ok(op.path.startsWith('/v1/nylra/'));const operation=document.paths[op.path][op.method];
  assert.deepEqual(operation.security,[{backendBearer:[]}]);
  for(const status of [400,401,503])assert.deepEqual(operation.responses[status].content['application/json'].schema,{$ref:'#/components/schemas/NylraRefusal'});
 }
});
test('nylra_wire fixtures pass and invalid samples refuse for their stated reason',()=>{
 const arrays:Record<string,string>={TopicEvents:'TopicEvent',AccountEvents:'AccountEvent'};
 for(const [name,value] of Object.entries(fixtures.valid)){
  const schema=schemas[arrays[name]??name];assert.ok(schema,name);
  for(const item of arrays[name]?value as unknown[]:[value])assert.ok(Value.Check(schema,item),`${name}: ${JSON.stringify([...Value.Errors(schema,item)][0]?.message)}`);
 }
 for(const sample of fixtures.invalid){
  const value=JSON.parse(JSON.stringify(sample.value).replace('@@LONG_MESSAGE@@','x'.repeat(2001)));
  assert.equal(Value.Check(schemas[sample.schema]!,value),false,sample.why);
 }
 for(const refusal of fixtures.refusals)assert.ok(Value.Check(S.NylraRefusal,refusal.body));
 // A snapshot's entries keep their stream order.
 const seqs=fixtures.valid.TopicSnapshot.entries.map((entry:{seq:number})=>entry.seq);
 assert.deepEqual(seqs,[...seqs].sort((a,b)=>a-b));assert.ok(Value.Check(Type.Array(S.Entry),fixtures.valid.TopicSnapshot.entries));
});
