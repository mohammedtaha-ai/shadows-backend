// Canonical nylra-v1 wire shapes, consumed by NYLRA desktop and the Flutter client.
// Contract first: no route serves them yet. nylra-paths.ts names the operations.
import { Type, type TSchema } from '@sinclair/typebox';
const closed = <T extends Parameters<typeof Type.Object>[0]>(fields: T, description?: string) =>
  Type.Object(fields, { additionalProperties: false, ...(description ? { description } : {}) });
const literals = (values: string[]) => Type.Union(values.map(value => Type.Literal(value)));

export const Id = Type.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' });
export const Timestamp = Type.String({ pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,9})?Z$', description: 'UTC, RFC 3339.' });
export const Seq = Type.Integer({ minimum: 0, description: 'Position in one ordered stream; gapless and never reused.' });
export const CommandId = Type.String({ ...Id, description: 'Client-generated. The same id with the same request replays; with another, command_conflict.' });
const Digest = Type.String({ pattern: '^[0-9a-f]{64}$', description: 'SHA-256 hex of the exact text shown to the person.' });
const Version = Type.String({ minLength: 1, maxLength: 128 });

// Shadows links: which computers and shared projects this account can reach.
export const LinkClaim = closed({ commandId: CommandId, code: Type.String({ pattern: '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' }) },
  'The pairing code a Shadows daemon displays.');
export const LinkedProject = closed({ projectId: Id, name: Type.String({ maxLength: 200 }) });
export const Link = closed({
  instanceId: Id, name: Type.String({ maxLength: 80 }), status: literals(['online', 'offline']),
  lastSeenAt: Type.Union([Timestamp, Type.Null()]), projects: Type.Array(LinkedProject, { maxItems: 500 }),
}, 'One linked Shadows instance. projects lists only those the person shared with NYLRA in Shadows.');
export const LinkList = closed({ links: Type.Array(Link, { maxItems: 50 }) });
export const InstanceParams = closed({ instanceId: Id });

// Push registration for the current device.
export const PushRegistration = closed({ platform: literals(['fcm', 'apns']), token: Type.String({ minLength: 1, maxLength: 4096 }) });

// Topics: an escalation from Shadows, or a conversation the person started.
export const ProjectRef = closed({ instanceId: Id, projectId: Id, name: Type.String({ maxLength: 200 }) });
export const Escalation = closed({
  raisedBy: literals(['planner', 'manager', 'executor']),
  summary: Type.String({ maxLength: 2000 }),
  task: Type.Union([closed({ ref: Type.String({ maxLength: 160 }), title: Type.String({ maxLength: 200 }) }), Type.Null()]),
  plannerThreadId: Type.Union([Id, Type.Null()]),
}, 'Who in Shadows raised it and about what. Present only on escalation topics.');
export const Topic = closed({
  topicId: Id, kind: literals(['escalation', 'conversation']), title: Type.String({ maxLength: 200 }),
  project: ProjectRef, state: literals(['open', 'resolved']), needsYou: Type.Boolean(),
  escalation: Type.Optional(Escalation), createdAt: Timestamp, updatedAt: Timestamp, lastSeq: Seq,
});
export const TopicList = closed({ topics: Type.Array(Topic, { maxItems: 200 }), cursor: Seq },
  'cursor is the account event position matching this list.');
export const TopicCreate = closed({ commandId: CommandId, instanceId: Id, projectId: Id, title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })) });
export const TopicParams = closed({ topicId: Id });
export const AfterQuery = closed({ after: Type.Optional(Seq) });

// Sources: what an answer rests on, with its version and how it was obtained.
export const SourceRef = closed({
  ref: closed({ kind: Type.String({ pattern: '^[a-z][a-z_]{0,39}$' }), id: Type.String({ minLength: 1, maxLength: 128 }) }),
  version: Version, readAt: Timestamp,
  origin: literals(['owner', 'local_client']),
}, 'origin owner: read by the backend from Shadows. local_client: reported by desktop, not owner-verified.');
export const ContextItem = closed({ ref: SourceRef.properties.ref, version: Version, title: Type.String({ maxLength: 200 }), text: Type.String({ maxLength: 8000 }) });
export const LocalContext = closed({
  schema: Type.Literal('nylra-context/1'), projectId: Id, revision: Version, readAt: Timestamp,
  items: Type.Array(ContextItem, { maxItems: 200 }),
}, 'What desktop read from the local Shadows for this turn. Explanation material only; over 32 KiB serialized is refused.');

