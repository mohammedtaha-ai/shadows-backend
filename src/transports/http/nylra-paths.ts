// The nylra-v1 operations. Routes registered later take their schemas from this table,
// so the exported contract and the served API cannot drift apart.
import * as S from './nylra-schema.js';

export interface NylraOperation {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  summary: string;
  params?: S.Schema; query?: S.Schema; body?: S.Schema;
  bodyType?: 'application/json' | 'application/octet-stream';
  ok: S.Schema; okType?: 'application/json' | 'text/event-stream';
  refusals: number[];
}
const common = [400, 401, 429, 503];

export const nylraOperations: NylraOperation[] = [
  { method: 'put', path: '/v1/nylra/devices/current/push', summary: 'Register this device for push notifications', body: S.PushRegistration, ok: S.Empty, refusals: common },
  { method: 'delete', path: '/v1/nylra/devices/current/push', summary: 'Stop push notifications to this device', ok: S.Empty, refusals: common },

  { method: 'post', path: '/v1/nylra/links/claim', summary: 'Link a Shadows instance by the code it displays', body: S.LinkClaim, ok: S.Link, refusals: [...common, 409] },
  { method: 'get', path: '/v1/nylra/links', summary: 'Linked instances and their shared projects', ok: S.LinkList, refusals: common },
  { method: 'delete', path: '/v1/nylra/links/{instanceId}', summary: 'Unlink an instance; its reads and queued deliveries stop', params: S.InstanceParams, ok: S.Empty, refusals: [...common, 404] },

  { method: 'get', path: '/v1/nylra/topics', summary: 'Topics, newest activity first, with the account cursor', ok: S.TopicList, refusals: common },
  { method: 'post', path: '/v1/nylra/topics', summary: 'Start a conversation about one shared project', body: S.TopicCreate, ok: S.Topic, refusals: [...common, 404, 409] },
  { method: 'get', path: '/v1/nylra/topics/{topicId}', summary: 'Topic snapshot; events after its cursor are exactly the later ones', params: S.TopicParams, ok: S.TopicSnapshot, refusals: [...common, 404] },
  { method: 'get', path: '/v1/nylra/topics/{topicId}/events', summary: 'Topic events after a cursor (SSE; id = seq). Unknown or expired cursor: resnapshot_required', params: S.TopicParams, query: S.AfterQuery, ok: S.TopicEvent, okType: 'text/event-stream', refusals: [...common, 404, 410] },
  { method: 'get', path: '/v1/nylra/events', summary: 'Account events after a cursor (SSE; id = seq)', query: S.AfterQuery, ok: S.AccountEvent, okType: 'text/event-stream', refusals: [...common, 410] },

  { method: 'post', path: '/v1/nylra/topics/{topicId}/turns', summary: 'Send a message; the answer arrives on the topic stream', params: S.TopicParams, body: S.TurnRequest, ok: S.TurnAccepted, refusals: [...common, 404, 409, 413] },
  { method: 'post', path: '/v1/nylra/topics/{topicId}/turns/{turnId}/cancel', summary: 'Stop an answer; its output so far stays, marked partial', params: S.TurnParams, body: S.Empty, ok: S.Empty, refusals: [...common, 404] },
  { method: 'post', path: '/v1/nylra/topics/{topicId}/attachments', summary: 'Upload one file (at most 10 MiB) for a later turn', params: S.TopicParams, query: S.AttachmentQuery, bodyType: 'application/octet-stream', ok: S.Attachment, refusals: [...common, 404, 413] },

  { method: 'post', path: '/v1/nylra/topics/{topicId}/drafts/{draftId}/confirm', summary: 'The person sends this exact reply to the Planner', params: S.DraftParams, body: S.DraftConfirm, ok: S.DraftDecision, refusals: [...common, 404, 409] },
  { method: 'post', path: '/v1/nylra/topics/{topicId}/drafts/{draftId}/discard', summary: 'The person drops a reply draft', params: S.DraftParams, body: S.Empty, ok: S.DraftDecision, refusals: [...common, 404, 409] },
];
