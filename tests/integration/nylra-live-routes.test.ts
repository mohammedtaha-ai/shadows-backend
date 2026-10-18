import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Value} from '@sinclair/typebox/value';
import Fastify from 'fastify';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import * as S from '../../src/transports/http/nylra-schema.js';
import {nylraOperations} from '../../src/transports/http/nylra-paths.js';
import {authSchema} from '../../scripts/export-auth-schema.js';
import {readFile} from 'node:fs/promises';

test('nylra_live_routes_registry_coverage_strict_cursor_errors_and_auth_isolation',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  const native=await f.login(),phone=await f.login();const headers={authorization:`Bearer ${native.handle}`},phoneHeaders={authorization:`Bearer ${phone.handle}`};
  const issue=await app.server.inject({method:'POST',url:'/v1/nylra/laptops/pairing-code',headers,payload:{name:'Synthetic'}});
  assert.equal(issue.statusCode,200);assert.ok(Value.Check(S.PairingCodeIssued,issue.json()));
  assert.equal((await app.server.inject({method:'GET',url:'/v1/nylra/laptops'})).statusCode,401);
  const claim=await app.server.inject({method:'POST',url:'/v1/nylra/laptops/claim',headers:phoneHeaders,payload:{commandId:randomUUID(),code:issue.json().code}});assert.equal(claim.statusCode,200);
  const list=await app.server.inject({method:'GET',url:'/v1/nylra/laptops',headers:phoneHeaders});assert.ok(Value.Check(S.LaptopList,list.json()));assert.equal(list.json().laptops.length,1);
  for(const after of ['-1','1e2','9007199254740993','','01'])assert.equal((await app.server.inject({method:'GET',url:`/v1/nylra/events?after=${after}`,headers:phoneHeaders})).statusCode,400);
  assert.equal((await app.server.inject({method:'GET',url:'/v1/nylra/events?after=1',headers:phoneHeaders})).statusCode,410);
  assert.equal((await app.server.inject({method:'POST',url:'/v1/nylra/laptops/claim',headers:phoneHeaders,payload:{commandId:randomUUID(),code:'ZZZZ-ZZZZ'}})).statusCode,400);
  assert.equal((await app.server.inject({method:'GET',url:'/v1/nylra/topics',headers:phoneHeaders})).statusCode,200);
  assert.equal(await authSchema(),await readFile('api/auth-v1.openapi.json','utf8'));
  const {registerNylra,assertNylraBindings}=await import('../../src/transports/http/nylra-routes.js');
  const observed:any[]=[];const probe=Fastify();probe.addHook('onRoute',route=>{if(route.method!=='HEAD')observed.push(route);});
  await registerNylra(probe,app);await probe.ready();
  assertNylraBindings(observed);
  assert.throws(()=>assertNylraBindings(observed.map((r,i)=>i===0?{...r,method:'DELETE'}:r)),/binding_drift/);
  assert.throws(()=>assertNylraBindings(observed.map((r,i)=>i===0?{...r,schema:{...r.schema,body:S.Empty}}:r)),/binding_drift/);
  for(const op of nylraOperations.filter(op=>op.transport==='http'&&op.status==='implemented'))assert.ok(observed.find(r=>r.schema.operationId===op.operationId));
  await probe.close();
 }finally{await app.stop();await f.close();}
});
