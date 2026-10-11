import type { FastifyInstance } from 'fastify';
import type { IdentityService, NativeLoginRequest } from '../../modules/identity/index.js';
import type { DeviceService } from '../../modules/devices/index.js';
import type { AppConfig } from '../../app/config.js';
import { authenticate } from './authenticate.js';
import * as S from './auth-schema.js';
export function registerAuth(server:FastifyInstance,identity:IdentityService,devices:DeviceService,config:AppConfig) {
  server.addContentTypeParser('application/x-www-form-urlencoded',{parseAs:'string',bodyLimit:8192},(request,body,done)=>{
    const form=new URLSearchParams(body as string),entries=[...form.entries()];
    if(request.url.split('?')[0] !== '/v1/auth/backchannel-logout' || entries.length !== 1 || entries[0]?.[0] !== 'logout_token') {
      done(new Error('request_invalid'));return;
    }
    done(null,{logout_token:entries[0][1]});
  });
  const buckets=new Map<string,{count:number;expires:number}>();
  function limit(key:string) {
    const now=Date.now();for(const [key,bucket] of buckets) if(bucket.expires<=now) buckets.delete(key);
    const prior=buckets.get(key); if(!prior && buckets.size>=10000) throw new Error('rate_limited');
    const bucket=prior ?? {count:0,expires:now+60000};buckets.set(key,bucket);if(++bucket.count>10) throw new Error('rate_limited');
  }
  server.addHook('onRequest',async (_request,reply)=>{reply.header('cache-control','no-store').header('referrer-policy','no-referrer');});
  server.setErrorHandler((error,_request,reply)=>{
    const message=error instanceof Error?error.message:'';
    const known=['request_invalid','unauthorized','login_refused','return_refused','logout_refused','device_refused','rate_limited'];
    const tooLarge=error && typeof error === 'object' && 'code' in error && error.code==='FST_ERR_CTP_BODY_TOO_LARGE';
    const code=tooLarge?'request_invalid':(error && typeof error === 'object' && 'validation' in error && error.validation)?'request_invalid':known.includes(message)?message:'operation_failed';
    const status=tooLarge?413:code==='unauthorized'?401:code==='rate_limited'?429:code==='operation_failed'?503:400;
    reply.code(status).send(S.output(S.Refusal,{code}));
  });
  const errors={413:S.Refusal,400:S.Refusal,401:S.Refusal,429:S.Refusal,503:S.Refusal};
  server.post('/v1/auth/login',{schema:{body:S.NativeLogin,response:{200:S.LoginStart,...errors}}},async request=>{
    limit('login:'+request.ip);return S.output(S.LoginStart,await identity.beginLogin(request.body as NativeLoginRequest));
  });
  server.get('/v1/auth/callback',{schema:{querystring:S.Callback,response:errors}},async (request,reply)=>{
    const callback=new URL(config.callbackUrl);const query=request.query as Record<string,string>;
    for(const [key,value] of Object.entries(query)) callback.searchParams.set(key,value);
    const result=await identity.finishLogin(callback), uri=new URL(result.returnUri);uri.searchParams.set('ticket',result.ticket);
    return reply.redirect(uri.href);
  });
  server.post('/v1/auth/return',{schema:{body:S.ReturnRequest,response:{200:S.SessionGrant,...errors}}},async request=>{
    const input=request.body as {ticket:string;returnVerifier:string};limit('return:'+input.ticket);
    return S.output(S.SessionGrant,await identity.redeemReturn(input));
  });
  server.get('/v1/auth/session',{schema:{response:{200:S.Principal,...errors}}},async request=>S.output(S.Principal,await authenticate(request,identity)));
  server.post('/v1/auth/logout',{schema:{body:S.Empty,response:{200:S.LogoutResult,...errors}}},async request=>S.output(S.LogoutResult,await identity.logout(await authenticate(request,identity))));
  server.post('/v1/auth/logout-all',{schema:{body:S.Empty,response:{200:S.LogoutResult,...errors}}},async request=>S.output(S.LogoutResult,await identity.logoutAll(await authenticate(request,identity))));
  server.get('/v1/devices',{schema:{response:{200:S.DeviceList,...errors}}},async request=>S.output(S.DeviceList,await devices.list(await authenticate(request,identity))));
  server.delete('/v1/devices/:deviceId',{schema:{params:S.DeviceParams,response:{200:S.Empty,...errors}}},async request=>{
    await devices.revoke(await authenticate(request,identity),(request.params as {deviceId:string}).deviceId);return S.output(S.Empty,{});
  });
  server.post('/v1/auth/backchannel-logout',{schema:{consumes:['application/x-www-form-urlencoded','application/json'],body:S.Backchannel,response:{200:S.Empty,...errors}}},async request=>{
    await identity.backchannelLogout((request.body as {logout_token:string}).logout_token);return S.output(S.Empty,{});
  });
  server.get('/v1/auth/provider-logout',{schema:{querystring:S.LogoutTicket,response:errors}},async (request,reply)=>reply.redirect(await identity.beginProviderLogout((request.query as {ticket:string}).ticket)));
  server.get('/v1/auth/logout-callback',{schema:{querystring:S.LogoutCallback,response:{200:S.Empty,...errors}}},async request=>{
    await identity.finishProviderLogout((request.query as {state:string}).state);return S.output(S.Empty,{});
  });
}
