import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';

test('laptop_lease_persisted_checkpoint_epoch_and_revocation',async()=>{
 const f=await identityFixture();try{
  assert.equal((await f.pool.query("SELECT to_regclass('links_ingress_receipts') AS name")).rows[0].name,'links_ingress_receipts');
  const {relayServices}=await import('./fixtures/relay.js');const {links}=relayServices(f);
  const native=await f.login(),phone=await f.login();const code=await links.issueCode(native.principal,'A');
  const laptop=await links.claim(phone.principal,randomUUID(),code.code),producer=randomUUID();
  const old=await links.open(native.principal,producer,0);
  await f.db.transaction().execute(async tx=>{await links.requireConnection(tx,native.principal,old);await links.commitReceipts(tx,old,[{seq:1,fingerprint:'hash',dropped:false,expiresAt:new Date(f.now.getTime()+86400000)}]);});
  const current=await links.open(native.principal,producer,0);assert.equal(current.ackThrough,1);assert.ok(current.epoch>old.epoch);
  await links.close(old);assert.equal((await links.list(phone.principal)).laptops[0]!.status,'online');
  await assert.rejects(f.db.transaction().execute(tx=>links.requireConnection(tx,native.principal,old)),/unauthorized/);
  await assert.rejects(links.open(native.principal,randomUUID(),0),/resnapshot_required/);
  await assert.rejects(links.open(native.principal,producer,2),/resnapshot_required/);
  await assert.rejects(links.open(phone.principal,producer,0),/not_found/);
  f.oidc.isSessionActive=async()=>{throw new Error('synthetic outage');};
  await assert.rejects(links.list(phone.principal));
  await links.unlink(phone.principal,laptop.laptopId);
  f.oidc.isSessionActive=async()=>true;
  await assert.rejects(links.open(native.principal,producer,1),/not_found/);
  await links.close(current);assert.deepEqual((await links.list(phone.principal)).laptops,[]);
 }finally{await f.close();}
});
