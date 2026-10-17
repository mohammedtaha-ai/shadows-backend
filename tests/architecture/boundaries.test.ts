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

test('provider_settings_store_is_the_only_owner_of_connection_and_default_tables', () => {
 const store=resolve('src/modules/provider-settings/store.ts');
 for(const table of ['provider_settings_connections','provider_settings_accounts']) {
  assert.deepEqual(inspectBoundary(store,`db.selectFrom('${table}');`),[]);
  assert.ok(inspectBoundary(resolve('src/modules/provider-settings/service.ts'),`db.selectFrom('${table}');`).includes('non_store_query'));
  assert.ok(inspectBoundary(resolve('src/modules/links/store.ts'),`db.selectFrom('${table}');`).includes('foreign_table'));
 }
 assert.ok(inspectBoundary(store,"db.selectFrom('identity_accounts');").includes('foreign_table'));
 const http=resolve('src/transports/http/example.ts');
 assert.ok(inspectBoundary(http,"import {ProviderSettingsStore} from '../../modules/provider-settings/store.js';").includes('private_module_import'));
 assert.deepEqual(inspectBoundary(http,"import {createProviderSettings} from '../../modules/provider-settings/index.js';"),[]);
});

test('provider_sdk_imports_are_limited_to_provider_adapters', () => {
 for(const specifier of ['ai','@ai-sdk/openai-compatible']) {
  assert.ok(inspectBoundary(resolve('src/modules/provider-settings/service.ts'),`import {x} from '${specifier}';`).includes('provider_sdk_dependency'));
  assert.ok(inspectBoundary(resolve('src/transports/http/example.ts'),`import {x} from '${specifier}';`).includes('provider_sdk_dependency'));
  assert.deepEqual(inspectBoundary(resolve('src/integrations/providers/openai-compatible.ts'),`import {x} from '${specifier}';`),[]);
 }
 assert.ok(inspectBoundary(resolve('src/modules/provider-settings/service.ts'),"import {x} from '@model';",{
  baseUrl:resolve('.'),paths:{'@model':['node_modules/ai/dist/index.d.ts']},
 }).includes('provider_sdk_dependency'));
});
