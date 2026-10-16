import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import type { ServerOptions } from 'node:https';
import { createDatabase } from '../platform/database/pool.js';
import { createIdentity, createOidcClient, type OidcPort } from '../modules/identity/index.js';
import { createDevices } from '../modules/devices/index.js';
import { registerAuth } from '../transports/http/auth-routes.js';
import {createActivity} from '../modules/activity/index.js';
import {createLinks} from '../modules/links/index.js';
import {createSessions} from '../modules/sessions/index.js';
import {registerLaptopLink} from '../transports/laptop-link/index.js';
import type { AppConfig } from './config.js';
export async function compose(config: AppConfig, options: { oidc?: OidcPort; clock?:()=>Date; tls?:ServerOptions;routeSet?:'auth'|'all' } = {}) {
  const { pool, db } = createDatabase(config.databaseUrl);
  const server = Fastify({ logger: false, bodyLimit: 8192, ...(options.tls?{https:options.tls}:{}),
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } } });
  try {
    await server.register(swagger,{openapi:{info:{title:'Shadows backend authentication',version:'1.1.0'},components:{securitySchemes:{backendBearer:{type:'http',scheme:'bearer'}}}}});
    const devices=createDevices(db,options.clock), identity=createIdentity(db,config,options.oidc ?? createOidcClient(config),devices.registration,devices.trust,options.clock);
    devices.bindIdentity(identity);
    const activity=createActivity(db,options.clock),links=createLinks(db,identity,activity,options.clock),sessions=createSessions(db,identity,links,activity,options.clock);
    if(options.routeSet!=='auth')await registerLaptopLink(server,{identity,links,sessions},options.clock);
    registerAuth(server,identity,devices,config);
    server.get('/health',{schema:{hide:true}},async (_request,reply) => {
      try {await pool.query('SELECT 1');return {status:'ok'};}
      catch{return reply.code(503).send({status:'unavailable'});}
    });
    let stopping:Promise<void>|undefined;
    return { server, pool, db, identity, devices,activity,links,sessions,
      async start() { try { await pool.query('SELECT 1'); await server.listen({ host: '127.0.0.1', port: config.port }); }
        catch { await server.close(); await db.destroy(); if(!pool.ended) await pool.end(); throw new Error('startup_failed'); } },
      async stop() { stopping ??= (async()=>{await server.close();await db.destroy();if(!pool.ended) await pool.end();})();return stopping; }
    };
  } catch { await server.close();await db.destroy();if(!pool.ended) await pool.end();throw new Error('startup_failed'); }
}
