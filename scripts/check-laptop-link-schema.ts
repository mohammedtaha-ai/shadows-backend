import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { laptopLinkArtifacts } from './export-laptop-link-schema.js';
export async function checkLaptopLinkArtifacts(root='.'):Promise<void> {
  const artifacts=await laptopLinkArtifacts();
  for(const [name,text] of [['laptop-link-v1.schema.json',artifacts.schema],['laptop-link-v1.d.ts',artifacts.declarations]])
    if(await readFile(resolve(root,'api',name!),'utf8')!==text) throw new Error('artifact_drift');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await checkLaptopLinkArtifacts();