// Topic entries, as the snapshot holds them.
const entry = <T extends Parameters<typeof Type.Object>[0]>(type: string, fields: T) =>
  closed({ type: Type.Literal(type), entryId: Id, seq: Seq, createdAt: Timestamp, ...fields });
export const Attachment = closed({ attachmentId: Id, fileName: Type.String({ maxLength: 255 }), mediaType: Type.String({ maxLength: 127 }), size: Type.Integer({ minimum: 1, maximum: 10485760 }), sha256: Digest });
export const Entry = Type.Union([
  entry('user_message', { turnId: Id, text: Type.String({ maxLength: 2000 }), attachments: Type.Array(Attachment, { maxItems: 5 }) }),
  entry('assistant_message', { turnId: Id, text: Type.String({ maxLength: 16000 }), status: literals(['streaming', 'complete', 'partial']), sources: Type.Array(SourceRef, { maxItems: 50 }) }),
  entry('escalation', { text: Type.String({ maxLength: 8000 }), sources: Type.Array(SourceRef, { maxItems: 50 }) }),
  entry('reply_draft', {
    draftId: Id, to: literals(['planner']), text: Type.String({ maxLength: 4000 }), digest: Digest,
    status: literals(['awaiting_confirmation', 'confirmed', 'discarded', 'superseded', 'expired']),
    delivery: Type.Union([literals(['queued', 'delivered', 'accepted', 'rejected']), Type.Null()]),
  }),
]);
export const TopicSnapshot = closed({ topic: Topic, entries: Type.Array(Entry, { maxItems: 1000 }), cursor: Seq });

// Topic stream: one SSE event per value, SSE id = seq, SSE event = type.
const event = <T extends Parameters<typeof Type.Object>[0]>(type: string, fields: T) => closed({ type: Type.Literal(type), seq: Seq, ...fields });
export const TopicEvent = Type.Union([
  event('entry_added', { entry: Entry }),
  event('delta', { entryId: Id, text: Type.String({ minLength: 1, maxLength: 4000 }) }),
  event('entry_updated', { entry: Entry }),
  event('turn_finished', { turnId: Id, outcome: literals(['done', 'error', 'cancelled']), code: Type.Optional(Type.String({ maxLength: 64 })) }),
  event('topic_updated', { topic: Topic }),
  event('resnapshot_required', {}),
]);
// Account stream: what the topic list and notifications need.
export const AccountEvent = Type.Union([event('topic_updated', { topic: Topic }), event('link_updated', { link: Link }), event('resnapshot_required', {})]);

// Turns and replies.
export const TurnRequest = closed({
  commandId: CommandId, message: Type.String({ minLength: 1, maxLength: 2000 }),
  context: Type.Optional(LocalContext), attachmentIds: Type.Optional(Type.Array(Id, { maxItems: 5 })),
});
export const TurnAccepted = closed({ turnId: Id, entryId: Id, seq: Seq });
export const TurnParams = closed({ topicId: Id, turnId: Id });
export const DraftParams = closed({ topicId: Id, draftId: Id });
export const DraftConfirm = closed({ commandId: CommandId, digest: Digest }, 'The person confirms this exact text. NYLRA cannot confirm for them.');
export const DraftDecision = closed({ draftId: Id, status: literals(['confirmed', 'discarded']), delivery: Type.Union([Type.Literal('queued'), Type.Null()]) });
export const AttachmentQuery = closed({ fileName: Type.String({ minLength: 1, maxLength: 255 }), mediaType: Type.String({ minLength: 3, maxLength: 127 }) });

export const NylraRefusal = closed({ code: literals([
  'request_invalid', 'unauthorized', 'not_found', 'rate_limited', 'operation_failed',
  'link_code_invalid', 'command_conflict', 'context_too_large', 'context_project_mismatch',
  'resnapshot_required', 'draft_stale', 'source_offline', 'attachment_too_large',
]) });
export const Empty = closed({});
export type Schema = TSchema;
