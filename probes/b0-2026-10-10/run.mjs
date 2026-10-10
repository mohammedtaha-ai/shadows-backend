// NON-PRODUCT B0 ledger: continue independent probes, preserve nonzero failures.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const runs = [];
for (const file of ['versions.mjs', 'availability.mjs', 'http.mjs', 'database.mjs', 'ai.mjs', 'oidc.mjs']) {
 const child = spawn(process.execPath, [file], { stdio: 'inherit' });
 const exit = await new Promise(r => child.on('exit', r)); runs.push({ file, exit });
}
await writeFile('artifacts/run-results.json', JSON.stringify(runs, null, 2));
if (runs.some(r => r.exit !== 0)) process.exitCode = 1;
