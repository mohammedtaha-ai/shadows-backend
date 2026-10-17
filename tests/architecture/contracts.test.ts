import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import YAML from 'yaml';
import ts from 'typescript';
import { sourceFiles } from '../../scripts/check-boundaries.js';
const paths=['src/app','src/platform/database','src/modules/identity','src/modules/devices','src/modules/activity','src/modules/links','src/modules/sessions','src/modules/provider-settings','src/integrations/providers','src/transports/http','src/transports/laptop-link'];
test('contracts_reference_real_symbols_tests source_coverage',async()=>{
 for(const path of paths) {
  const contract=YAML.parse(await readFile(resolve(path,'contract.yaml'),'utf8'));
  assert.equal(contract.status,'current');assert.equal(contract.source,path);assert.ok((await stat(path)).isDirectory());
  const symbols=new Set<string>();
  for(const file of await sourceFiles(path)) {
   const source=ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true);
   function visit(node:ts.Node){if('name' in node && node.name && (ts.isIdentifier(node.name as ts.Node)||ts.isStringLiteral(node.name as ts.Node))) symbols.add((node.name as ts.Identifier).text);ts.forEachChild(node,visit);}visit(source);
  }
  for(const symbol of Object.keys(contract.public_api)) assert.ok(symbols.has(symbol),`${path}: unresolved symbol ${symbol}`);
  for(const gap of contract.gaps??[]) assert.ok(symbols.has(gap.at),`${path}: unresolved gap ${gap.at}`);
  for(const obligation of contract.obligations) {
   if(['none','unknown'].includes(obligation.tested_by))continue;
   const file=/tests\/[a-zA-Z0-9/_.-]+\.test\.ts/.exec(obligation.note)?.[0];assert.ok(file);
   const text=await readFile(file,'utf8');assert.ok(text.includes(`'${obligation.tested_by}'`),`${path}: unresolved test`);
  }
 }
 for(const file of await sourceFiles()) assert.ok(file.endsWith('/src/main.ts')||paths.some(path=>file.startsWith(resolve(path)+'/')),'source without contract owner');
});
