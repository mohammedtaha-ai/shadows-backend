import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import type { ServerOptions } from 'node:https';
import { lookup } from 'node:dns/promises';
import { NYLRA_INSTRUCTIONS, replyStream } from 'aylul-brain';
import { createOpenAICompatibleModel } from '../integrations/providers/openai-compatible.js';
import { createProviderSettings, type DestinationResolver } from '../modules/provider-settings/index.js';
import { createConversations, createTurnDispatcher, type ReplyPort } from '../modules/conversations/index.js';
import { createDatabase } from '../platform/database/pool.js';
import { createIdentity, createOidcClient, type OidcPort } from '../modules/identity/index.js';
import { createDevices } from '../modules/devices/index.js';
import { registerAuth } from '../transports/http/auth-routes.js';
import {createActivity} from '../modules/activity/index.js';
import {createLinks} from '../modules/links/index.js';
import {createSessions} from '../modules/sessions/index.js';
import {registerLaptopLink} from '../transports/laptop-link/index.js';
import {registerNylra} from '../transports/http/nylra-routes.js';
import {createExpiry} from './expiry.js';
import type { AppConfig } from './config.js';
import {readFile} from 'node:fs/promises';
import {createHermesClient} from '../integrations/hermes/client.js';
import {createAssistant} from '../modules/assistant/index.js';
export async function compose(config: AppConfig, options: { oidc?: OidcPort; clock?:()=>Date; tls?:ServerOptions;routeSet?:'auth'|'all';reply?:ReplyPort;resolver?:DestinationResolver;hermes?:ReturnType<typeof createHermesClient> } = {}) {
  const { pool, db } = createDatabase(config.databaseUrl);
  const server = Fastify({ logger: false, bodyLimit: 8192, ...(options.tls?{https:options.tls}:{}),
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } } });
  try {
    await server.register(swagger,{openapi:{info:{title:'Shadows backend authentication',version:'1.1.0'},components:{securitySchemes:{backendBearer:{type:'http',scheme:'bearer'}}}}});
    const devices=createDevices(db,options.clock), identity=createIdentity(db,config,options.oidc ?? createOidcClient(config),devices.registration,devices.trust,options.clock);
    devices.bindIdentity(identity);
    const activity=createActivity(db,options.clock),links=createLinks(db,identity,activity,options.clock),sessions=createSessions(db,identity,links,activity,options.clock);
    const providerSettings=createProviderSettings(db,identity,{activeKeyId:config.byokKeyId,keys:new Map([[config.byokKeyId,config.byokKey],...config.byokPreviousKeys])},options.resolver??(host=>lookup(host,{all:true})),options.clock,async connection=>{
      for await(const part of reply({connection,history:[],message:'Reply OK.',signal:AbortSignal.timeout(120000),maxOutputTokens:1})){
        if(typeof part==='string')continue;
        return part.finish==='error'?(part.category==='context_too_large'?'network':part.category??'network'):'ok';
      }
      return 'network';
    });
    const conversations=createConversations(db,identity,providerSettings,activity,options.clock??(()=>new Date()),NYLRA_INSTRUCTIONS);
    let hermes=options.hermes??null;
    if(!hermes&&config.hermes){try{const key=(await readFile(config.hermes.keyFile,'utf8')).trim();hermes=createHermesClient({...config.hermes,key});}catch{hermes=null;}}
    const assistant=createAssistant(db,identity,hermes,options.clock);
    const reply:ReplyPort=options.reply??(input=>replyStream({model:createOpenAICompatibleModel(input.connection).model,history:input.history,message:input.message,signal:input.signal,maxOutputTokens:input.maxOutputTokens}));
    const turnDispatcher=createTurnDispatcher(db,identity,providerSettings,reply,options.clock);
    const expiry=createExpiry([sessions,activity,links]);
    if(options.routeSet!=='auth')await registerLaptopLink(server,{identity,links,sessions},options.clock);
    registerAuth(server,identity,devices,config);
    if(options.routeSet!=='auth')await registerNylra(server,{db,identity,links,sessions,activity,providerSettings,conversations,assistant},options.clock);
    server.get('/health',{schema:{hide:true}},async (_request,reply) => {
      try {await pool.query('SELECT 1');return {status:'ok'};}
      catch{return reply.code(503).send({status:'unavailable'});}
    });
    let stopping:Promise<void>|undefined;
    return { server, pool, db, identity, devices,activity,links,sessions,providerSettings,conversations,assistant,turnDispatcher,expire:expiry.run,
      async start() { try { await pool.query('SELECT 1'); await expiry.start();if(options.routeSet!=='auth')await turnDispatcher.start();await server.listen({ host: '127.0.0.1', port: config.port }); }
        catch { await turnDispatcher.stop();await expiry.stop();await server.close(); if(!pool.ended)await db.destroy(); if(!pool.ended) await pool.end(); throw new Error('startup_failed'); } },
      async stop() { stopping ??= (async()=>{await turnDispatcher.stop();await expiry.stop();await server.close();if(!pool.ended)await db.destroy();if(!pool.ended) await pool.end();})();return stopping; }
    };
  } catch { await server.close();if(!pool.ended)await db.destroy();if(!pool.ended) await pool.end();throw new Error('startup_failed'); }
}
