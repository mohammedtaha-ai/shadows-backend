// NON-PRODUCT bounded local Markdown target/anchor and YAML syntax check.
import { execFileSync } from 'node:child_process';
import { readFile, access, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import YAML from 'yaml';
const root = resolve('../..');
const files = execFileSync('rg', ['--files', '--glob', '*.md', '--glob', '*.yaml', '--glob', '!node_modules/**'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
let links = 0, yaml = 0; const failures = [];
const anchor = text => text.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
for (const file of files) {
 const path = resolve(root, file), body = await readFile(path, 'utf8');
 if (file.endsWith('.yaml')) { YAML.parse(body); yaml++; continue; }
 for (const m of body.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
   const target = m[1]; if (/^(https?:|mailto:|app:|codex:)/.test(target) || target.includes('<run-date>')) continue;
   const [local, fragment] = target.split('#'); const dest = local ? resolve(dirname(path), decodeURIComponent(local)) : path;
   try { await access(dest); if (fragment && dest.endsWith('.md')) { const text = await readFile(dest, 'utf8'); const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(h => anchor(h[1].replace(/\r$/, ''))); if (!headings.includes(decodeURIComponent(fragment))) throw Error('missing anchor'); } links++; }
   catch { failures.push({ file, target }); }
 }
}
const result = { markdownFiles: files.filter(x => x.endsWith('.md')).length, localLinks: links, yamlParsed: yaml, failures, externalURLs: 'references only; not a reachability guarantee' };
await writeFile('artifacts/docs-check.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); if (failures.length) process.exitCode = 1;
