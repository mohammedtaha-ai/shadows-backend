// NON-PRODUCT child worker. Connection configuration enters through stdin, never logs.
import pg from 'pg';
import { PgBoss } from 'pg-boss';
import { applyOrReplayRemote } from './remote-fixture.mjs';
let connectionString = ''; for await (const part of process.stdin) connectionString += part;
const boss = new PgBoss({ connectionString, schema: 'b0_jobs', supervise: false }); boss.on('error', () => {}); await boss.start();
const [job] = await boss.fetch('delivery'); if (!job) process.exit(72);
const remote = new pg.Client({ connectionString }); await remote.connect();
await applyOrReplayRemote(remote, job.data.id, job.data.fingerprint);
// Deliberately skip graceful shutdown and job acknowledgement.
process.exit(73);
