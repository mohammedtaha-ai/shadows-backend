// Canonical nylra-v1 wire shapes, shared by the Flutter app and AYLUL desktop.
// nylra-paths.ts names the operations; scripts/mock-nylra.ts answers them from fixtures.
import { Type, type TSchema } from '@sinclair/typebox';

type Fields = Parameters<typeof Type.Object>[0];
const closed = <T extends Fields>(fields: T, description?: string) =>
  Type.Object(fields, { additionalProperties: false, ...(description ? { description } : {}) });
const literals = <const T extends string>(values: T[]) => Type.Union(values.map(value => Type.Literal(value)));
const text = (maxLength: number, minLength = 0) => Type.String({ minLength, maxLength });
const nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const Id = Type.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' });
export const Timestamp = Type.String({
  pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,9})?Z$', description: 'UTC, RFC 3339.',
});
export const Seq = Type.Integer({
  minimum: 0, maximum: Number.MAX_SAFE_INTEGER,
  description: 'Exact safe-integer position in one ordered stream; gapless and never reused.',
});
export const CommandId = Type.String({
  ...Id, description: 'Client-generated. The same id with the same request replays; with another, command_conflict.',
});

// Links: laptops running AYLUL desktop that this account paired.
export const LinkClaim = closed({ commandId: CommandId, code: Type.String({ pattern: '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' }) },
  'The pairing code AYLUL desktop displays.');
export const Laptop = closed({
  laptopId: Id, name: text(80, 1), status: literals(['online', 'offline']), lastSeenAt: nullable(Timestamp),
});
export const LaptopList = closed({ laptops: Type.Array(Laptop, { maxItems: 20 }), cursor: Seq });
export const PairingCodeIssue = Type.Pick(Laptop, ['name']);
export const PairingCodeIssued = closed({ code: Type.Index(LinkClaim, ['code']), expiresAt: Timestamp });
export const LaptopParams = closed({ laptopId: Id });

// Push registration for the current phone.
export const PushRegistration = closed({ platform: literals(['fcm', 'apns']), token: text(4096, 1) });

// Account-owned provider metadata. Credentials appear only in write bodies.
const connectionFields = {
  name: text(80, 1), format: literals(['openai_compatible']),
  baseUrl: Type.String({ minLength: 1, maxLength: 2048, pattern: '^https://[^\\s]+$' }), model: text(200, 1),
};
const apiKey = Type.String({ minLength: 1, maxLength: 512, writeOnly: true });
export const Connection = closed({
  connectionId: Id, ...connectionFields, keyConfigured: Type.Boolean(),
  revision: Type.Integer({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }), createdAt: Timestamp, updatedAt: Timestamp,
});
export const ConnectionList = closed({ connections: Type.Array(Connection, { maxItems: 20 }) });
export const ConnectionCreate = closed({ ...connectionFields, apiKey });
export const ConnectionUpdate = closed({
  name: Type.Optional(connectionFields.name), format: Type.Optional(connectionFields.format),
  baseUrl: Type.Optional(connectionFields.baseUrl), model: Type.Optional(connectionFields.model), apiKey: Type.Optional(apiKey),
}, 'Changing destination requires a reconfirmed key in the same request; the provider-settings service enforces this.');
export const ConnectionParams = closed({ connectionId: Id });
export const DefaultConnection = closed({ connectionId: nullable(Id) });
export const DefaultConnectionSet = closed({ connectionId: Id });
export const ConnectionTest = closed({ costAcknowledged: Type.Literal(true) }, 'An explicit probe may incur provider charges.');
export const ConnectionTestResult = closed({ outcome: literals([
  'ok', 'credential_rejected', 'model_unavailable', 'quota', 'network', 'destination_refused',
]) });

// Chat: topics, their entries and their stream.
export const ProjectRef = closed({ laptopId: Id, projectId: text(128, 1), name: text(200) },
  'A Shadows project shared with AYLUL on one laptop.');
