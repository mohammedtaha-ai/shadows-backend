import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { sourceFiles } from './check-boundaries.js';
const exec=promisify(execFile);
const changed=[...(await exec('git',['diff','--name-only'])).stdout.split('\n'),...(await exec('git',['ls-files','--others','--exclude-standard'])).stdout.split('\n')].filter(Boolean);
let findings=0;
for(const file of changed){const text=await readFile(file,'utf8');if(/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/.test(text)||/-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(text))findings++;}
for(const file of await sourceFiles()) {
 const text=await readFile(file,'utf8');
 if(/console\.(?:log|error|warn)\(/.test(text)&&!file.endsWith('/main.ts'))findings++;
 if(/(?:encryptionKey|clientSecret|password|refreshToken|idToken)\s*:\s*['"][^'"]+['"]/.test(text))findings++;
}
console.log(JSON.stringify({result:findings?'FAIL':'PASS',files:changed.length,findings}));if(findings)process.exitCode=1;
