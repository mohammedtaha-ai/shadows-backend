// The nylra-v1 operations. Routes and the mock server take their schemas from this
// table, so the exported contract and what is served cannot drift apart.
import * as S from './nylra-schema.js';

export const NYLRA_CONTRACT_VERSION = '0.3.0';
interface OperationBase {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  summary: string;
  params?: S.Schema; query?: S.Schema; body?: S.Schema;
  operationId: string; status: 'planned' | 'implemented';
  refusals: readonly number[];
}
export type HttpOperation = OperationBase & {transport:'http';ok:S.Schema;okType?:'application/json'|'text/event-stream'};
export type NylraOperation = HttpOperation | (OperationBase & {transport:'websocket'});
const common = [400, 401, 429, 503];
const stream = 'text/event-stream';

const definitions = [
  {transport:'http', operationId:'issueLaptopCode', status:'implemented', method:'post',path:'/v1/nylra/laptops/pairing-code',summary:'Issue or replace this native device pairing code',body:S.PairingCodeIssue,ok:S.PairingCodeIssued,refusals:common},
  {transport:'websocket', operationId:'openLaptopLink',status:'implemented',method:'get',path:'/v1/nylra/laptop-link',summary:'Open the native laptop relay',refusals:common},
  { transport:'http', operationId:'registerPush', status:'planned', method: 'put', path: '/v1/nylra/devices/current/push', summary: 'Register this phone for push notifications', body: S.PushRegistration, ok: S.Empty, refusals: common },
  { transport:'http', operationId:'unregisterPush', status:'planned', method: 'delete', path: '/v1/nylra/devices/current/push', summary: 'Stop push notifications to this phone', ok: S.Empty, refusals: common },

  { transport:'http', operationId:'claimLaptop', status:'implemented', method: 'post', path: '/v1/nylra/laptops/claim', summary: 'Pair a laptop by the code AYLUL desktop shows', body: S.LinkClaim, ok: S.Laptop, refusals: [...common, 409] },
  { transport:'http', operationId:'listLaptops', status:'implemented', method: 'get', path: '/v1/nylra/laptops', summary: 'Paired laptops and whether each is online', ok: S.LaptopList, refusals: common },
  { transport:'http', operationId:'unlinkLaptop', status:'implemented', method: 'delete', path: '/v1/nylra/laptops/{laptopId}', summary: 'Unpair a laptop; its sessions and approvals stop reaching this account', params: S.LaptopParams, ok: S.Empty, refusals: [...common, 404] },

  { transport:'http', operationId:'listTopics', status:'planned', method: 'get', path: '/v1/nylra/topics', summary: 'Topics, newest activity first, with the account cursor', ok: S.TopicList, refusals: common },
  { transport:'http', operationId:'createTopic', status:'planned', method: 'post', path: '/v1/nylra/topics', summary: 'Start a conversation, optionally about one shared project', body: S.TopicCreate, ok: S.Topic, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'getTopic', status:'planned', method: 'get', path: '/v1/nylra/topics/{topicId}', summary: 'Topic snapshot; its events after the cursor are exactly the later ones', params: S.TopicParams, ok: S.TopicSnapshot, refusals: [...common, 404] },
  { transport:'http', operationId:'topicEvents', status:'planned', method: 'get', path: '/v1/nylra/topics/{topicId}/events', summary: 'Topic events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', params: S.TopicParams, query: S.AfterQuery, ok: S.TopicEvent, okType: stream, refusals: [...common, 404, 410] },
  { transport:'http', operationId:'createTurn', status:'planned', method: 'post', path: '/v1/nylra/topics/{topicId}/turns', summary: 'Send a message; the answer arrives on the topic stream', params: S.TopicParams, body: S.TurnRequest, ok: S.TurnAccepted, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'cancelTurn', status:'planned', method: 'post', path: '/v1/nylra/topics/{topicId}/turns/{turnId}/cancel', summary: 'Stop an answer; its output so far stays, marked partial', params: S.TurnParams, body: S.Empty, ok: S.Empty, refusals: [...common, 404] },

  { transport:'http', operationId:'listSessions', status:'implemented', method: 'get', path: '/v1/nylra/sessions', summary: 'Agent sessions on every paired laptop, or one', query: S.SessionQuery, ok: S.SessionList, refusals: [...common,404] },
  { transport:'http', operationId:'getSession', status:'implemented', method: 'get', path: '/v1/nylra/sessions/{sessionId}', summary: 'Session snapshot with its recent steps', params: S.SessionParams, ok: S.SessionSnapshot, refusals: [...common, 404] },
  { transport:'http', operationId:'sessionEvents', status:'implemented', method: 'get', path: '/v1/nylra/sessions/{sessionId}/events', summary: 'Session events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', params: S.SessionParams, query: S.AfterQuery, ok: S.SessionEvent, okType: stream, refusals: [...common, 404, 410] },

  { transport:'http', operationId:'listApprovals', status:'planned', method: 'get', path: '/v1/nylra/approvals', summary: 'Pending approval requests, oldest first', ok: S.ApprovalList, refusals: common },
  { transport:'http', operationId:'decideApproval', status:'planned', method: 'post', path: '/v1/nylra/approvals/{approvalId}/decide', summary: 'The person allows or denies one request. Already decided or expired: 409', params: S.ApprovalParams, body: S.ApprovalDecide, ok: S.Approval, refusals: [...common, 404, 409] },

  { transport:'http', operationId:'revokeGrant', status:'planned', method: 'post', path: '/v1/nylra/grants/{grantId}/revoke', summary: 'Revoke a grant; its next match goes to the person', params: S.GrantParams, body: S.GrantRevoke, ok: S.GrantRevoked, refusals: [...common, 404] },

  { transport:'http', operationId:'accountEvents', status:'implemented', method: 'get', path: '/v1/nylra/events', summary: 'Account events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', query: S.AfterQuery, ok: S.AccountEvent, okType: stream, refusals: [...common, 410] },
] as const satisfies readonly NylraOperation[];
export type NylraOperationId = typeof definitions[number]['operationId'];
export const nylraOperations: readonly NylraOperation[] = definitions;