export const Topic = closed({
  topicId: Id, title: text(200), project: nullable(ProjectRef), state: literals(['open', 'resolved']),
  connectionId: Id, model: connectionFields.model,
  createdAt: Timestamp, updatedAt: Timestamp, lastSeq: Seq,
});
export const TopicList = closed({ topics: Type.Array(Topic, { maxItems: 200 }), cursor: Seq },
  'cursor is the account stream position matching this list.');
export const TopicCreate = closed({
  commandId: CommandId, title: Type.Optional(text(200, 1)), connectionId: Type.Optional(Id),
  project: Type.Optional(closed({ laptopId: Id, projectId: text(128, 1) })),
});
export const TopicParams = closed({ topicId: Id });
export const TopicConnectionChange = closed({ connectionId: Id, transferAcknowledged: Type.Literal(true) },
  'Acknowledges that the next turn sends topic context to the selected provider.');
export const TopicDelete = closed({ confirm: Type.Literal(true) });
export const AfterQuery = closed({ after: Type.Optional(Seq) });
export const SourceRef = closed({
  kind: Type.String({ pattern: '^[a-z][a-z_]{0,39}$' }), id: text(128, 1), version: text(128, 1), readAt: Timestamp,
}, 'What an answer rests on, as the brain read it.');
const entry = <T extends Fields>(type: string, fields: T) =>
  closed({ type: Type.Literal(type), entryId: Id, seq: Seq, createdAt: Timestamp, ...fields });
export const Entry = Type.Union([
  entry('user_message', { turnId: Id, text: text(2000, 1) }),
  entry('assistant_message', {
    turnId: Id, text: text(16000), status: literals(['streaming', 'complete', 'partial']),
    answeredBy: literals(['laptop', 'cloud']), sources: Type.Array(SourceRef, { maxItems: 50 }),
  }),
]);
export const TopicSnapshot = closed({ topic: Topic, entries: Type.Array(Entry, { maxItems: 1000 }), cursor: Seq });
const event = <T extends Fields>(type: string, fields: T) => closed({ type: Type.Literal(type), seq: Seq, ...fields });
export const TopicEvent = Type.Union([
  event('entry_added', { entry: Entry }),
  event('delta', { entryId: Id, text: text(4000, 1) }),
  event('entry_updated', { entry: Entry }),
  event('turn_finished', {
    turnId: Id, connectionId: Id, model: connectionFields.model,
    outcome: literals(['done', 'error', 'cancelled']), code: Type.Optional(text(64, 1)),
  }),
  event('topic_updated', { topic: Topic }),
]);
export const TurnRequest = closed({ commandId: CommandId, message: text(2000, 1) });
export const TurnAccepted = closed({ turnId: Id, entryId: Id, seq: Seq });
export const TurnParams = closed({ topicId: Id, turnId: Id });

// Sessions: what Claude Code and Codex are doing on each laptop.
export const Agent = literals(['claude_code', 'codex']);
export const Step = closed({
  stepId: Id, seq: Seq, at: Timestamp, tool: text(64, 1), path: nullable(text(1024, 1)),
  summary: Type.String({ minLength: 1, maxLength: 200, pattern: '^[^\\r\\n\\u2028\\u2029]+$' }),
}, 'One agent step as the laptop summarized it. Never a diff or file content.');
export const Session = closed({
  sessionId: Id, laptopId: Id, agent: Agent, projectName: text(200), cwd: text(1024, 1),
  state: literals(['running', 'waiting', 'ended', 'offline']), startedAt: Timestamp, updatedAt: Timestamp,
  lastStep: nullable(Step), lastSeq: Seq,
}, 'offline: its laptop is not connected, and the rest is as last reported.');
export const SessionList = closed({ sessions: Type.Array(Session, { maxItems: 200 }), cursor: Seq },
  'At most 200 sessions: running/waiting first, then newest update and stable ID ties. cursor is the account stream position matching this bounded list.');
