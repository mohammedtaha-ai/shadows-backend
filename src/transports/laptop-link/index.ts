import websocket from '@fastify/websocket';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {IdentityService,Principal} from '../../modules/identity/index.js';
import type {LinksService} from '../../modules/links/index.js';
import type {SessionsService} from '../../modules/sessions/index.js';
import {nylraOperations} from '../http/nylra-paths.js';
import {authenticate} from '../http/authenticate.js';
import {attachConnection} from './connection.js';
export async function registerLaptopLink(server:FastifyInstance,services:{identity:IdentityService;links:LinksService;sessions:SessionsService},clock:()=>Date=()=>new Date()) {
 const active=new Set<ReturnType<typeof attachConnection>>(),principals=new WeakMap<FastifyRequest,Principal>();
 await server.register(websocket,{options:{maxPayload:65536,perMessageDeflate:false}});
 const operation=nylraOperations.find(op=>op.operationId==='openLaptopLink')!;
 server.get(operation.path,{websocket:true,schema:{operationId:operation.operationId},preValidation:async(request,reply)=>{
  try{if(request.raw.url?.includes('?'))throw new Error('request_invalid');principals.set(request,await authenticate(request,services.identity));}
  catch(error){const message=error instanceof Error?error.message:'';const code=message==='unauthorized'?'unauthorized':message==='request_invalid'?'request_invalid':'operation_failed';reply.code(code==='unauthorized'?401:code==='request_invalid'?400:503).send({code});}
 }},(socket,request)=>{
  const principal=principals.get(request);if(!principal){socket.close(1008);return;}
  const connection=attachConnection(socket,principal,services.links,services.sessions,clock);active.add(connection);void connection.done.finally(()=>active.delete(connection));
 });
 server.addHook('preClose',async()=>{for(const c of active)c.stop();await Promise.all([...active].map(c=>c.done));});
}
