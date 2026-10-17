// Actual synthetic Compose relay journey. No private DB writes or credential logs.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import createClient from 'openapi-fetch';
import type {paths} from '../api/nylra-v1.js';
import type {ClientFrame} from '../api/laptop-link-v1.js';
import {syntheticLogin} from './synthetic-login.js';
import {laptopPeer} from '../tests/integration/fixtures/laptop-peer.js';

const {origin,request,login}=syntheticLogin();
const ca=await readFile((process.env.LOCAL_RUNTIME??'/local')+'/tls/ca.pem','utf8');
const controllers:AbortController[]=[],peers:Awaited<ReturnType<typeof laptopPeer>>[]=[];
let native:Awaited<ReturnType<typeof login>>|undefined,phone:typeof native,laptopId:string|undefined;
let step='login',failed=false;
function client(handle:string){return createClient<paths>({baseUrl:origin,headers:{authorization:`Bearer ${handle}`},
 fetch:request=>fetch(request,{signal:AbortSignal.any([request.signal,AbortSignal.timeout(15000)])})});}
async function stream(path:string,handle:string) {
 const controller=new AbortController();controllers.push(controller);
 const response=await request(path,{headers:{authorization:`Bearer ${handle}`},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type')??'',/text\/event-stream/);
 return response.body!.getReader();
}
async function event(reader:ReadableStreamDefaultReader<Uint8Array>,expected:number) {
 const decoder=new TextDecoder();let text='';
 while(true){
  const next=await reader.read();assert.equal(next.done,false);text+=decoder.decode(next.value,{stream:true});
  const frames=text.split('\n\n');text=frames.pop()!;
  for(const frame of frames){const id=/^id: (\d+)$/m.exec(frame)?.[1];if(id){assert.equal(Number(id),expected);return frame;}}
 }
}
try{
 native=await login({mode:'new'});phone=await login({mode:'new'});
 const desktop=client(native.handle),mobile=client(phone.handle);
 step='pairing';
 const issued=await desktop.POST('/v1/nylra/laptops/pairing-code',{body:{name:'Synthetic Compose relay'}});
 assert.equal(issued.response.status,200);assert.ok(issued.data);
 const claimed=await mobile.POST('/v1/nylra/laptops/claim',{body:{commandId:randomUUID(),code:issued.data.code}});
 assert.equal(claimed.response.status,200);assert.ok(claimed.data);laptopId=claimed.data.laptopId;
 const schema=JSON.parse(await readFile('api/nylra-v1.openapi.json','utf8'));
 const upgrade=Object.entries(schema.paths).find(([,value])=>(value as {get?:{operationId?:string}}).get?.operationId==='openLaptopLink')?.[0];
 assert.ok(upgrade,'generated_upgrade_path');
 const socketUrl=origin.replace('https:','wss:')+upgrade,producerId=randomUUID();
 const hello:ClientFrame={type:'hello',protocolVersion:1,producerId,lastAck:0};
 const connect=async(lastAck:number)=>{
  const peer=await laptopPeer(socketUrl,native!.handle,s=>s.send(JSON.stringify({...hello,lastAck})),{ca,handshakeTimeout:5000});
  peers.push(peer);return peer;
 };
 step='wss';const first=await connect(0);assert.equal((await first.next()).type,'ready');
 const localSessionId='compose-synthetic-'+randomUUID(),at=new Date().toISOString();
 const batch:ClientFrame={type:'batch',entries:[
  {seq:1,event:{type:'session',localSessionId,agent:'claude_code',projectName:'Synthetic project',cwd:'C:/synthetic',state:'running',at}},
  {seq:2,event:{type:'step',localSessionId,localStepId:'first',tool:'Read',path:'C:/synthetic/a.ts',at}},
 ]};
 first.send(batch);assert.equal((await first.next()).ackThrough,2);
 // Simulate a process that received the ACK but did not persist its checkpoint.
 await first.close();step='reconnect_replay';
 const recovered=await connect(0);assert.equal((await recovered.next()).ackThrough,2);
 recovered.send(batch);assert.equal((await recovered.next()).ackThrough,2);
 const listed=await mobile.GET('/v1/nylra/sessions',{params:{query:{laptopId}}});
 assert.equal(listed.response.status,200);assert.equal(listed.data?.sessions.length,1);
 const id=listed.data!.sessions[0]!.sessionId;
 const snapshot=await mobile.GET('/v1/nylra/sessions/{sessionId}',{params:{path:{sessionId:id}}});
 assert.equal(snapshot.response.status,200);assert.equal(snapshot.data?.steps.length,1);
 const laptops=await mobile.GET('/v1/nylra/laptops');assert.ok(laptops.data);
 assert.equal(laptops.data.laptops.find(l=>l.laptopId===laptopId)?.status,'online');
 step='session_and_account_sse';
 const sessionReader=await stream(`/v1/nylra/sessions/${id}/events?after=${snapshot.data!.cursor}`,phone.handle);
 const accountReader=await stream(`/v1/nylra/events?after=${laptops.data.cursor}`,phone.handle);
 recovered.send({type:'batch',entries:[{seq:3,event:{type:'step',localSessionId,localStepId:'second',tool:'Read',path:'C:/synthetic/b.ts',at:new Date().toISOString()}}]});
 assert.equal((await recovered.next()).ackThrough,3);
 const [sessionEvent,accountEvent]=await Promise.all([event(sessionReader,snapshot.data!.cursor+1),event(accountReader,laptops.data.cursor+1)]);
 assert.match(sessionEvent,/event: step_added/);assert.match(accountEvent,/event: session_changed/);
 await Promise.all([sessionReader.cancel(),accountReader.cancel()]);
 step='unlink';const closed=recovered.waitForClose();
 void closed.catch(()=>{}); // The HTTP refusal is checked before awaiting close.
 const unlinked=await mobile.DELETE('/v1/nylra/laptops/{laptopId}',{params:{path:{laptopId}}});assert.equal(unlinked.response.status,200);
 recovered.send(batch);assert.equal((await closed)[0],1008);
 assert.equal((await mobile.GET('/v1/nylra/sessions/{sessionId}',{params:{path:{sessionId:id}}})).response.status,404);
 laptopId=undefined;
}catch{failed=true;console.error(JSON.stringify({result:'FAIL',step}));}
finally{
 for(const controller of controllers)controller.abort();
 await Promise.all(peers.map(peer=>peer.close()));
 try{
  const actor=phone??native;
  if(actor){
   if(laptopId)await client(actor.handle).DELETE('/v1/nylra/laptops/{laptopId}',{params:{path:{laptopId}}});
   for(const grant of [native,phone])if(grant){
    const result=await request('/v1/devices/'+grant.principal.deviceId,{method:'DELETE',headers:{authorization:`Bearer ${actor.handle}`}});
    assert.equal(result.status,200);
   }
  }
 }catch{failed=true;console.error(JSON.stringify({result:'FAIL',step:'created_device_cleanup'}));}
}
if(failed)process.exitCode=1;
else console.log(JSON.stringify({result:'PASS',ingress:origin,checks:['actual_keycloak_login','pairing','wss','uncheckpointed_ack_recovery','deduplicated_replay','session_sse','account_sse','unlink_refusal','created_device_revocation']}));
