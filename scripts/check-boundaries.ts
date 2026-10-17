import ts from 'typescript';
import { readFile,readdir } from 'node:fs/promises';
import { dirname,resolve,relative } from 'node:path';
export async function sourceFiles(root='src'):Promise<string[]> {
 const entries=await readdir(root,{withFileTypes:true});const nested=await Promise.all(entries.map(e=>e.isDirectory()?sourceFiles(resolve(root,e.name)):Promise.resolve(e.name.endsWith('.ts')?[resolve(root,e.name)]:[])));return nested.flat().sort();
}
const configPath=ts.findConfigFile('.',ts.sys.fileExists,'tsconfig.json')!;
const options=ts.parseJsonConfigFileContent(ts.readConfigFile(configPath,ts.sys.readFile).config,ts.sys,dirname(resolve(configPath))).options;
export function inspectBoundary(path:string,text:string,compilerOptions:ts.CompilerOptions=options):string[] {
 const source=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true),failures:string[]=[];
 function visit(node:ts.Node) {
  let target:ts.Expression|undefined;
  if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) target=node.moduleSpecifier;
  if(ts.isCallExpression(node) && (node.expression.kind===ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression)&&node.expression.text==='require'))) target=node.arguments[0];
  if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument)) target=node.argument.literal;
  if(target) {
   if(!ts.isStringLiteral(target)) {failures.push('computed_import');}
   else {
    const resolved=ts.resolveModuleName(target.text,path,compilerOptions,ts.sys).resolvedModule?.resolvedFileName;
    const targetPath=resolved?relative(resolve('src'),resolve(resolved)).replaceAll('\\','/'):target.text;
    const current=relative(resolve('src'),resolve(path)).replaceAll('\\','/');
    const owner=/^modules\/([^/]+)\//.exec(targetPath)?.[1],caller=/^modules\/([^/]+)\//.exec(current)?.[1];
    if(owner && owner!==caller && !targetPath.endsWith('/index.ts')) failures.push('private_module_import');
    if(caller && /^(transports|app)\//.test(targetPath)) failures.push('reverse_dependency');
    if(current.endsWith('/model.ts') && !targetPath.startsWith('modules/')) failures.push('impure_model');
   }
  }
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression) && ['selectFrom','insertInto','updateTable','deleteFrom'].includes(node.expression.name.text)) {
   const current=relative(resolve('src'),resolve(path)).replaceAll('\\','/'),table=node.arguments[0];
   if(!current.endsWith('/store.ts')) failures.push('non_store_query');
   const owner=/^modules\/([^/]+)\//.exec(current)?.[1];
   if(!table || !ts.isStringLiteral(table) || !(owner==='identity'?table.text.startsWith('identity_'):(owner==='devices'&&table.text==='devices')||(owner==='activity'&&['activity_cursors','activity_events'].includes(table.text))||(owner==='links'&&['links_laptops','links_pairing_codes','links_claim_commands','links_rate_windows','links_ingress_receipts'].includes(table.text))||(owner==='provider-settings'&&['provider_settings_connections','provider_settings_accounts'].includes(table.text))||(owner==='sessions'&&['sessions_sessions','sessions_steps','sessions_events'].includes(table.text)))) failures.push('foreign_table');
  }
  ts.forEachChild(node,visit);
 }
 visit(source);return failures;
}
export async function checkBoundaries() {
 const failures:string[]=[];for(const path of await sourceFiles()) for(const failure of inspectBoundary(path,await readFile(path,'utf8'))) failures.push(relative('.',path)+':'+failure);
 return failures;
}
