import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:https';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createOidcClient } from '../../src/modules/identity/oidc-client.js';
import { readConfig } from '../../src/app/config.js';
import { tlsFixture } from './fixtures/tls.js';
import { identityFixture } from './fixtures/identity.js';
import { compose } from '../../src/app/compose.js';
import { configEnv } from './fixtures/config.js';

test('signed_logout wrong_issuer_audience_event_nonce_refused signing_key_rotation_verified', async () => {
  const tls=await tlsFixture(), first=await generateKeyPair('RS256'), second=await generateKeyPair('RS256');
  let keys=[{...await exportJWK(first.publicKey),kid:'first',alg:'RS256',use:'sig'}];
  let issuer='';
  const server=createServer({key:tls.key,cert:tls.cert},(req,res)=>{
    res.setHeader('content-type','application/json');
    if(req.url === '/.well-known/openid-configuration') res.end(JSON.stringify({issuer,authorization_endpoint:issuer+'/auth',token_endpoint:issuer+'/token',introspection_endpoint:issuer+'/introspect',jwks_uri:issuer+'/jwks',revocation_endpoint:issuer+'/revoke',end_session_endpoint:issuer+'/logout',response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256']}));
    else if(req.url === '/jwks') res.end(JSON.stringify({keys})); else {res.statusCode=404;res.end('{}');}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve)); const address=server.address();assert.ok(address && typeof address !== 'string');issuer=`https://127.0.0.1:${address.port}`;
  try {
    const adapter=createOidcClient(readConfig({...configEnv('postgresql://synthetic:synthetic@127.0.0.1/test'),OIDC_ISSUER:issuer}));
    const event='http://schemas.openid.net/event/backchannel-logout';
    const sign=async (overrides:Record<string,unknown>={}, rotated=false) => new SignJWT({iss:issuer,aud:'backend',sid:'sid',jti:'jti',iat:Math.floor(Date.now()/1000),events:{[event]:{}},...overrides})
      .setProtectedHeader({alg:'RS256',kid:rotated?'second':'first'}).sign(rotated?second.privateKey:first.privateKey);
    assert.equal((await adapter.verifyLogout(await sign())).sid,'sid');
    const f=await identityFixture();f.config.issuer=issuer;
    const app=await compose(f.config,{oidc:{...f.oidc,verifyLogout:adapter.verifyLogout},clock:()=>f.now});
    try{
      const grant=await f.login();
      const bad=await app.server.inject({method:'POST',url:'/v1/auth/backchannel-logout',headers:{'content-type':'application/x-www-form-urlencoded'},payload:new URLSearchParams({logout_token:await sign({sid:'subject-one-sid',nonce:'forbidden'})}).toString()});
      assert.equal(bad.statusCode,400);assert.ok(await f.identity.authenticate(grant.handle));
      const signed=await sign({sid:'subject-one-sid'});
      for(let i=0;i<2;i++)assert.equal((await app.server.inject({method:'POST',url:'/v1/auth/backchannel-logout',headers:{'content-type':'application/x-www-form-urlencoded'},payload:new URLSearchParams({logout_token:signed}).toString()})).statusCode,200);
      assert.equal(await f.identity.authenticate(grant.handle),null);
      assert.equal((await f.pool.query('SELECT count(*)::int AS n FROM identity_logout_events')).rows[0].n,1);
    }finally{await app.stop();await f.close();}
    for(const overrides of [{iss:'https://foreign.invalid'},{aud:'foreign'},{events:{}},{nonce:'forbidden'},{sid:''},{iat:0},{iat:Math.floor(Date.now()/1000)+60}])
      await assert.rejects(adapter.verifyLogout(await sign(overrides)),{message:'logout_refused'});
    keys=[{...await exportJWK(second.publicKey),kid:'second',alg:'RS256',use:'sig'}];
    assert.equal((await adapter.verifyLogout(await sign({jti:'rotated'},true))).jti,'rotated');
    await assert.rejects(adapter.verifyLogout('malformed'),{message:'logout_refused'});
  } finally {await new Promise<void>(resolve=>server.close(()=>resolve()));await tls.close();}
});
