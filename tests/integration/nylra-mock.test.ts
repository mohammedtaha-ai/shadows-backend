import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Value} from '@sinclair/typebox/value';
import {nylraOperations} from '../../src/transports/http/nylra-paths.js';
import * as S from '../../src/transports/http/nylra-schema.js';
import {buildNylraMock,type NylraFixtures} from '../../scripts/mock-nylra.js';
const fixtures=JSON.parse(await readFile('api/nylra-v1.fixtures.json','utf8')) as NylraFixtures;
const app=buildNylraMock(fixtures),bearer={authorization:'Bearer synthetic'};
const ids:Record<string,string>={laptopId:'00000000-0000-4000-8000-000000000010',topicId:'00000000-0000-4000-8000-000000000030',turnId:'00000000-0000-4000-8000-000000000055',sessionId:'00000000-0000-4000-8000-000000000060',approvalId:'00000000-0000-4000-8000-000000000070',grantId:'00000000-0000-4000-8000-000000000080',connectionId:'00000000-0000-4000-8000-000000000090'};
const decide=(id:string,decision:unknown='allow')=>app.inject({method:'POST',url:`/v1/nylra/approvals/${id}/decide`,headers:bearer,payload:{commandId:'00000000-0000-4000-8000-0000000000c4',decision}});

test('nylra_mock refuses a request without a bearer',async()=>{
 const response=await app.inject({method:'GET',url:'/v1/nylra/approvals'});assert.equal(response.statusCode,401);assert.deepEqual(response.json(),{code:'unauthorized'});
});
test('nylra_mock answers every planned operation and never shadows implemented routes',async()=>{
 for(const op of nylraOperations.filter(op=>op.transport==='http')){
  const url=op.path.replace(/\{(\w+)\}/g,(_,name:string)=>ids[name]!);
  const name=op.body&&Object.entries(S).find(([,schema])=>schema===op.body)![0];
  const payload=op.body?(name==='Empty'?{}:fixtures.valid[name!]):undefined;
  const response=await app.inject({method:op.method.toUpperCase() as 'GET',url,headers:bearer,payload:payload as object});
  assert.equal(response.statusCode,op.status==='planned'?200:404,op.operationId);
  if(op.status==='planned')assert.ok(Value.Check(op.ok,response.json()),op.operationId);
 }
});
test('nylra_mock refuses decided expired unknown approvals and invalid decisions',async()=>{
 for(const [id,code] of [[fixtures.mock.decidedApprovalId,'approval_already_decided'],[fixtures.mock.expiredApprovalId,'approval_expired']]){
  const response=await decide(id!);assert.equal(response.statusCode,409);assert.deepEqual(response.json(),{code});
 }
 assert.equal((await decide('00000000-0000-4000-8000-0000000000ff')).statusCode,404);
 for(const decision of ['approve',123]){const response=await decide(ids.approvalId!,decision);assert.equal(response.statusCode,400);assert.deepEqual(response.json(),{code:'request_invalid'});}
});
test('nylra_mock malformed JSON uses the shared refusal shape',async()=>{
 const response=await app.inject({method:'POST',url:`/v1/nylra/approvals/${ids.approvalId}/decide`,headers:{...bearer,'content-type':'application/json'},payload:'{'});
 assert.equal(response.statusCode,400);assert.deepEqual(response.json(),{code:'request_invalid'});
});
test('nylra_mock denial returns the denied approval fixture',async()=>{
 const response=await decide(ids.approvalId!,'deny');assert.equal(response.statusCode,200);assert.ok(Value.Check(S.Approval,response.json()));assert.equal(response.json().state,'denied');assert.deepEqual(response.json().decidedBy,{kind:'person'});
});
test('nylra_mock refuses invalid response fixtures without exposing credential fields',async()=>{
 const invalid=structuredClone(fixtures);invalid.valid.ApprovalList={...(fixtures.valid.ApprovalList as object),apiKey:'synthetic-invalid-output-key'};
 const probe=buildNylraMock(invalid);try{const response=await probe.inject({method:'GET',url:'/v1/nylra/approvals',headers:bearer});assert.equal(response.statusCode,503);assert.deepEqual(response.json(),{code:'operation_failed'});}finally{await probe.close();}
});
