// NON-PRODUCT pre-publication checks. Never print known secret values or matching content.
import { loadEnvFile } from 'node:process';
import { execFileSync } from 'node:child_process';
import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
const cloud=process.argv.includes('--cloud');
const root=resolve('../..'),output=cloud?'followup-artifacts/cloud-checks.json':'followup-artifacts/checks.json';
await mkdir('followup-artifacts',{recursive:true});await writeFile(output,'{}\n');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const split=s=>s?s.split(/\r?\n/):[];
const candidates=[...new Set([...split(git(['diff','--name-only','HEAD'])),...split(git(['ls-files','--others','--exclude-standard']))])];
const knownSecrets=[process.env.API_KEY,process.env.MINIMAX_API_KEY].filter(Boolean);
if(!knownSecrets.length){try{loadEnvFile(new URL('../../.env',import.meta.url));if(process.env.API_KEY)knownSecrets.push(process.env.API_KEY);}catch{/* Optional local compatibility, never another credential source. */}}
const scanned=[...new Set([...split(git(['ls-files'])),...candidates])];
let secretMatchCount=0;
for(const file of scanned){const data=await readFile(resolve(root,file),'utf8');if(knownSecrets.some(secret=>data.includes(secret))||/Bearer\s+[A-Za-z0-9_=-]{20,}/.test(data)||/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{12,}/.test(data))secretMatchCount++;}
if(git(['ls-files','--','.env']))secretMatchCount++;
const docs=split(execFileSync('rg',['--files','--glob','*.md','--glob','*.yaml','--glob','!node_modules/**'],{cwd:root,encoding:'utf8'}).trim());
const slug=s=>s.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu,'').replace(/\s/g,'-');
let links=0,yaml=0;const broken=[],missingExternal=[];
for(const file of docs){const path=resolve(root,file),body=await readFile(path,'utf8');if(file.endsWith('.yaml')){YAML.parse(body);yaml++;continue;}for(const m of body.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)){const target=m[1];if(/^(https?:|mailto:|app:|codex:)/.test(target)||target.includes('<run-date>'))continue;const [local,fragment]=target.split('#'),dest=local?resolve(dirname(path),decodeURIComponent(local)):path;try{await access(dest);if(fragment&&dest.endsWith('.md')){const text=await readFile(dest,'utf8');if(![...text.matchAll(/^#{1,6}\s+(.+)$/gm)].some(h=>slug(h[1].replace(/\r$/,''))===decodeURIComponent(fragment)))throw new Error('anchor');}links++;}catch(error){if(cloud&&error.code==='ENOENT'&&!dest.startsWith(root+'/'))missingExternal.push({file,target});else broken.push({file,target});}}}
const syntax=[];for(const file of candidates.filter(f=>f.endsWith('.mjs'))){try{execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'});syntax.push({file,status:'PASS'});}catch{syntax.push({file,status:'FAIL'});}}
const hashes={};for(const file of candidates.filter(f=>resolve(root,f)!==resolve(output)).sort())hashes[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
const result={date:'2026-10-11',baseline:cloud?'1b334c5968ed9014e7f53136672f2af1c34b73a3':'166cf7539a0919523b5e4425f83e41238df3509b',node:process.version,candidateFiles:candidates.length,knownSecretComparison:knownSecrets.length?'PASS (runtime-only comparison)':'UNAVAILABLE; pattern scan only',scannedFiles:scanned.length,secretMatchCount,localLinks:links,brokenLinks:broken,missingExternalLinks:missingExternal,yamlParsed:yaml,syntax,sourceHashes:hashes,limitations:['Static syntax/links/YAML and literal secret comparison only; not a security audit or runtime conformance proof.','Static checks infer no product/native acceptance. Missing sibling links are separately reported cloud prerequisites.']};
await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({candidateFiles:result.candidateFiles,knownSecretComparison:result.knownSecretComparison,secretMatchCount,localLinks:links,brokenLinks:broken,missingExternalLinks:missingExternal.length,yamlParsed:yaml,syntaxFailures:syntax.filter(x=>x.status==='FAIL').length}));
if(secretMatchCount||broken.length||syntax.some(x=>x.status==='FAIL'))process.exitCode=1;
