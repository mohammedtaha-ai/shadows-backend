import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';
import {compose} from '../../src/app/compose.js';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {localSession} from './fixtures/local-sidecar.js';

test('account_stream_durable_other_publisher_cutover_and_revoke',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 const controller=new AbortController();try{
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');await app.links.claim(phone.principal,randomUUID(),code.code);
  const lease=await app.links.open(native.principal,randomUUID(),0);const cursor=(await app.links.list(phone.principal)).cursor;
  await app.start();const address=app.server.server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
  const response=await fetch(`${base}/v1/nylra/events?after=${cursor}`,{headers:{authorization:`Bearer ${phone.handle}`},signal:controller.signal});assert.equal(response.status,200);
  const reader=response.body!.getReader();let text='';
  const publisher=fork(new URL('./fixtures/activity-publisher.ts',import.meta.url),[],{execArgv:['--import','tsx'],stdio:['ignore','ignore','ignore','ipc']});
  const committed=once(publisher,'message'),exited=once(publisher,'exit');
  publisher.send({url:f.url,accountId:phone.principal.accountId,change:{type:'laptop_online',laptopId:lease.laptopId,sessionId:null,payload:{laptop:{laptopId:lease.laptopId,name:'A',status:'online',lastSeenAt:f.now.toISOString()}},expiresAt:new Date(f.now.getTime()+86400000).toISOString()}});
  await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]);
  assert.deepEqual((await committed)[0],{result:'committed'});assert.equal((await exited)[0],0);
  while((text.match(/^id:/gm)?.length??0)<2){const part=await reader.read();assert.equal(part.done,false);text+=new TextDecoder().decode(part.value);}
  assert.deepEqual([...text.matchAll(/^id: (\d+)$/gm)].map(m=>Number(m[1])),[cursor+1,cursor+2]);
  await f.devices.revoke(native.principal,phone.principal.deviceId);
  for(;;){const part=await reader.read();if(part.done)break;assert.equal(new TextDecoder().decode(part.value).includes('data:'),false);}
  assert.equal((await fetch(`${base}/v1/nylra/laptops`,{headers:{authorization:`Bearer ${phone.handle}`}})).status,401);
 }finally{controller.abort();await app.stop();await f.close();}
});

test('account_stream_revocation_between_persisted_read_and_delivery_closes_without_payload',async()=>{
 const f=await identityFixture(),app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now}),controller=new AbortController();
 try{
  const native=await f.login(),phone=await f.login(),code=await app.links.issueCode(native.principal,'A');await app.links.claim(phone.principal,randomUUID(),code.code);
  const lease=await app.links.open(native.principal,randomUUID(),0),cursor=(await app.links.list(phone.principal)).cursor;
  await app.start();const a=app.server.server.address();assert.ok(a&&typeof a!=='string');const base=`http://127.0.0.1:${a.port}`;
  const response=await fetch(`${base}/v1/nylra/events?after=${cursor}`,{headers:{authorization:`Bearer ${phone.handle}`},signal:controller.signal});assert.equal(response.status,200);
  const reader=response.body!.getReader();const pending=reader.read();
  let entered!:()=>void,release!:()=>void,held=false;const waiting=new Promise<void>(r=>{entered=r;}),barrier=new Promise<void>(r=>{release=r;});
  const read=app.activity.read;app.activity.read=async(...args)=>{const page=await read(...args);if(page.events.length&&!held){held=true;entered();await barrier;}return page;};
  await app.sessions.ingest(native.principal,lease,[{seq:1,event:{...localSession,at:f.now.toISOString()}}]);await waiting;
  await f.devices.revoke(phone.principal,native.principal.deviceId);release();
  assert.equal((await pending).done,true);
  assert.equal((await fetch(`${base}/v1/nylra/events?after=${cursor}`,{headers:{authorization:`Bearer ${phone.handle}`}})).status,410);
 }finally{controller.abort();await app.stop();await f.close();}
});
