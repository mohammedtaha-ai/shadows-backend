// NON-PRODUCT opt-in B0 real MiniMax follow-up. No raw errors/headers/config/text saved.
// Root .env is loaded only at runtime; no other credential source is accessed.
import { loadEnvFile } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { streamText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { randomInt } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
try {loadEnvFile(new URL('../../.env',import.meta.url));}catch{console.log('BLOCKED root runtime configuration unavailable (details withheld)');process.exit(1);}
const continuityOnly=process.argv.includes('--continuity-only');
const endpoint='https://api.minimax.io/v1/chat/completions', requestedModel='MiniMax-M3';
const limits={maxCalls:continuityOnly?4:5,maxOutputTokensPerCall:768,maxSerializedInputBytes:32768,perFlowMs:60000,totalMs:180000,automaticRetries:0};
let calls=0, mode, rawAssistant, metadataPresent=[], metadataPreserved=null, requestFacts=[];
const results=[];const overall=AbortSignal.timeout(limits.totalMs);
function capture(delta) {
 if(!rawAssistant)return;
 if(typeof delta.content==='string')rawAssistant.content+=delta.content;
 if(typeof delta.reasoning_content==='string')rawAssistant.reasoning_content=(rawAssistant.reasoning_content??'')+delta.reasoning_content;
 if(Array.isArray(delta.reasoning_details))rawAssistant.reasoning_details=(rawAssistant.reasoning_details??[]).concat(delta.reasoning_details);
 for(const part of delta.tool_calls??[]){const i=part.index??0;const target=rawAssistant.tool_calls[i]??={id:part.id,type:'function',function:{name:'',arguments:''}};if(part.id)target.id=part.id;if(part.function?.name)target.function.name+=part.function.name;if(part.function?.arguments)target.function.arguments+=part.function.arguments;}
}
const safeFetch=async(url,init)=>{
 if(new URL(url).href!==endpoint)throw new Error('B0 origin/path refused');
 if(calls>=limits.maxCalls)throw new Error('B0 call bound');
 const body=JSON.parse(init.body);body.thinking={type:mode==='reasoning'?'adaptive':'disabled'};body.reasoning_split=false;body.max_completion_tokens=limits.maxOutputTokensPerCall;delete body.max_tokens;
 const returnedTool=body.messages.findLast(m=>m.role==='tool');const assistant=body.messages.findLast(m=>m.role==='assistant'&&m.tool_calls?.length);
 if(returnedTool&&rawAssistant){
  metadataPresent=['reasoning_content','reasoning_details'].filter(k=>rawAssistant[k]!=null);
  const contentEqual=(assistant.content??'')===rawAssistant.content;
  const normalizeToolCalls=calls=>calls.map(c=>({id:c.id,type:c.type,name:c.function.name,input:JSON.parse(c.function.arguments)}));
  const toolsEqual=isDeepStrictEqual(normalizeToolCalls(assistant.tool_calls),normalizeToolCalls(rawAssistant.tool_calls));
  metadataPreserved=contentEqual&&toolsEqual&&metadataPresent.every(k=>JSON.stringify(assistant[k])===JSON.stringify(rawAssistant[k]));
  if(mode==='reasoning'&&!metadataPreserved)throw new Error('B0 reasoning metadata continuity refused before provider call');
 }
 const input=JSON.stringify(body);if(Buffer.byteLength(input)>limits.maxSerializedInputBytes)throw new Error('B0 input bound');
 calls++;requestFacts.push({call:calls,mode,hasToolResult:!!returnedTool,assistantToolCallPresent:!!assistant,thinking:body.thinking.type,maxCompletionTokens:body.max_completion_tokens,inputBytes:Buffer.byteLength(input)});
 const response=await fetch(url,{...init,body:input,redirect:'error',signal:AbortSignal.any([init.signal,overall].filter(Boolean))});
 if(!response.ok||!response.body)return response;
 const decoder=new TextDecoder();let buffer='';let shouldCapture=!returnedTool; // capture first tool request, not following final response
 if(shouldCapture)rawAssistant={role:'assistant',content:'',tool_calls:[]};
 const transformed=response.body.pipeThrough(new TransformStream({transform(bytes,controller){
   if(shouldCapture){buffer+=decoder.decode(bytes,{stream:true});if(buffer.length>65536)throw new Error('B0 SSE frame bound');let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end).replace(/\r$/,'');buffer=buffer.slice(end+1);if(line.startsWith('data: ')&&line!=='data: [DONE]'){try{const value=JSON.parse(line.slice(6));capture(value.choices?.[0]?.delta??{});}catch{/* JSON frame handling does not log provider text */}}}}
   controller.enqueue(bytes);
 }}));
 return new Response(transformed,{status:response.status,headers:response.headers});
};
const model=createOpenAI({apiKey:process.env.API_KEY,baseURL:'https://api.minimax.io/v1',fetch:safeFetch}).chat(requestedModel);
let executions=0,fixtureValue;
const fixturePrompt='Call readFixture with count 1. Then answer exactly B0_RESULT=<the numeric value returned by readFixture>. Replace the placeholder with that returned integer, with no other answer text.';
const tools={readFixture:tool({description:'Read a harmless local synthetic fixture. No network or project access.',inputSchema:z.object({count:z.literal(1)}),execute:async({count})=>{executions++;return {count,value:fixtureValue,label:'B0_LOCAL_FIXTURE'};}})};
let reusableMessages;
async function flow(name,reasoning=false,cancel=false){
 mode=reasoning?'reasoning':'non-reasoning';metadataPresent=[];metadataPreserved=null;if(!cancel){rawAssistant=null;fixtureValue=randomInt(10000,1000000);}executions=0;requestFacts=[];
 const before=calls,start=Date.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),limits.perFlowMs);
 const counts={};let text='',thrown=false,finishReason=null,httpStatus=null,usage=null,stepCount=0,aborted=false;
 try{
  const result=streamText({model,tools,maxRetries:0,maxOutputTokens:limits.maxOutputTokensPerCall,abortSignal:AbortSignal.any([controller.signal,overall]),
    ...(cancel?{messages:[...reusableMessages,{role:'user',content:'Using the same fixture value, write 100 short numbered sentences. Begin immediately.'}],toolChoice:'none'}:{prompt:fixturePrompt,stopWhen:stepCountIs(2),prepareStep:({stepNumber})=>({toolChoice:stepNumber===0?'required':'none'})}),
    onError:({error})=>{if(Number.isInteger(error?.statusCode))httpStatus=error.statusCode;},onStepFinish:()=>stepCount++});
  for await(const p of result.fullStream){counts[p.type]=(counts[p.type]??0)+1;if(p.type==='text-delta'){text+=p.text;if(text.length>32768)throw new Error('B0 output text bound');if(cancel&&p.text.length&&!aborted){aborted=true;controller.abort();}}}
  finishReason=await result.finishReason;const u=await result.totalUsage;usage={inputTokens:u.inputTokens??null,outputTokens:u.outputTokens??null,totalTokens:u.totalTokens??null};
  if(!cancel&&!reasoning)reusableMessages=[{role:'user',content:fixturePrompt},...(await result.response).messages];
 }catch{thrown=true;}finally{clearTimeout(timer);}
 // For reasoning-mode only, inspect answer text after the documented <think> block in memory.
 const answer=reasoning?text.replace(/<think>[\s\S]*?<\/think>/g,'').trim():text.trim();
 const match=answer===`B0_RESULT=${fixtureValue}`;
 const pass=cancel?aborted&&text.length>0&&!!counts.abort:!thrown&&!counts.error&&executions===1&&stepCount===2&&match&&requestFacts.some(f=>f.hasToolResult)&&metadataPreserved===true;
 const record={name,status:pass?'PASS':'FAIL',mode,calls:calls-before,elapsedMs:Date.now()-start,counts,textChars:text.length,executions,stepCount,semanticFixtureMatch:!cancel&&match,fixtureValueAbsentFromPrompt:!fixturePrompt.includes(String(fixtureValue)),aborted,thrown,httpStatus,finishReason,usage,metadataPresent,metadataPreserved,requestFacts};results.push(record);console.log(JSON.stringify(record));if(!pass)process.exitCode=1;
 return record;
}
await mkdir('followup-artifacts',{recursive:true});
if(!process.env.API_KEY){results.push({name:'runtime configuration',status:'BLOCKED',reason:'API_KEY unavailable'});process.exitCode=1;}
else {
 const completion=await flow('real non-reasoning tool result round trip');
 if(!continuityOnly&&reusableMessages&&completion.status==='PASS')await flow('real later-round client cancellation',false,true);
 if(![401,403,429].includes(completion.httpStatus)&&calls<=3)await flow('real reasoning tool continuity',true,false);
}
await writeFile('followup-artifacts/minimax-rounds-results.json',JSON.stringify({date:'2026-10-11',endpoint,requestedModel,limits,calls,limitations:['No raw text, reasoning, headers, credentials, request bodies or SDK errors saved.','Client cancellation is not provider-side cancellation or stopped billing.','Cancellation uses a third request after the successful tool round trip.','Reasoning continuity must preserve observed assistant content, tool_calls and any reasoning metadata; refusal occurs before sending a lossy follow-up.'],results},null,2));
