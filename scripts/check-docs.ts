import { readFile,readdir,stat } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import YAML from 'yaml';
async function docs(root:string):Promise<string[]> {
 const entries=await readdir(root,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?docs(resolve(root,e.name)):Promise.resolve(/\.(md|yaml)$/.test(e.name)?[resolve(root,e.name)]:[])))).flat();
}
let files=0,external=0;const failures:string[]=[];
for(const path of [...await docs('docs'),...await docs('src'),resolve('README.md'),resolve('AGENTS.md')]) {
 const text=await readFile(path,'utf8');files++;
 if(path.endsWith('.yaml')) {YAML.parse(text);continue;}
 for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target=match[1]!.split('#')[0]!;if(!target || /^(https?:|mailto:)/.test(target))continue;
  const absolute=resolve(dirname(path),target);
  if(!absolute.startsWith(resolve('.')+'/')){external++;continue;}
  try{await stat(absolute);}catch{failures.push(path+':'+target);}
 }
}
if(failures.length){console.error(JSON.stringify({code:'docs_invalid',failures}));process.exitCode=1;}
else console.log(JSON.stringify({result:'PASS',files,externalSiblingLinksUnverified:external}));
