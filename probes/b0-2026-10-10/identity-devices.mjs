// NON-PRODUCT disposable PG device/session lifecycle prototype, independent of issuer setup.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { authenticateFixture, revokeFixtureDevice, hash } from './identity-device-fixture.mjs';
const base=fileURLToPath(new URL('.',import.meta.url));assert.equal(resolve('.'),resolve(base));
const clusterPath=resolve(base,'.identity-cluster');assert.ok(clusterPath.startsWith(resolve(base)+sep),'cleanup stays inside this dedicated probe directory');
const password=randomUUID(),pgOptions={host:'127.0.0.1',port:45904,user:'b0',password,database:'b0_identity_followup'};
const cluster=new EmbeddedPostgres({databaseDir:clusterPath,user:'b0',password,port:45904,persistent:false,authMethod:'scram-sha-256',createPostgresUser:false,onLog:()=>{},onError:()=>{}});
let pool;const results=[];
async function freshProcess(handle){const c=spawn(process.execPath,['identity-device-child.mjs'],{stdio:['pipe','pipe','ignore']});let output='';c.stdout.on('data',p=>output+=p);c.stdin.end(JSON.stringify({pgOptions,handle}));const exit=await new Promise(r=>c.on('exit',r));assert.equal(exit,0);return JSON.parse(output).authenticated;}
try {
 await mkdir('followup-artifacts',{recursive:true});await cluster.initialise();await appendFile(resolve(clusterPath,'postgresql.conf'),"\nlisten_addresses='127.0.0.1'\n");await cluster.start();await cluster.createDatabase('b0_identity_followup');pool=new pg.Pool(pgOptions);
 await pool.query('CREATE TABLE fixture_device(id text PRIMARY KEY, account text NOT NULL, revoked_at timestamptz); CREATE TABLE fixture_session(handle_hash text PRIMARY KEY, account text NOT NULL, device text NOT NULL REFERENCES fixture_device(id), expires_at timestamptz NOT NULL, revoked_at timestamptz)');
 const handles=[randomUUID(),randomUUID()];await pool.query("INSERT INTO fixture_device VALUES ('d1','a',NULL),('d2','a',NULL)");for(let i=0;i<2;i++)await pool.query("INSERT INTO fixture_session VALUES ($1,'a',$2,now()+interval '1 hour',NULL)",[hash(handles[i]),`d${i+1}`]);
 assert.ok(await authenticateFixture(pool,handles[0]));await pool.end();pool=new pg.Pool(pgOptions);assert.equal(await freshProcess(handles[0]),true);
 await assert.rejects(revokeFixtureDevice(pool,'foreign','d1'),/foreign device refusal/);assert.ok(await authenticateFixture(pool,handles[0]));await revokeFixtureDevice(pool,'a','d1');assert.equal(await freshProcess(handles[0]),false);assert.equal(await freshProcess(handles[1]),true);
 await pool.query("UPDATE fixture_session SET expires_at=now()-interval '1 second' WHERE device='d2'");assert.equal(await freshProcess(handles[1]),false);
 const version=(await pool.query('SELECT version() AS version')).rows[0].version;
 results.push({name:'backend-owned device revocation and fresh-process session validation prototype',status:'PASS',observed:{version,persistedProcessRestart:true,revokedDeviceDenied:true,otherDeviceUnaffected:true,foreignRevocationDenied:true,expiredSessionDenied:true,scope:'non-product SQL policy prototype; no OIDC/token revocation or product acceptance'}});
}catch(e){results.push({name:'device/session prototype',status:'FAIL',errorType:e.name,errorCode:e.code??null});process.exitCode=1;}
finally{if(pool)await pool.end();await cluster.stop();await writeFile('followup-artifacts/identity-devices-results.json',JSON.stringify({date:'2026-10-11',database:'b0_identity_followup',port:45904,results},null,2));console.log(JSON.stringify(results));}
