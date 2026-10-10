import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = (await readdir('.')).filter(f => /\.(mjs|ts|yaml)$/.test(f) || ['package.json', 'package-lock.json', 'README.md', '.gitignore'].includes(f));
files.push(...(await readdir('migrations')).map(f => `migrations/${f}`));
const hashes = {}; for (const file of files.sort()) hashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('artifacts/provenance.json', JSON.stringify({ startingGitRevision: '599d49c2455d6afa822c1d0fc404ce82332fc113', startingBranch: 'main', startingWorktree: 'clean', generatedAt: new Date().toISOString(), files: hashes }, null, 2));
console.log(`Recorded ${Object.keys(hashes).length} retained source/setup hashes`);
