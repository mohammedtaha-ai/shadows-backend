import type { FastifyRequest } from 'fastify';
import type { IdentityService, Principal } from '../../modules/identity/index.js';
export async function authenticate(request:FastifyRequest,identity:IdentityService):Promise<Principal> {
  const header=request.headers.authorization;
  if(!header || !/^Bearer [A-Za-z0-9_-]{43}$/.test(header)) throw new Error('unauthorized');
  const principal=await identity.authenticate(header.slice(7)); if(!principal) throw new Error('unauthorized');return principal;
}
