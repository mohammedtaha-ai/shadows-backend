// The nylra-v1 operations. Routes and the mock server take their schemas from this
// table, so the exported contract and what is served cannot drift apart.
import * as S from './nylra-schema.js';

export const NYLRA_CONTRACT_VERSION = '0.5.0';
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
  {transport:'http',operationId:'assistantStatus',status:'implemented',method:'get',path:'/v1/nylra/assistant/status',summary:'Signed-in assistant availability',ok:S.AssistantStatus,refusals:common},
  {transport:'http',operationId:'assistantList',status:'implemented',method:'get',path:'/v1/nylra/assistant/conversations',summary:'Owned assistant conversations',ok:S.AssistantList,refusals:common},
  {transport:'http',operationId:'assistantCreate',status:'implemented',method:'post',path:'/v1/nylra/assistant/conversations',summary:'Prepare an owned conversation',body:S.AssistantCreate,ok:S.AssistantSnapshot,refusals:[...common,409]},
  {transport:'http',operationId:'assistantSnapshot',status:'implemented',method:'get',path:'/v1/nylra/assistant/conversations/{conversationId}',summary:'Bounded conversation snapshot',params:S.AssistantParams,ok:S.AssistantSnapshot,refusals:[...common,404]},
  {transport:'http',operationId:'assistantSend',status:'implemented',method:'post',path:'/v1/nylra/assistant/conversations/{conversationId}/turns',summary:'Send an idempotent assistant message',params:S.AssistantParams,body:S.AssistantSend,ok:S.AssistantSnapshot,refusals:[...common,404,409]},
  {transport:'http',operationId:'assistantStop',status:'implemented',method:'post',path:'/v1/nylra/assistant/conversations/{conversationId}/turns/{turnId}/stop',summary:'Stop the owned run',params:S.AssistantTurnParams,body:S.Empty,ok:S.AssistantSnapshot,refusals:[...common,404,409]},
  {transport:'http',operationId:'assistantRecover',status:'implemented',method:'post',path:'/v1/nylra/assistant/conversations/{conversationId}/turns/{turnId}/recover',summary:'Explicit uncertain-admission recovery',params:S.AssistantTurnParams,body:S.Empty,ok:S.AssistantSnapshot,refusals:[...common,404,409]},
  {transport:'http', operationId:'issueLaptopCode', status:'implemented', method:'post',path:'/v1/nylra/laptops/pairing-code',summary:'Issue or replace this native device pairing code',body:S.PairingCodeIssue,ok:S.PairingCodeIssued,refusals:common},
  {transport:'websocket', operationId:'openLaptopLink',status:'implemented',method:'get',path:'/v1/nylra/laptop-link',summary:'Open the native laptop relay',refusals:common},
  { transport:'http', operationId:'registerPush', status:'planned', method: 'put', path: '/v1/nylra/devices/current/push', summary: 'Register this phone for push notifications', body: S.PushRegistration, ok: S.Empty, refusals: common },
  { transport:'http', operationId:'unregisterPush', status:'planned', method: 'delete', path: '/v1/nylra/devices/current/push', summary: 'Stop push notifications to this phone', ok: S.Empty, refusals: common },

  { transport:'http', operationId:'claimLaptop', status:'implemented', method: 'post', path: '/v1/nylra/laptops/claim', summary: 'Pair a laptop by the code AYLUL desktop shows', body: S.LinkClaim, ok: S.Laptop, refusals: [...common, 409] },
  { transport:'http', operationId:'listLaptops', status:'implemented', method: 'get', path: '/v1/nylra/laptops', summary: 'Paired laptops and whether each is online', ok: S.LaptopList, refusals: common },
  { transport:'http', operationId:'unlinkLaptop', status:'implemented', method: 'delete', path: '/v1/nylra/laptops/{laptopId}', summary: 'Unpair a laptop; its sessions and approvals stop reaching this account', params: S.LaptopParams, ok: S.Empty, refusals: [...common, 404] },

  { transport:'http', operationId:'listTopics', status:'implemented', method: 'get', path: '/v1/nylra/topics', summary: 'Topics, newest activity first, with the account cursor', ok: S.TopicList, refusals: common },
  { transport:'http', operationId:'createTopic', status:'implemented', method: 'post', path: '/v1/nylra/topics', summary: 'Start an account text conversation; project-bound topics await project integration', body: S.TopicCreate, ok: S.Topic, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'getTopic', status:'implemented', method: 'get', path: '/v1/nylra/topics/{topicId}', summary: 'Topic snapshot; its events after the cursor are exactly the later ones', params: S.TopicParams, ok: S.TopicSnapshot, refusals: [...common, 404] },
  { transport:'http', operationId:'topicEvents', status:'implemented', method: 'get', path: '/v1/nylra/topics/{topicId}/events', summary: 'Topic events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', params: S.TopicParams, query: S.AfterQuery, ok: S.TopicEvent, okType: stream, refusals: [...common, 404, 410] },
  { transport:'http', operationId:'createTurn', status:'implemented', method: 'post', path: '/v1/nylra/topics/{topicId}/turns', summary: 'Send a message; the answer arrives on the topic stream', params: S.TopicParams, body: S.TurnRequest, ok: S.TurnAccepted, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'cancelTurn', status:'implemented', method: 'post', path: '/v1/nylra/topics/{topicId}/turns/{turnId}/cancel', summary: 'Stop an answer; its output so far stays, marked partial', params: S.TurnParams, body: S.Empty, ok: S.Empty, refusals: [...common, 404] },
  { transport:'http', operationId:'changeTopicConnection', status:'implemented', method: 'put', path: '/v1/nylra/topics/{topicId}/connection', summary: 'Change connection between turns after acknowledging context transfer', params: S.TopicParams, body: S.TopicConnectionChange, ok: S.Topic, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'deleteTopic', status:'implemented', method: 'delete', path: '/v1/nylra/topics/{topicId}', summary: 'Confirm permanent topic deletion and stop any generation', params: S.TopicParams, body: S.TopicDelete, ok: S.Empty, refusals: [...common, 404] },

  { transport:'http', operationId:'listConnections', status:'implemented', method: 'get', path: '/v1/nylra/connections', summary: 'List account connection metadata without credentials', ok: S.ConnectionList, refusals: common },
  { transport:'http', operationId:'createConnection', status:'implemented', method: 'post', path: '/v1/nylra/connections', summary: 'Save a provider connection and its write-only key', body: S.ConnectionCreate, ok: S.Connection, refusals: [...common, 409] },
  { transport:'http', operationId:'updateConnection', status:'implemented', method: 'put', path: '/v1/nylra/connections/{connectionId}', summary: 'Update connection metadata or replace its key', params: S.ConnectionParams, body: S.ConnectionUpdate, ok: S.Connection, refusals: [...common, 404, 409] },
  { transport:'http', operationId:'deleteConnection', status:'implemented', method: 'delete', path: '/v1/nylra/connections/{connectionId}', summary: 'Remove a connection and block future use', params: S.ConnectionParams, ok: S.Empty, refusals: [...common, 404] },
  { transport:'http', operationId:'getDefaultConnection', status:'implemented', method: 'get', path: '/v1/nylra/connections/default', summary: 'Get the account default, or null when none is set', ok: S.DefaultConnection, refusals: common },
  { transport:'http', operationId:'setDefaultConnection', status:'implemented', method: 'put', path: '/v1/nylra/connections/default', summary: 'Set the account default for new topics', body: S.DefaultConnectionSet, ok: S.DefaultConnection, refusals: [...common, 404] },
  { transport:'http', operationId:'testConnection', status:'implemented', method: 'post', path: '/v1/nylra/connections/{connectionId}/test', summary: 'Explicit paid probe returning a safe category', params: S.ConnectionParams, body: S.ConnectionTest, ok: S.ConnectionTestResult, refusals: [...common, 404] },

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