export const SessionQuery = closed({ laptopId: Type.Optional(Id) });
export const SessionParams = closed({ sessionId: Id });
export const SessionSnapshot = closed({ session: Session, steps: Type.Array(Step, { maxItems: 500 }), cursor: Seq });
export const SessionEvent = Type.Union([
  event('step_added', { step: Step }),
  event('session_updated', { session: Session }),
]);

// Approvals: an agent's request, and who decided it.
export const Decider = Type.Union([
  closed({ kind: Type.Literal('person') }),
  closed({ kind: Type.Literal('aylul_grant'), grantId: Id }),
], { description: 'person: the person decided. aylul_grant: AYLUL decided on their behalf under that grant.' });
export const Approval = closed({
  approvalId: Id, sessionId: Id, laptopId: Id, agent: Agent, tool: text(64, 1),
  path: nullable(text(1024, 1)), command: nullable(text(2000, 1)), summary: text(200, 1),
  requestedAt: Timestamp, expiresAt: Timestamp, state: literals(['pending', 'allowed', 'denied', 'expired']),
  decidedBy: nullable(Decider), decidedAt: nullable(Timestamp),
});
export const ApprovalList = closed({ approvals: Type.Array(Approval, { maxItems: 200 }), cursor: Seq },
  'Pending requests, oldest first. cursor is the account stream position matching this list.');
export const ApprovalParams = closed({ approvalId: Id });
export const ApprovalDecide = closed({ commandId: CommandId, decision: literals(['allow', 'deny']) },
  'The person decides. The account comes from the session, never the body.');

// Grants: the phone can only revoke one. Creating or widening a grant happens on the laptop.
export const GrantParams = closed({ grantId: Id });
export const GrantRevoke = closed({ commandId: CommandId });
export const GrantRevoked = closed({ grantId: Id, revokedAt: Timestamp },
  'Revoking an already revoked grant answers the same value again.');

// Account stream: what the lists and notifications need.
export const AccountEvent = Type.Union([
  event('approval_requested', { approval: Approval }),
  event('approval_resolved', { approval: Approval }),
  event('session_changed', { session: Session }),
  event('laptop_online', { laptop: Laptop }),
  event('laptop_offline', { laptop: Laptop }),
  event('laptop_unlinked', { laptopId: Id }),
  event('topic_updated', { topic: Topic }),
  event('topic_deleted', { topicId: Id }),
]);

export const NylraRefusal = closed({ code: literals([
  'request_invalid', 'unauthorized', 'not_found', 'rate_limited', 'operation_failed',
  'link_code_invalid', 'command_conflict', 'resnapshot_required', 'approval_already_decided', 'approval_expired',
  'no_connection', 'credential_rejected', 'model_unavailable', 'quota', 'network', 'destination_refused',
  'generation_busy', 'context_too_large',
]) });
export const Empty = closed({});
export const AssistantStatus=closed({state:literals(['ready','unavailable','unconfigured'])});
export const AssistantConversation=closed({id:Id,title:text(200),createdAt:Timestamp,updatedAt:Timestamp});
export const AssistantList=closed({conversations:Type.Array(AssistantConversation,{maxItems:100})});
export const AssistantTurn=closed({id:Id,commandId:CommandId,input:text(4096),output:text(65536),state:literals(['submitting','running','done','error','cancelled','unknown','stopping']),createdAt:Timestamp});
export const AssistantSnapshot=closed({conversation:AssistantConversation,turns:Type.Array(AssistantTurn,{maxItems:30}),truncated:Type.Boolean(),connection:literals(['ready','offline','unconfigured'])});
export const AssistantCreate=closed({commandId:CommandId});
export const AssistantSend=closed({commandId:CommandId,text:text(4096,1)});
export const AssistantParams=closed({conversationId:Id});
export const AssistantTurnParams=closed({conversationId:Id,turnId:Id});
export type Schema = TSchema;
