// Shared actual-HTTP journey. CLI execution is human-run and never prints input values.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {createInterface} from 'node:readline/promises';
import createClient from 'openapi-fetch';
import type {paths,components} from '../api/nylra-v1.js';
import {syntheticLogin} from './synthetic-login.js';

type TopicEvent=components['schemas']['TopicEvent'];
async function topicStream(origin:string,handle:string,id:string,after:number){
 const abort=new AbortController();
 const response=await fetch(`${origin}/v1/nylra/topics/${id}/events?after=${after}`,{headers:{authorization:`Bearer ${handle}`},signal:AbortSignal.any([abort.signal,AbortSignal.timeout(30000)])});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type')??'',/text\/event-stream/);
 const reader=response.body!.getReader(),decoder=new TextDecoder(),events:TopicEvent[]=[];let text='',last=after;
 return {
  async next():Promise<TopicEvent>{
   while(!events.length){
    const part=await reader.read();assert.equal(part.done,false,'topic stream ended before its terminal event');text+=decoder.decode(part.value,{stream:true});
    const frames=text.split('\n\n');text=frames.pop()!;
    for(const frame of frames){const data=/^data: (.+)$/m.exec(frame)?.[1];if(!data)continue;const event=JSON.parse(data) as TopicEvent;assert.equal(Number(/^id: (\d+)$/m.exec(frame)?.[1]),event.seq);events.push(event);}
   }
   const event=events.shift()!;assert.equal(event.seq,last+1,'topic sequence must remain gapless');last=event.seq;return event;
  },
  async close(){abort.abort();await reader.cancel().catch(()=>{});},
 };
}

