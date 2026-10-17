import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import {localSession,localStep} from './fixtures/local-sidecar.js';

test('session_stream_snapshot_replay_live_and_unlink_floor',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});const controller=new AbortController();
 try{
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');const laptop=await app.links.claim(phone.principal,randomUUID(),code.code);
  const lease=await app.links.open(native.principal,randomUUID(),0);await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]);
  const id=(await app.sessions.list(phone.principal)).sessions[0]!.sessionId;const snapshot=await app.sessions.snapshot(phone.principal,id);
  await app.start();const a=app.server.server.address();assert.ok(a&&typeof a!=='string');const base=`http://127.0.0.1:${a.port}`;
  await app.sessions.ingest(native.principal,lease,[{seq:2,event:{...localStep,at:f.now.toISOString()}}]);
  const response=await fetch(`${base}/v1/nylra/sessions/${id}/events?after=${snapshot.cursor}`,{headers:{authorization:`Bearer ${phone.handle}`},signal:controller.signal});assert.equal(response.status,200);
  const reader=response.body!.getReader();let text='';
  await app.sessions.ingest(native.principal,lease,[{seq:3,event:{...localStep,localStepId:'second',at:f.now.toISOString()}}]);
  while((text.match(/^id:/gm)?.length??0)<2){const part=await reader.read();assert.equal(part.done,false);text+=new TextDecoder().decode(part.value);}
  assert.deepEqual([...text.matchAll(/^id: (\d+)$/gm)].map(m=>Number(m[1])),[snapshot.cursor+1,snapshot.cursor+2]);
  await app.links.unlink(phone.principal,laptop.laptopId);
  while(!(await reader.read()).done){}
  assert.equal((await fetch(`${base}/v1/nylra/events?after=0`,{headers:{authorization:`Bearer ${phone.handle}`}})).status,410);
  assert.equal((await fetch(`${base}/v1/nylra/sessions/${id}`,{headers:{authorization:`Bearer ${phone.handle}`}})).status,404);
 }finally{controller.abort();await app.stop();await f.close();}
});

test('session_snapshot_fresh_authority_after_read_only_snapshot_barrier',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try{
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');await app.links.claim(phone.principal,randomUUID(),code.code);
  const lease=await app.links.open(native.principal,randomUUID(),0);await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]);
  const id=(await app.sessions.list(phone.principal)).sessions[0]!.sessionId;
  let entered!:()=>void,release!:()=>void;const waiting=new Promise<void>(r=>{entered=r;}),barrier=new Promise<void>(r=>{release=r;});
  const visible=app.links.visible;app.links.visible=async(...args)=>{const value=await visible(...args);entered();await barrier;return value;};
  const pending=app.server.inject({method:'GET',url:`/v1/nylra/sessions/${id}`,headers:{authorization:`Bearer ${phone.handle}`}});
  const result=Promise.resolve(pending);await waiting;await f.devices.revoke(phone.principal,native.principal.deviceId);release();
  assert.equal((await result).statusCode,401);app.links.visible=visible;
  assert.equal((await app.server.inject({method:'GET',url:`/v1/nylra/sessions/${id}`,headers:{authorization:`Bearer ${phone.handle}`}})).statusCode,404);
 }finally{await app.stop();await f.close();}
});
