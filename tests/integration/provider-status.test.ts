import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityFixture } from './fixtures/identity.js';
import { hash } from '../../src/modules/identity/index.js';
import { compose } from '../../src/app/compose.js';

test('provider_inactive_or_unavailable_refuses_existing_session_and_pending_return',async()=>{
 const f=await identityFixture();
 try {
  const grant=await f.login(),p=await f.pending(),r=await f.identity.finishLogin(p.callback);
  Object.assign(f.oidc,{isSessionActive:async()=>false});
  assert.equal(await f.identity.authenticate(grant.handle),null);
  await assert.rejects(f.devices.list(grant.principal),{message:'device_refused'});
  await assert.rejects(f.identity.redeemReturn({ticket:r.ticket,returnVerifier:p.returnVerifier,enrollment:{mode:'new'}}),{message:'return_refused'});
  assert.equal((await f.pool.query('SELECT consumed_at FROM identity_return_tickets WHERE ticket_hash=$1',[hash(r.ticket)])).rows[0].consumed_at,null);
  Object.assign(f.oidc,{isSessionActive:async()=>{throw new Error('synthetic-provider-unavailable');}});
  assert.equal(await f.identity.authenticate(grant.handle),null);
 }finally{await f.close();}
});

test('provider_outage_does_not_block_local_revocation_routes',async()=>{
 const f=await identityFixture();const app=await compose(f.config,{oidc:f.oidc,clock:()=>f.now});
 try {
  const a=await f.login(),b=await f.login(),c=await f.login();
  Object.assign(f.oidc,{isSessionActive:async()=>{throw new Error('synthetic-provider-unavailable');}});
  assert.equal((await app.server.inject({url:'/v1/auth/session',headers:{authorization:`Bearer ${a.handle}`}})).statusCode,401);
  const logout=await app.server.inject({method:'POST',url:'/v1/auth/logout',headers:{authorization:`Bearer ${a.handle}`},payload:{}});
  assert.equal(logout.statusCode,200);assert.equal(logout.json().local,'revoked');assert.equal(logout.json().provider,'pending');
  const device=await app.server.inject({method:'DELETE',url:`/v1/devices/${b.principal.deviceId}`,headers:{authorization:`Bearer ${c.handle}`}});assert.equal(device.statusCode,200);
  const all=await app.server.inject({method:'POST',url:'/v1/auth/logout-all',headers:{authorization:`Bearer ${c.handle}`},payload:{}});assert.equal(all.statusCode,200);
  Object.assign(f.oidc,{isSessionActive:async()=>true});
  for(const grant of [a,b,c])assert.equal(await f.identity.authenticate(grant.handle),null);
 }finally{await app.stop();await f.close();}
});
