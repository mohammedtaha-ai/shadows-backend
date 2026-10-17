import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { inspectBoundary,checkBoundaries } from '../../scripts/check-boundaries.js';
test('transport_cannot_import_private_store relative_alias_dynamic_bypasses',async()=>{
 const path=resolve('src/transports/http/example.ts');
 for(const specifier of ['../../modules/identity/store.js','../../modules/identity/store','../../modules/identity/../identity/store.ts']) {
  assert.ok(inspectBoundary(path,`import { IdentityStore } from '${specifier}';`).includes('private_module_import'));
  assert.ok(inspectBoundary(path,`const store=await import('${specifier}');`).includes('private_module_import'));
 }
 assert.ok(inspectBoundary(path,"import { IdentityStore } from '@identity/store.js';",{baseUrl:resolve('.'),paths:{'@identity/*':['src/modules/identity/*']}}).includes('private_module_import'));
 assert.deepEqual(inspectBoundary(path,"import { createIdentity } from '../../modules/identity/index.js';"),[]);
 assert.deepEqual(await checkBoundaries(),[]);
});
test('service_cannot_query_foreign_store_or_tables',()=>{
 const path=resolve('src/modules/devices/service.ts');
 assert.ok(inspectBoundary(path,"db.selectFrom('identity_accounts');").includes('foreign_table'));
 assert.ok(inspectBoundary(path,"db.selectFrom('devices');").includes('non_store_query'));
 assert.ok(inspectBoundary(resolve('src/modules/identity/store.ts'),"db.updateTable('devices');").includes('foreign_table'));
 assert.ok(inspectBoundary(resolve('src/modules/identity/store.ts'),"db.updateTable('activity_events');").includes('foreign_table'));
 assert.ok(inspectBoundary(resolve('src/modules/activity/service.ts'),"import {Session} from '../../transports/http/nylra-schema.js';").includes('reverse_dependency'));
});
