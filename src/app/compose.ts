import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import type { ServerOptions } from 'node:https';
import { createDatabase } from '../platform/database/pool.js';
import { createIdentity, createOidcClient, type OidcPort } from '../modules/identity/index.js';
import { createDevices } from '../modules/devices/index.js';
import { registerAuth } from '../transports/http/auth-routes.js';
import type { AppConfig } from './config.js';
export async function compose(config: AppConfig, options: { oidc?: OidcPort; clock?:()=>Date; tls?:ServerOptions } = {}) {
  const { pool, db } = createDatabase(config.databaseUrl);
  const server = Fastify({ logger: false, bodyLimit: 8192, ...(options.tls?{https:options.tls}:{}),
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } } });
  try {
    await server.register(swagger,{openapi:{info:{title:'Shadows backend authentication',version:'1.0.0'}}});
    const devices=createDevices(db,options.clock), identity=createIdentity(db,config,options.oidc ?? createOidcClient(config),devices.registration,devices.trust,options.clock);
    devices.bindIdentity(identity);registerAuth(server,identity,devices,config);
    server.get('/health',{schema:{hide:true}},async () => ({ status: 'ok' }));
    let stopping:Promise<void>|undefined;
    return { server, pool, db, identity, devices,
      async start() { try { await pool.query('SELECT 1'); await server.listen({ host: '127.0.0.1', port: config.port }); }
        catch { await server.close(); await db.destroy(); if(!pool.ended) await pool.end(); throw new Error('startup_failed'); } },
      async stop() { stopping ??= (async()=>{await server.close();await db.destroy();if(!pool.ended) await pool.end();})();return stopping; }
    };
  } catch { await server.close();await db.destroy();if(!pool.ended) await pool.end();throw new Error('startup_failed'); }
}
