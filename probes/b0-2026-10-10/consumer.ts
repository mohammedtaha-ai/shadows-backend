// NON-PRODUCT. Types generated from the Fastify OpenAPI artifact.
import createClient from 'openapi-fetch';
import type { paths } from './artifacts/schema.js';
const client = createClient<paths>({ baseUrl: 'http://127.0.0.1:45871' });
const body: paths['/probe']['post']['requestBody']['content']['application/json'] = { id: 'fixture', revision: 1 };
// @ts-expect-error schema-derived consumer refuses a string revision
const invalid: typeof body = { id: 'fixture', revision: '1' };
void invalid;
export async function consume() { const result = await client.POST('/probe', { body }); return result.data?.revision; }
consume().then(value => { if (value !== 1) throw new Error('TypeScript HTTP consumer mismatch'); console.log('PASS TypeScript schema-derived HTTP consumer'); }).catch(() => { process.exitCode = 1; });
