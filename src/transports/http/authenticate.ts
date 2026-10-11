import type { FastifyRequest } from 'fastify';
import type { IdentityService, Principal } from '../../modules/identity/index.js';
export async function authenticate(request:FastifyRequest,identity:IdentityService):Promise<Principal> {
  const principal=await identity.authenticate(bearer(request)); if(!principal) throw new Error('unauthorized');return principal;
}
export async function authenticateRevocation(request:FastifyRequest,identity:IdentityService):Promise<Principal> {
  const principal=await identity.authenticateForRevocation(bearer(request));if(!principal)throw new Error('unauthorized');return principal;
}
function bearer(request:FastifyRequest):string {
  const header=request.headers.authorization;
  if(!header || !/^Bearer [A-Za-z0-9_-]{43}$/.test(header)) throw new Error('unauthorized');
  return header.slice(7);
}
