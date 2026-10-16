// Development-only server that answers nylra-v1 from its synthetic fixtures, so the
// Flutter app and AYLUL desktop are built before the real routes exist. It holds no
// product rule: it validates against the contract and replays what the fixtures say.
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Value } from '@sinclair/typebox/value';
import { nylraOperations, type HttpOperation } from '../src/transports/http/nylra-paths.js';
import * as S from '../src/transports/http/nylra-schema.js';

export interface NylraFixtures {
  valid: Record<string, unknown>;
  responses: Record<string, unknown>;
  mock: {
    decidedApprovalId: string; expiredApprovalId: string;
    approvalDecisions: Record<'allow' | 'deny', unknown>;
  };
}
type StreamEvent = { seq: number; type: string };

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const streamFixture: Record<string, string> = { TopicEvent: 'TopicEvents', SessionEvent: 'SessionEvents', AccountEvent: 'AccountEvents' };
const schemaName = (schema: object) => Object.entries(S).find(([, value]) => value === schema)?.[0];
const refuse = (reply: FastifyReply, status: number, code: string) => reply.code(status).send({ code });

export function buildNylraMock(fixtures: NylraFixtures): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode;
    return status !== undefined && status < 500
      ? refuse(reply, 400, 'request_invalid')
      : refuse(reply, 503, 'operation_failed');
  });
  const known = new Set(JSON.stringify(fixtures).match(uuid));
  for (const op of nylraOperations.filter(op=>op.transport==='http'))
    app.route({
      method: op.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
      url: op.path.replace(/\{(\w+)\}/g, ':$1'),
      handler: (request, reply) => answer(op, fixtures, known, request, reply),
    });
  return app;
}

function answer(op: HttpOperation, fixtures: NylraFixtures, known: Set<string>, request: FastifyRequest, reply: FastifyReply) {
  if (!/^Bearer \S+$/.test(request.headers.authorization ?? '')) return refuse(reply, 401, 'unauthorized');
  for (const [schema, value] of [[op.params, request.params], [op.body, request.body]] as const)
    if (schema && !Value.Check(schema, value)) return refuse(reply, 400, 'request_invalid');
  // A replay position is a decimal integer, never a truncated/coerced number.
  const query = { ...(request.query as Record<string, unknown>) };
  if (op.query === S.AfterQuery && query.after !== undefined) {
    const raw = query.after;
    if (typeof raw !== 'string' || !/^[0-9]+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
      return refuse(reply, 400, 'request_invalid');
    query.after = Number(raw);
  }
  if (op.query && !Value.Check(op.query, query))
    return refuse(reply, 400, 'request_invalid');
  const params = (request.params ?? {}) as Record<string, string>;
  if (Object.values(params).some(id => !known.has(id))) return refuse(reply, 404, 'not_found');
  if (params.approvalId === fixtures.mock.decidedApprovalId) return refuse(reply, 409, 'approval_already_decided');
  if (params.approvalId === fixtures.mock.expiredApprovalId) return refuse(reply, 409, 'approval_expired');
  if (op.okType === 'text/event-stream') {
    const events = fixtures.valid[streamFixture[schemaName(op.ok)!]!] as StreamEvent[];
    return replay(reply, events, query.after as number | undefined);
  }
  if (op.body === S.ApprovalDecide)
    return reply.send(fixtures.mock.approvalDecisions[(request.body as { decision: 'allow' | 'deny' }).decision]);
  return reply.send(fixtures.responses[`${op.method.toUpperCase()} ${op.path}`] ?? fixtures.valid[schemaName(op.ok)!] ?? {});
}

// Replays the events after the cursor, then ends the response; a real server keeps
// it open. A cursor before the first retained event or after the last is unknown.
function replay(reply: FastifyReply, events: StreamEvent[], after: number | undefined) {
  if (after !== undefined) {
    if (after < events[0]!.seq - 1 || after > events.at(-1)!.seq) return refuse(reply, 410, 'resnapshot_required');
    events = events.filter(event => event.seq > after);
  }
  const body = events.map(event => `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
  return reply.header('content-type', 'text/event-stream; charset=utf-8').header('cache-control', 'no-store').send(body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8')) as NylraFixtures;
  const host = process.env.NYLRA_MOCK_HOST ?? '127.0.0.1';
  const port = Number(process.env.NYLRA_MOCK_PORT ?? 4410);
  await buildNylraMock(fixtures).listen({ host, port });
  console.log(`nylra-v1 mock on http://${host}:${port}`);
}