export async function runAccountChatJourney(options:{origin:string;handle:string;baseUrl:string;model:string;apiKey:string;restart:()=>Promise<string>;onStep?:(step:string)=>void}){
 let origin=options.origin;
 const client=()=>createClient<paths>({baseUrl:origin,headers:{authorization:`Bearer ${options.handle}`},fetch:request=>fetch(request,{signal:AbortSignal.any([request.signal,AbortSignal.timeout(15000)])})});
 const streams:Awaited<ReturnType<typeof topicStream>>[]=[],checks:string[]=[];
 let connectionId:string|undefined,topicId:string|undefined,previous:string|null=null;
 const step=(name:string)=>{options.onStep?.(name);};
 try{
  step('connection');const defaults=await client().GET('/v1/nylra/connections/default');assert.equal(defaults.response.status,200);previous=defaults.data!.connectionId;
  const connection=await client().POST('/v1/nylra/connections',{body:{name:'Synthetic chat journey '+randomUUID().slice(0,8),format:'openai_compatible',baseUrl:options.baseUrl,model:options.model,apiKey:options.apiKey}});
  assert.equal(connection.response.status,200);assert.ok(connection.data);connectionId=connection.data.connectionId;
  assert.ok(!JSON.stringify(connection.data).includes('apiKey'),'connection response must be credential-free');
  assert.equal((await client().PUT('/v1/nylra/connections/default',{body:{connectionId}})).response.status,200);
  checks.push('saved_connection_and_default');
  step('topic');const topic=await client().POST('/v1/nylra/topics',{body:{commandId:randomUUID(),title:'Synthetic account chat'}});assert.equal(topic.response.status,200);assert.ok(topic.data);topicId=topic.data.topicId;
  assert.equal(topic.data.connectionId,connectionId);assert.equal(topic.data.model,options.model);
  const first=await topicStream(origin,options.handle,topicId,topic.data.lastSeq);streams.push(first);
  step('reply');const turn=await client().POST('/v1/nylra/topics/{topicId}/turns',{params:{path:{topicId}},body:{commandId:randomUUID(),message:'Reply with a short synthetic greeting.'}});assert.equal(turn.response.status,200);assert.ok(turn.data);
  let text='';for(;;){const event=await first.next();if(event.type==='delta')text+=event.text;if(event.type==='turn_finished'){assert.equal(event.turnId,turn.data.turnId);assert.equal(event.outcome,'done');assert.equal(event.connectionId,connectionId);assert.equal(event.model,options.model);break;}}
  assert.ok(text.length>0,'reply must stream nonempty text');await first.close();checks.push('streamed_persisted_reply');
  const snapshot=await client().GET('/v1/nylra/topics/{topicId}',{params:{path:{topicId}}});assert.equal(snapshot.response.status,200);assert.ok(snapshot.data);
  const saved=snapshot.data.entries.find(e=>e.type==='assistant_message');assert.ok(saved&&saved.type==='assistant_message');assert.equal(saved.text,text);assert.equal(saved.status,'complete');
  step('stop');const second=await topicStream(origin,options.handle,topicId,snapshot.data.cursor);streams.push(second);
  const next=await client().POST('/v1/nylra/topics/{topicId}/turns',{params:{path:{topicId}},body:{commandId:randomUUID(),message:'Write 500 numbered short synthetic test items, one per line.'}});assert.equal(next.response.status,200);assert.ok(next.data);
  let prefix='';for(;;){const event=await second.next();assert.notEqual(event.type,'turn_finished','second generation must remain active until Stop');if(event.type==='delta'){prefix+=event.text;break;}}
  assert.equal((await client().POST('/v1/nylra/topics/{topicId}/turns/{turnId}/cancel',{params:{path:{topicId,turnId:next.data.turnId}},body:{}})).response.status,200);
  for(;;){const event=await second.next();if(event.type==='turn_finished'){assert.equal(event.turnId,next.data.turnId);assert.equal(event.outcome,'cancelled');break;}}
  await second.close();checks.push('stop_committed_partial');
  const before=await client().GET('/v1/nylra/topics/{topicId}',{params:{path:{topicId}}});assert.equal(before.response.status,200);assert.ok(before.data);
  const partial=before.data.entries.find(e=>e.type==='assistant_message'&&e.turnId===next.data!.turnId);assert.ok(partial&&partial.type==='assistant_message');assert.equal(partial.status,'partial');assert.ok(partial.text.startsWith(prefix));
  step('restart');origin=await options.restart();
  const restored=await client().GET('/v1/nylra/topics/{topicId}',{params:{path:{topicId}}});assert.equal(restored.response.status,200);assert.deepEqual(restored.data,before.data);checks.push('history_after_restart_step');
  step('delete');assert.equal((await client().DELETE('/v1/nylra/topics/{topicId}',{params:{path:{topicId}},body:{confirm:true}})).response.status,200);
  assert.equal((await client().GET('/v1/nylra/topics/{topicId}',{params:{path:{topicId}}})).response.status,404);topicId=undefined;checks.push('topic_delete_refuses_reads');
  return {checks};
 }finally{
  await Promise.allSettled(streams.map(stream=>stream.close()));
  let clean=true;
  if(topicId)try{const result=await client().DELETE('/v1/nylra/topics/{topicId}',{params:{path:{topicId}},body:{confirm:true}});clean=[200,404].includes(result.response.status)&&clean;}catch{clean=false;}
  if(connectionId){
   if(previous)try{const result=await client().PUT('/v1/nylra/connections/default',{body:{connectionId:previous}});clean=result.response.status===200&&clean;}catch{clean=false;}
   try{const result=await client().DELETE('/v1/nylra/connections/{connectionId}',{params:{path:{connectionId}}});clean=result.response.status===200&&clean;}catch{clean=false;}
  }
  if(!clean)throw new Error('journey_cleanup_failed');
 }
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 let step='arguments',failed=false,report:string[]|undefined;let auth:ReturnType<typeof syntheticLogin>|undefined,grant:Awaited<ReturnType<ReturnType<typeof syntheticLogin>['login']>>|undefined;
 try{
  const {values}=parseArgs({options:{backend:{type:'string',default:'https://127.0.0.1:8443'},'base-url':{type:'string'},model:{type:'string'},'key-file':{type:'string'},help:{type:'boolean'}}});
  if(values.help)console.log('Human-run Compose journey: --backend https://127.0.0.1:8443 --base-url <provider HTTPS URL> --model <model ID> --key-file <provider key file>. Requires an interactive backend restart. Never run automatically.');
  else{
   auth=syntheticLogin();if(values.backend!==auth.origin||!values['base-url']||!values.model||!values['key-file'])throw new Error('journey_arguments_invalid');
   const apiKey=(await readFile(values['key-file'],'utf8')).trim();if(!apiKey||apiKey.length>512)throw new Error('journey_key_file_invalid');
   step='login';grant=await auth.login({mode:'new'});
   const result=await runAccountChatJourney({origin:auth.origin,handle:grant.handle,baseUrl:values['base-url'],model:values.model,apiKey,onStep:value=>{step=value;},restart:async()=>{
    const terminal=createInterface({input:process.stdin,output:process.stdout});try{await terminal.question('Restart the backend service in another terminal, then press Enter to verify saved chat: ');}finally{terminal.close();}return auth!.origin;
   }});
   report=result.checks;
  }
 }catch{failed=true;console.error(JSON.stringify({result:'FAIL',step}));}
 finally{
  if(auth&&grant)try{const response=await auth.request('/v1/devices/'+grant.principal.deviceId,{method:'DELETE',headers:{authorization:`Bearer ${grant.handle}`}});if(response.status!==200)throw new Error('cleanup_failed');}catch{failed=true;console.error(JSON.stringify({result:'FAIL',step:'created_device_cleanup'}));}
  if(failed)process.exitCode=1;else if(report)console.log(JSON.stringify({result:'PASS',checks:report}));
 }
}
