import { readFile, writeFile, mkdir } from 'node:fs/promises';
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const entries = [];
for (const name of Object.keys(packageJson.dependencies ?? {})) {
 const p = JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8'));
 entries.push({ name, version: p.version, license: p.license, engines: p.engines ?? null });
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/versions.json', JSON.stringify({ node: process.version, platform: process.platform, architecture: process.arch, packages: entries }, null, 2));
console.log(JSON.stringify(entries));
