import { mkdir, writeFile } from 'node:fs/promises';
export const results = [];
export async function check(name, fn) {
  try { const observed = await fn(); results.push({ name, status: 'PASS', observed }); console.log(`PASS ${name}: ${JSON.stringify(observed)}`); }
  catch (e) { const assertion = e.name === 'AssertionError' ? e.message : undefined; results.push({ name, status: 'FAIL', errorType: e.name, code: e.code ?? null, assertion }); console.log(`FAIL ${name}: ${e.name} (${e.code ?? 'assertion/runtime failure'})${assertion ? ': ' + assertion : ''}`); process.exitCode = 1; }
}
export async function save(name) { await mkdir('artifacts', { recursive: true }); await writeFile(`artifacts/${name}.json`, JSON.stringify(results, null, 2)); }
