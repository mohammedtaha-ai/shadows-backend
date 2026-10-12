import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { nylraOperations } from '../src/transports/http/nylra-paths.js';
import * as S from '../src/transports/http/nylra-schema.js';

// Every exported object/union schema is one named component; a use of the same
// TypeBox value becomes a $ref, so the document stays readable for generators.
const named = new Map<object, string>(Object.entries(S)
  .filter(([, value]) => typeof value === 'object' && value !== null && ('properties' in value || 'anyOf' in value))
  .map(([name, value]) => [value as object, name]));
function plain(schema: unknown, own?: string): unknown {
  if (Array.isArray(schema)) return schema.map(item => plain(item));
  if (typeof schema !== 'object' || schema === null) return schema;
  const name = named.get(schema);
  if (name && name !== own) return { $ref: `#/components/schemas/${name}` };
  return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, plain(value)]));
}
const parameters = (schema: { properties?: Record<string, unknown>; required?: string[] } | undefined, place: 'path' | 'query') =>
  Object.entries(schema?.properties ?? {}).map(([name, value]) => ({ name, in: place, required: place === 'path' || (schema?.required ?? []).includes(name), schema: plain(value) }));

export function nylraSchema(): string {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of nylraOperations) {
    const responses: Record<string, unknown> = {
      200: { description: op.okType === 'text/event-stream' ? 'Stream; each event data is one value of this schema' : 'OK', content: { [op.okType ?? 'application/json']: { schema: plain(op.ok) } } },
    };
    for (const status of op.refusals) responses[status] = { description: 'Refusal', content: { 'application/json': { schema: plain(S.NylraRefusal) } } };
    paths[op.path] = { ...paths[op.path], [op.method]: {
      summary: op.summary, security: [{ backendBearer: [] }],
      parameters: [...parameters(op.params as never, 'path'), ...parameters(op.query as never, 'query')],
      ...(op.body || op.bodyType ? { requestBody: { required: true, content: { [op.bodyType ?? 'application/json']: { schema: op.body ? plain(op.body) : { type: 'string', format: 'binary' } } } } } : {}),
      responses,
    } };
  }
  return JSON.stringify({
    openapi: '3.0.3',
    info: { title: 'NYLRA backend API', version: '0.1.0', description: 'Contract draft for NYLRA desktop and mobile. No route serves it yet; sessions come from auth-v1.' },
    components: {
      securitySchemes: { backendBearer: { type: 'http', scheme: 'bearer' } },
      schemas: Object.fromEntries([...named].map(([schema, name]) => [name, plain(schema, name)])),
    },
    paths,
  }, null, 2) + '\n';
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await writeFile('api/nylra-v1.openapi.json', nylraSchema());
