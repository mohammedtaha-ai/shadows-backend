import { readFile,mkdtemp,writeFile,rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { authSchema } from './export-auth-schema.js';
import { output,NativeLogin,ReturnRequest } from '../src/transports/http/auth-schema.js';
const directory=await mkdtemp(resolve('.test-runtime/schema-'));
try {
 const actual=await authSchema();assert.equal(actual,await readFile('api/auth-v1.openapi.json','utf8'));
 for(const [schema,value] of [[NativeLogin,{platform:'android'}],[ReturnRequest,{ticket:'short',returnVerifier:'short'}]] as const) assert.throws(()=>output(schema,value));
 await writeFile(resolve(directory,'schema.json'),actual);
 await promisify(execFile)(resolve('node_modules/.bin/openapi-typescript'),[resolve(directory,'schema.json'),'-o',resolve(directory,'schema.d.ts')]);
 assert.equal(await readFile(resolve(directory,'schema.d.ts'),'utf8'),await readFile('api/auth-v1.d.ts','utf8'));
 console.log('auth schema snapshots and negative samples: PASS');
}finally{await rm(directory,{recursive:true,force:true});}
