import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { nylraOperations } from '../src/transports/http/nylra-paths.js';
import * as S from '../src/transports/http/nylra-schema.js';

export const nylraVersion = '0.2.0';

// Every exported object or union schema is one named component; a use of the same
// TypeBox value becomes a $ref, so the document stays readable for generators.
const named = new Map<object, string>(Object.entries(S)
  .filter(([, value]) => typeof value === 'object' && value !== null && ('properties' in value || 'anyOf' in value))
  .map(([name, value]) => [value as object, name]));

// OpenAPI 3.0 has neither const nor a null type, and Dart generators read 3.0:
// a literal becomes a one-value enum, a union of literals one enum, and a union
// with null a nullable schema.
function plain(schema: unknown, own?: string): unknown {
  if (Array.isArray(schema)) return schema.map(item => plain(item));
  if (typeof schema !== 'object' || schema === null) return schema;
  const name = named.get(schema);
  if (name && name !== own) return { $ref: `#/components/schemas/${name}` };
  const value = schema as Record<string, unknown>;
  if (typeof value.const === 'string') return { type: 'string', enum: [value.const] };
  if (Array.isArray(value.anyOf)) {
    const members = value.anyOf as Record<string, unknown>[];
    const description = value.description === undefined ? {} : { description: value.description };
    if (members.every(member => typeof member.const === 'string'))
      return { type: 'string', enum: members.map(member => member.const), ...description };
    const present = members.filter(member => member.type !== 'null');
    if (present.length === 1 && present.length < members.length) {
      const only = plain(present[0]) as Record<string, unknown>;
      return '$ref' in only ? { allOf: [only], nullable: true, ...description } : { ...only, nullable: true };
    }
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
}

const parameters = (schema: { properties?: Record<string, unknown>; required?: string[] } | undefined, place: 'path' | 'query') =>
  Object.entries(schema?.properties ?? {}).map(([name, value]) =>
    ({ name, in: place, required: place === 'path' || (schema?.required ?? []).includes(name), schema: plain(value) }));

export function nylraSchema(): string {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of nylraOperations) {
    const responses: Record<string, unknown> = {
      200: {
        description: op.okType === 'text/event-stream' ? 'Stream; each event data is one value of this schema' : 'OK',
        content: { [op.okType ?? 'application/json']: { schema: plain(op.ok) } },
      },
    };
    for (const status of op.refusals)
      responses[status] = { description: 'Refusal', content: { 'application/json': { schema: plain(S.NylraRefusal) } } };
    paths[op.path] = { ...paths[op.path], [op.method]: {
      summary: op.summary, security: [{ backendBearer: [] }],
      parameters: [...parameters(op.params as never, 'path'), ...parameters(op.query as never, 'query')],
      ...(op.body ? { requestBody: { required: true, content: { 'application/json': { schema: plain(op.body) } } } } : {}),
      responses,
    } };
  }
  return JSON.stringify({
    openapi: '3.0.3',
    info: {
      title: 'NYLRA backend API', version: nylraVersion,
      description: 'Client contract for the Flutter app and AYLUL desktop. Sessions come from auth-v1. Until routes exist, scripts/mock-nylra.ts serves it from api/nylra-v1.fixtures.json.',
    },
    components: {
      securitySchemes: { backendBearer: { type: 'http', scheme: 'bearer' } },
      schemas: Object.fromEntries([...named].map(([schema, name]) => [name, plain(schema, name)])),
    },
    paths,
  }, null, 2) + '\n';
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await writeFile('api/nylra-v1.openapi.json', nylraSchema());
