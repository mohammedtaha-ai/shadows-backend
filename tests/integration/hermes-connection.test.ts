import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {readHermesTarget, probeHermes} from '../../docker/hermes-connection.js';

const capabilities={object:'hermes.api_server.capabilities',platform:'hermes-agent',
 auth:{type:'bearer',required:true},
 runtime:{mode:'server_agent',split_runtime:false},features:{run_submission:true,
 run_status:true,run_events_sse:true,run_stop:true,session_resources:true}};
async function fixture(handler:(req:IncomingMessage,res:ServerResponse)=>void){
 const target=readHermesTarget({HERMES_API_URL:'http://127.0.0.1:1',HERMES_NETWORK:'development-host'});
 const server=createServer(handler);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=(server.address() as {port:number}).port;
 return {target:{...target,origin:`http://127.0.0.1:${port}`},
  async close(){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
test('hermes_target_rejects_credentials_query_paths_and_unreviewed_plain_http',()=>{
 for(const url of ['http://other:8642','https://user:pass@example.test','https://example.test/?key=hidden','https://example.test/api'])
  assert.throws(()=>readHermesTarget({HERMES_API_URL:url}),{message:'hermes_config_invalid'});
 assert.equal(readHermesTarget({HERMES_API_URL:'http://hermes:8642',HERMES_NETWORK:'private-service'}).origin,'http://hermes:8642');
 assert.equal(readHermesTarget({HERMES_API_URL:'https://hermes.example.test'}).origin,'https://hermes.example.test');
});
test('hermes_probe_requires_key_then_checks_native_capabilities_without_model_call',async()=>{
 const paths:string[]=[];const headers:Array<string|undefined>=[];
 const f=await fixture((req,res)=>{paths.push(req.url!);headers.push(req.headers.authorization);res.setHeader('content-type','application/json');
  res.end(JSON.stringify(req.url==='/health'?{status:'ok',platform:'hermes-agent'}:capabilities));});
 try{
  assert.equal((await probeHermes(f.target)).state,'auth_required');
  const result=await probeHermes(f.target,'synthetic-probe-key');
  assert.equal(result.state,'ready');assert.equal(result.modelCallMade,false);
  assert.deepEqual(paths,['/health','/health','/v1/capabilities']);
  assert.deepEqual(headers,[undefined,undefined,'Bearer synthetic-probe-key']);
  assert.ok(!JSON.stringify(result).includes('synthetic-probe-key'));
 }finally{await f.close();}
});
test('hermes_probe_redacts_rejected_auth_body',async()=>{
 const f=await fixture((req,res)=>{if(req.url==='/health')res.end(JSON.stringify({status:'ok',platform:'hermes-agent'}));
  else{res.statusCode=401;res.end('private diagnostic and synthetic-probe-key');}});
 try{assert.deepEqual(await probeHermes(f.target,'synthetic-probe-key'),{state:'auth_required',modelCallMade:false});}finally{await f.close();}
});
test('hermes_probe_does_not_follow_redirects_or_send_key_to_another_origin',async()=>{
 let calls=0;const f=await fixture((_req,res)=>{calls++;res.statusCode=302;res.setHeader('location','http://127.0.0.1:1/private');res.end();});
 try{assert.equal((await probeHermes(f.target,'synthetic-probe-key')).state,'unavailable');assert.equal(calls,1);}finally{await f.close();}
});
test('hermes_probe_refuses_lookalike_or_missing_native_run_surface',async()=>{
 const f=await fixture((req,res)=>res.end(JSON.stringify(req.url==='/health'?{status:'ok',platform:'hermes-agent'}:
  {...capabilities,features:{...capabilities.features,run_stop:false}})));
 try{assert.equal((await probeHermes(f.target,'synthetic-probe-key')).state,'unsupported');}finally{await f.close();}
});
test('hermes_probe_refuses_a_native_api_without_required_bearer_auth',async()=>{
 const f=await fixture((req,res)=>res.end(JSON.stringify(req.url==='/health'?{status:'ok',platform:'hermes-agent'}:
  {...capabilities,auth:{type:'bearer',required:false}})));
 try{assert.equal((await probeHermes(f.target,'synthetic-probe-key')).state,'unsupported');}finally{await f.close();}
});
test('hermes_probe_bounds_response_bytes_and_deadline',async()=>{
 const f=await fixture((_req,res)=>{res.end('x'.repeat(70000));});
 try{assert.equal((await probeHermes(f.target,'synthetic-probe-key')).state,'invalid_response');}finally{await f.close();}
 const slow=await fixture(()=>{});
 try{assert.equal((await probeHermes({...slow.target,timeoutMs:30},'synthetic-probe-key')).state,'unavailable');}finally{await slow.close();}
});
