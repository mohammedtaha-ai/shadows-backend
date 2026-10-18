// Explicit, paid-provider acceptance driver; never included in npm test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHermesClient,type HermesAdmission} from '../src/integrations/hermes/client.js';
import {readHermesTarget} from '../src/integrations/hermes/target.js';

const target=readHermesTarget(process.env),file=process.env.HERMES_JOURNEY_FILE;
if(!file||process.env.HERMES_ACCEPT_PAID_PROBE!=='yes'||!process.env.HERMES_API_KEY_FILE)throw new Error('explicit_acceptance_required');
const key=(await readFile(process.env.HERMES_API_KEY_FILE,'utf8')).trim();
const options={...target,key,network:process.env.HERMES_NETWORK};
const client=()=>createHermesClient(options);
type Receipt={sessionId:string;commandId:string;input:string;admission?:HermesAdmission;output?:string;historyReply?:string;durableIdempotency:boolean;
 followup?:{sessionId:string;commandId:string;input:string;admission?:HermesAdmission};
 stopProbe?:{commandId:string;admission?:HermesAdmission;terminalState?:string;sseEvents?:number};
 conflictRefused?:boolean};
async function save(value:Receipt){await mkdir(dirname(file!),{recursive:true});await writeFile(file!+'.tmp',JSON.stringify(value,null,2));await rename(file!+'.tmp',file!);}
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function finished(admission:HermesAdmission,sessionId:string){
 const deadline=Date.now()+120000;
 while(Date.now()<deadline){const value=await client().getRun(admission.runId,sessionId);
  if(['completed','failed','cancelled','interrupted'].includes(value.state))return value;
  await pause(300);}
 throw new Error('run_deadline');
}
const phase=process.argv[2];
if(phase==='submit'){
 const capability=await client().capabilities();assert.equal(capability.durableIdempotency,true);
 const receipt:Receipt={sessionId:'shadows_probe_'+randomUUID().replaceAll('-',''),commandId:randomUUID(),
  input:'Reply with exactly HERMES_BRIDGE_OK.',durableIdempotency:true};
 await save(receipt);await client().createSession(receipt.sessionId,'Isolated backend recovery test');
 // Test-owned proxy deliberately loses the first admission ACK after Hermes accepted it.
 let accepted:HermesAdmission|undefined;
 const proxy=createServer((req,res)=>{void(async()=>{
  assert.equal(req.url,'/v1/runs');assert.equal(req.method,'POST');
  let body='';for await(const chunk of req){body+=String(chunk);assert.ok(body.length<20000);}
  const upstream=await fetch(target.origin+'/v1/runs',{method:'POST',redirect:'error',
   headers:{authorization:`Bearer ${key}`,'content-type':'application/json','idempotency-key':receipt.commandId},body});
  assert.equal(upstream.status,202);const value=await upstream.json() as {run_id:string;status:HermesAdmission['state'];replayed:boolean};
  accepted={runId:value.run_id,state:value.status,replayed:value.replayed};res.destroy();
 })().catch(()=>res.destroy());});
 await new Promise<void>(resolve=>proxy.listen(0,'127.0.0.1',resolve));
 try{
  const port=(proxy.address() as {port:number}).port;
  const uncertain=createHermesClient({...options,origin:`http://127.0.0.1:${port}`,network:'development-host'});
  await assert.rejects(uncertain.submitRun(receipt),{message:'outcome_unknown'});
  assert.ok(accepted,'The owner must have accepted before the synthetic ACK loss.');
 }finally{proxy.closeAllConnections();await new Promise<void>(resolve=>proxy.close(()=>resolve()));}
 // Explicit identical replay after capability negotiation, not a client retry loop.
 receipt.admission=await client().submitRun(receipt);
 assert.equal(receipt.admission.runId,accepted!.runId);assert.equal(receipt.admission.replayed,true);
 await save(receipt);
 console.log(JSON.stringify({phase:'submit',accepted:true,lostAckRecovered:true,replayed:true,sessionId:receipt.sessionId,runId:receipt.admission.runId}));
}else if(phase==='recover'){
 const receipt=JSON.parse(await readFile(file,'utf8')) as Receipt;assert.ok(receipt.admission);
 const result=await finished(receipt.admission,receipt.sessionId);
 assert.equal(result.state,'completed');assert.equal(result.output?.trim(),'HERMES_BRIDGE_OK');
 receipt.output=result.output;await save(receipt);
 console.log(JSON.stringify({phase:'recover',completed:true,output:receipt.output,newSubmissionMade:false}));
}else if(phase==='continue'){
 const receipt=JSON.parse(await readFile(file,'utf8')) as Receipt;
 receipt.followup??={sessionId:receipt.sessionId,commandId:randomUUID(),
  input:'What exact marker did you return in the previous turn? Reply only with that marker.'};
 await save(receipt);
 const admission=receipt.followup.admission??await client().submitRun(receipt.followup);
 receipt.followup.admission=admission;await save(receipt);
 const result=await finished(admission,receipt.sessionId);
 assert.equal(result.state,'completed');assert.equal(result.output?.trim(),'HERMES_BRIDGE_OK');
 receipt.historyReply=result.output;await save(receipt);
 console.log(JSON.stringify({phase:'continue',completed:true,sessionContinuity:true,output:result.output}));
}else if(phase==='conflict'){
 const receipt=JSON.parse(await readFile(file,'utf8')) as Receipt;
 await assert.rejects(client().submitRun({...receipt,input:'This changed payload must be refused.'}),{message:'command_conflict'});
 receipt.conflictRefused=true;await save(receipt);
 console.log(JSON.stringify({phase:'conflict',changedPayloadRefused:true,newAcceptedRun:false}));
}else if(phase==='stop'){
 const receipt=JSON.parse(await readFile(file,'utf8')) as Receipt;
 receipt.stopProbe??={commandId:randomUUID()};await save(receipt);
 const admission=receipt.stopProbe.admission??await client().submitRun({sessionId:receipt.sessionId,
  commandId:receipt.stopProbe.commandId,input:'Reply with exactly CANCEL_PROBE_OK.'});
 receipt.stopProbe.admission=admission;await save(receipt);
 const ack=await client().stopRun(admission.runId);assert.equal(ack.state,'stopping');
 const result=await finished(admission,receipt.sessionId);assert.equal(result.state,'cancelled');
 receipt.stopProbe.terminalState=result.state;
 const response=await fetch(target.origin+`/v1/runs/${admission.runId}/events`,{redirect:'error',
  headers:{authorization:`Bearer ${key}`},signal:AbortSignal.timeout(5000)});
 assert.equal(response.status,200);assert.ok(response.headers.get('content-type')?.includes('text/event-stream'));
 const wire=await response.text();assert.ok(wire.includes('run.cancelled'));
 const positions=[...wire.matchAll(/^id:\s*(\d+)/gm)].map(match=>Number(match[1]));
 assert.ok(positions.length>0);assert.ok(positions.every((n,i)=>i===0||n>positions[i-1]!));
 const replay=await fetch(target.origin+`/v1/runs/${admission.runId}/events`,{redirect:'error',
  headers:{authorization:`Bearer ${key}`,'last-event-id':String(positions.at(-1))},signal:AbortSignal.timeout(5000)});
 assert.equal(replay.status,200);const replayWire=await replay.text();
 assert.ok([...replayWire.matchAll(/^id:\s*(\d+)/gm)].every(match=>Number(match[1])>positions.at(-1)!));
 receipt.stopProbe.sseEvents=positions.length;await save(receipt);
 console.log(JSON.stringify({phase:'stop',ack:'stopping',terminalState:result.state,sseEvents:positions.length,replayHasNoDuplicates:true}));
}else if(phase==='history'){
 const receipt=JSON.parse(await readFile(file,'utf8')) as Receipt;
 const response=await fetch(target.origin+`/api/sessions/${receipt.sessionId}/messages`,{
  redirect:'error',headers:{authorization:`Bearer ${key}`},signal:AbortSignal.timeout(3000)});
 assert.equal(response.status,200);
 const value=await response.json() as {data:Array<{role:string;content:string}>};
 const people=value.data.filter(message=>message.role==='user');
 const replies=value.data.filter(message=>message.role==='assistant');
 assert.equal(people.filter(message=>message.content==='Reply with exactly HERMES_BRIDGE_OK.').length,1);
 assert.equal(people.length,2);assert.equal(replies.length,2);
 assert.equal(replies.at(-1)?.content.trim(),'HERMES_BRIDGE_OK');
 receipt.historyReply=replies.at(-1)!.content;await save(receipt);
 console.log(JSON.stringify({phase:'history',sessionContinuity:true,userMessages:people.length,assistantMessages:replies.length,
  originalInputAppearsOnce:true,output:receipt.historyReply,newSubmissionMade:false}));
}else throw new Error('phase_required');
