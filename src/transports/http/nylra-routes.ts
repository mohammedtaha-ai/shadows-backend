import {fastifySSE} from '@fastify/sse';
import type {FastifyInstance,FastifyReply,FastifyRequest,RouteOptions} from 'fastify';
import type {Kysely} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {IdentityService,Principal} from '../../modules/identity/index.js';
import type {LinksService} from '../../modules/links/index.js';
import type {SessionsService} from '../../modules/sessions/index.js';
import type {ActivityService,AccountEvent} from '../../modules/activity/index.js';
import type {ProviderSettingsService,ConnectionCreate,ConnectionUpdate} from '../../modules/provider-settings/index.js';
import type {ConversationsService,TopicCreate,TurnRequest} from '../../modules/conversations/index.js';
import {Value} from '@sinclair/typebox/value';
import {nylraOperations,type HttpOperation,type NylraOperationId} from './nylra-paths.js';
import * as S from './nylra-schema.js';
import {authenticate,authenticateRevocation} from './authenticate.js';
import {serveAccountEvents,serveSessionEvents,serveTopicEvents} from './nylra-sse.js';
type Services={db:Kysely<Database>;identity:IdentityService;links:LinksService;sessions:SessionsService;activity:ActivityService;providerSettings:ProviderSettingsService;conversations:ConversationsService};
type Handler=(principal:Principal,request:FastifyRequest,reply:FastifyReply)=>Promise<unknown>;
const path=(p:string)=>p.replace(/\{(\w+)\}/g,':$1');
function routeSchema(op:HttpOperation) {
 return {operationId:op.operationId,security:[{backendBearer:[]}],...(op.params?{params:op.params}:{}),...(op.query?{querystring:op.query}:{}),...(op.body?{body:op.body}:{}),
  response:{200:op.okType==='text/event-stream'?{content:{'text/event-stream':{schema:op.ok}}}:op.ok,...Object.fromEntries(op.refusals.map(n=>[n,S.NylraRefusal]))}};
}
export function assertNylraBindings(routes:Pick<RouteOptions,'method'|'url'|'schema'>[]) {
 const observed=routes.filter(r=>r.url.startsWith('/v1/nylra/'));
 const expected=nylraOperations.filter((op):op is HttpOperation=>op.transport==='http'&&op.status==='implemented');
 if(observed.length!==expected.length)throw new Error('binding_drift');
 for(const op of expected){const matches=observed.filter(r=>r.method===op.method.toUpperCase()&&r.url===path(op.path));if(matches.length!==1||JSON.stringify(matches[0]!.schema)!==JSON.stringify(routeSchema(op)))throw new Error('binding_drift');}
}
export async function registerNylra(server:FastifyInstance,services:Services,clock:()=>Date=()=>new Date()) {
 const {db,identity,links,sessions,activity,providerSettings,conversations}=services;const streams=new Set<FastifyReply>();
 const accountPage=async(principal:Principal,after:number|undefined)=>{
  await links.synchronize(principal);
  await db.transaction().execute(async tx=>{await identity.authorizeTransaction(tx,principal);await activity.prune(tx,principal.accountId,clock());});
  return db.transaction().setIsolationLevel('repeatable read').setAccessMode('read only').execute(async tx=>activity.read(tx,principal.accountId,after??await activity.cursor(tx,principal.accountId),100));
 };
 const handlers:Partial<Record<NylraOperationId,Handler>>={
  listConnections:async p=>providerSettings.list(p),
  createConnection:async(p,r)=>providerSettings.create(p,r.body as ConnectionCreate),
  updateConnection:async(p,r)=>providerSettings.update(p,(r.params as {connectionId:string}).connectionId,r.body as ConnectionUpdate),
  deleteConnection:async(p,r)=>{await providerSettings.remove(p,(r.params as {connectionId:string}).connectionId);return {};},
  getDefaultConnection:async p=>providerSettings.getDefault(p),
  setDefaultConnection:async(p,r)=>providerSettings.setDefault(p,(r.body as {connectionId:string}).connectionId),
  testConnection:async(p,r)=>providerSettings.test(p,(r.params as {connectionId:string}).connectionId,r.body as {costAcknowledged:boolean}),
  listTopics:async p=>conversations.list(p),
  createTopic:async(p,r)=>conversations.createTopic(p,r.body as TopicCreate),
  getTopic:async(p,r)=>conversations.snapshot(p,(r.params as {topicId:string}).topicId),
  createTurn:async(p,r)=>conversations.createTurn(p,(r.params as {topicId:string}).topicId,r.body as TurnRequest),
  cancelTurn:async(p,r)=>{const {topicId,turnId}=r.params as {topicId:string;turnId:string};return conversations.cancelTurn(p,topicId,turnId);},
  changeTopicConnection:async(p,r)=>conversations.changeConnection(p,(r.params as {topicId:string}).topicId,r.body as {connectionId:string;transferAcknowledged:boolean}),
  deleteTopic:async(p,r)=>{await conversations.deleteTopic(p,(r.params as {topicId:string}).topicId,r.body as {confirm:boolean});return {};},
  topicEvents:async(p,r,reply)=>{
   const id=(r.params as {topicId:string}).topicId,after=(r.query as {after?:number}).after;
   return serveTopicEvents(reply,after,S.TopicEvent,cursor=>cursor===undefined?conversations.snapshot(p,id).then(s=>({events:[],highWater:s.cursor})):conversations.events(p,id,cursor,100),async cursor=>{await conversations.events(p,id,cursor,1);});
  },
  issueLaptopCode:async(p,r)=>links.issueCode(p,(r.body as {name:string}).name),
  claimLaptop:async(p,r)=>{const b=r.body as {commandId:string;code:string};return links.claim(p,b.commandId,b.code);},
  listLaptops:async p=>links.list(p),unlinkLaptop:async(p,r)=>{await links.unlink(p,(r.params as {laptopId:string}).laptopId);return {};},
  listSessions:async(p,r)=>sessions.list(p,(r.query as {laptopId?:string}).laptopId),getSession:async(p,r)=>sessions.snapshot(p,(r.params as {sessionId:string}).sessionId),
  sessionEvents:async(p,r,reply)=>{
   const id=(r.params as {sessionId:string}).sessionId,after=(r.query as {after?:number}).after;
   return serveSessionEvents(reply,after,S.SessionEvent,cursor=>cursor===undefined?sessions.snapshot(p,id).then(s=>({events:[],highWater:s.cursor})):sessions.events(p,id,cursor,100),async cursor=>{await sessions.events(p,id,cursor,1);});
  },
  accountEvents:async(p,r,reply)=>{
   // Journal envelope is internal; only publisher-owned projection reaches the wire.
   const wire=(e:AccountEvent)=>({type:e.type,...e.payload,seq:e.seq});
   return serveAccountEvents(reply,(r.query as {after?:number}).after,S.AccountEvent,
    async cursor=>{const page=await accountPage(p,cursor);return {highWater:page.highWater,events:page.events.map(wire)};},
    async(cursor,events)=>{const page=await accountPage(p,cursor);await links.checkReadable(p,page.events.filter(e=>e.type!=='laptop_unlinked'&&e.type!=='topic_deleted'&&events.some(v=>v.seq===e.seq)).flatMap(e=>e.laptopId===null?[]:[e.laptopId]));});
  },
 };
 await server.register(async scope=>{
  await scope.register(fastifySSE,{heartbeatInterval:0});
  scope.setErrorHandler((error,_request,reply)=>{
   if(reply.raw.headersSent){reply.sse?.close();return;}
   const message=error instanceof Error?error.message:'';
   const known=['request_invalid','unauthorized','not_found','rate_limited','link_code_invalid','command_conflict','resnapshot_required','no_connection','credential_rejected','model_unavailable','quota','network','destination_refused','generation_busy','context_too_large'];
   const code=(error as {validation?:unknown;code?:string})?.validation||(error as {code?:string})?.code==='FST_ERR_CTP_BODY_TOO_LARGE'?'request_invalid':known.includes(message)?message:'operation_failed';
   const status=code==='unauthorized'?401:code==='not_found'?404:code==='rate_limited'||code==='quota'?429:code==='command_conflict'||code==='generation_busy'?409:code==='resnapshot_required'?410:code==='operation_failed'||code==='network'?503:400;
   reply.code(status).send({code});
  });
  for(const op of nylraOperations){if(op.transport!=='http'||op.status!=='implemented')continue;
   const handler=handlers[op.operationId as NylraOperationId];if(!handler)throw new Error('binding_missing');
   scope.route({method:op.method.toUpperCase() as 'GET',url:path(op.path),schema:routeSchema(op),...(op.okType==='text/event-stream'?{sse:'manual' as const}:{}),
    preValidation:async request=>{
     if(op.query===S.AfterQuery){const q=request.query as Record<string,unknown>;if(q.after!==undefined){if(typeof q.after!=='string'||!/^(0|[1-9][0-9]*)$/.test(q.after)||!Number.isSafeInteger(Number(q.after)))throw new Error('request_invalid');q.after=Number(q.after);}}
    },
    handler:async(request,reply)=>{
     const principal=await (op.operationId==='unlinkLaptop'?authenticateRevocation:authenticate)(request,identity);
     if(op.okType==='text/event-stream'){streams.add(reply);reply.sse.onClose(()=>streams.delete(reply));try{return await handler(principal,request,reply);}finally{streams.delete(reply);}}
     const result=await handler(principal,request,reply);if(!Value.Check(op.ok,result))throw new Error('operation_failed');return result;
    },
   });
  }
 });
 server.addHook('preClose',async()=>{for(const reply of streams)reply.sse.close();});
}
