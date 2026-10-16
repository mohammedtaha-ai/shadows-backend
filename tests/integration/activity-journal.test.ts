import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {postgresFixture} from './fixtures/postgres.js';
import {runMigrations} from '../../src/platform/database/migrate.js';
import {createDatabase} from '../../src/platform/database/pool.js';

test('activity_journal_rollback_concurrency_scope_floor_expiry_and_overflow',async()=>{
 const f=await postgresFixture(); const {db}=createDatabase(f.url);
 try {
  await runMigrations(f.connection,'up');
  assert.equal((await f.pool.query("SELECT to_regclass('activity_cursors') AS name")).rows[0].name,'activity_cursors');
  const {createActivity}=await import('../../src/modules/activity/index.js');
  let now=new Date('2026-10-17T00:00:00Z');const activity=createActivity(db,()=>now);
  const account=randomUUID(),other=randomUUID(),laptop=randomUUID();
  const change={type:'laptop_online' as const,laptopId:laptop,sessionId:null,payload:{laptop:{laptopId:laptop,name:'A',status:'online',lastSeenAt:null}},expiresAt:new Date('2026-10-18T00:00:00Z')};
  await assert.rejects(db.transaction().execute(async tx=>{await activity.append(tx,account,[change]);throw new Error('rollback');}),/rollback/);
  const committed=await db.transaction().execute(tx=>activity.append(tx,account,[change]));
  assert.equal(committed[0]!.seq,1);
  assert.deepEqual((await db.transaction().execute(tx=>activity.read(tx,other,0,100))).events,[]);
  await Promise.all(Array.from({length:5},()=>db.transaction().execute(tx=>activity.append(tx,account,[change]))));
  assert.deepEqual((await db.transaction().execute(tx=>activity.read(tx,account,0,100))).events.map(e=>e.seq),[1,2,3,4,5,6]);
  await db.transaction().execute(tx=>activity.invalidateLaptop(tx,account,laptop));
  await assert.rejects(db.transaction().execute(tx=>activity.read(tx,account,0,100)),/resnapshot_required/);
  assert.equal((await db.transaction().execute(tx=>activity.append(tx,account,[change])))[0]!.seq,7);
  now=new Date('2026-10-19T00:00:00Z');await db.transaction().execute(tx=>activity.prune(tx,account,now));
  assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM activity_events')).rows[0].n,0);
  await assert.rejects(db.transaction().execute(tx=>activity.read(tx,account,6,100)),/resnapshot_required/);
  await f.pool.query('UPDATE activity_cursors SET high_water=$1 WHERE account_id=$2',[String(Number.MAX_SAFE_INTEGER),account]);
  await assert.rejects(db.transaction().execute(tx=>activity.append(tx,account,[change])),/cursor_exhausted/);
  assert.equal((await db.transaction().execute(tx=>activity.cursor(tx,account))),Number.MAX_SAFE_INTEGER);
 } finally {await db.destroy();await f.close();}
});
