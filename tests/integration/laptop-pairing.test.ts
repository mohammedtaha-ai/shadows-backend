import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {identityFixture} from './fixtures/identity.js';

test('laptop_pairing_one_use_expiry_reissue_replay_limits_and_account_scope',async()=>{
 const f=await identityFixture();try {
  assert.equal((await f.pool.query("SELECT to_regclass('links_laptops') AS name")).rows[0].name,'links_laptops');
  const {relayServices}=await import('./fixtures/relay.js');const {links,activity}=relayServices(f);
  const native=await f.login(),phone=await f.login();
  const a=await links.issueCode(native.principal,'A'),b=await links.issueCode(native.principal,'B');
  assert.equal(JSON.stringify((await f.pool.query('SELECT * FROM links_pairing_codes')).rows).includes(b.code),false);
  await assert.rejects(links.claim(phone.principal,randomUUID(),a.code),/link_code_invalid/);
  f.setSubject('foreign');const foreign=await f.login();
  await assert.rejects(links.claim(foreign.principal,randomUUID(),b.code),/link_code_invalid/);
  const commands=[randomUUID(),randomUUID()];const winners=await Promise.allSettled(commands.map(command=>links.claim(phone.principal,command,b.code)));
  assert.equal(winners.filter(x=>x.status==='fulfilled').length,1);
  const command=commands[winners.findIndex(x=>x.status==='fulfilled')]!;
  const laptop=await links.claim(phone.principal,command,b.code);
  assert.equal((await links.claim(phone.principal,command,b.code)).laptopId,laptop.laptopId);
  await assert.rejects(links.claim(phone.principal,command,a.code),/command_conflict/);
  assert.equal((await links.list(phone.principal)).laptops.length,1);
  assert.equal((await links.list(foreign.principal)).laptops.length,0);
  const c=await links.issueCode(native.principal,'C');
  await assert.rejects(relayServices(f).links.issueCode(native.principal,'D'),/rate_limited/);
  f.advance(5*60000);await assert.rejects(links.claim(phone.principal,randomUUID(),c.code),/link_code_invalid/);
  const cursor=(await links.list(phone.principal)).cursor;
  await links.unlink(phone.principal,laptop.laptopId);
  await assert.rejects(f.db.transaction().execute(tx=>activity.read(tx,phone.principal.accountId,cursor-1,100)),/resnapshot_required/);
  const d=await links.issueCode(native.principal,'D');const replacement=await links.claim(phone.principal,randomUUID(),d.code);
  assert.notEqual(replacement.laptopId,laptop.laptopId);
  f.advance(60000); // Start a new rate window, separate from the expired-code attempt.
  for(let i=0;i<5;i++)await assert.rejects(links.claim(phone.principal,randomUUID(),'ZZZZ-ZZZZ'),/link_code_invalid/);
  await assert.rejects(relayServices(f).links.claim(phone.principal,randomUUID(),'ZZZZ-ZZZZ'),/rate_limited/);
 }finally{await f.close();}
});

test('laptop_pairing_account_cap_and_issuance_limit_survive_restart',async()=>{
 const f=await identityFixture();try{
  const {relayServices}=await import('./fixtures/relay.js');const phone=await f.login();
  const natives=await Promise.all(Array.from({length:21},()=>f.login()));
  const codes=[];
  for(let i=0;i<10;i++)codes.push(await relayServices(f).links.issueCode(natives[i]!.principal,'Synthetic'));
  await assert.rejects(relayServices(f).links.issueCode(natives[10]!.principal,'Synthetic'),/rate_limited/);
  for(let i=0;i<20;i++){
   if(i===10)f.advance(60000);
   const code=i<10?codes[i]! : await relayServices(f).links.issueCode(natives[i]!.principal,'Synthetic');
   await relayServices(f).links.claim(phone.principal,randomUUID(),code.code);
  }
  f.advance(60000);const code=await relayServices(f).links.issueCode(natives[20]!.principal,'Overflow');
  await assert.rejects(relayServices(f).links.claim(phone.principal,randomUUID(),code.code),/rate_limited/);
  assert.equal((await relayServices(f).links.list(phone.principal)).laptops.length,20);
 }finally{await f.close();}
});
