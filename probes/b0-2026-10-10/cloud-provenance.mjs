// NON-PRODUCT cloud provenance. No environment values, provider requests or secret reads.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../../', import.meta.url);
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const hash = data => createHash('sha256').update(data).digest('hex');
const retained = git(['ls-files', 'probes/b0-2026-10-10/followup-artifacts']).split('\n');
const preservation = [];
for (const file of retained) {
  const before = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root });
  const after = await readFile(new URL(file, root));
  preservation.push({ file, baselineHash: hash(before), currentHash: hash(after), unchanged: hash(before) === hash(after) });
}
const manifest = JSON.parse(await readFile(new URL('package.json', import.meta.url), 'utf8'));
const packages = [];
for (const name of Object.keys(manifest.dependencies)) {
  const installed = JSON.parse(await readFile(new URL(`node_modules/${name}/package.json`, import.meta.url), 'utf8'));
  packages.push({ name, version: installed.version, license: installed.license });
}
const result = {
  runDate: '2026-10-11', timezone: 'Asia/Aden', observedAt: new Date().toISOString(),
  baseline: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']),
  initialWorktree: 'clean (observed before edits)', node: process.version,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
  platform: process.platform, arch: process.arch,
  dockerClientServer: '28.4.0', storageDriver: 'vfs',
  keycloak: '26.8.0', jvm: '21.0.12.1+1-LTS',
  image: 'quay.io/keycloak/keycloak:26.8.0',
  digest: 'sha256:27b3230fbabb8c9ff3c66c864cf09dcd8a41aca82e5100679d109ef0eeb05741',
  versionBasis: 'Explicit Docker local-socket info, bounded pull and isolated --version command recorded in report; no version command rerun by this recorder.',
  minimaxAdditionalCalls: 0, packages, preservation,
  lockfileUnchanged: !git(['diff', '--name-only', 'HEAD', '--', 'probes/b0-2026-10-10/package-lock.json']),
};
await writeFile(new URL('followup-artifacts/cloud-runtime.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ preservedArtifacts: preservation.length, allUnchanged: preservation.every(x => x.unchanged), lockfileUnchanged: result.lockfileUnchanged, packages: packages.length }));
if (preservation.some(x => !x.unchanged) || !result.lockfileUnchanged) process.exitCode = 1;
