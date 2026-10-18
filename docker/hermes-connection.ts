import {readHermesTarget,type HermesTarget} from '../src/integrations/hermes/target.js';
export {readHermesTarget,type HermesTarget};
export type HermesProbe={state:'ready'|'unavailable'|'auth_required'|'unsupported'|'invalid_response';modelCallMade:false};
/** Operator-owned target; no request, URL query or provider setting chooses it. */
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
async function readJson(response:Response):Promise<unknown>{
 const reader=response.body?.getReader();if(!reader)throw new Error('invalid_response');
 const chunks:Uint8Array[]=[];let size=0;
 try{
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>65536){await reader.cancel();throw new Error('invalid_response');}chunks.push(value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
 }catch{throw new Error('invalid_response');}
 finally{reader.releaseLock();}
}
/** Readiness only: never submit a prompt, list a private history or launch Hermes. */
export async function probeHermes(target:HermesTarget,key?:string):Promise<HermesProbe>{
 const result=(state:HermesProbe['state']):HermesProbe=>({state,modelCallMade:false});
 const get=async(path:string,credential?:string)=>fetch(target.origin+path,{redirect:'error',
  signal:AbortSignal.timeout(target.timeoutMs),headers:credential?{authorization:`Bearer ${credential}`}:{}});
 try{
  const health=await get('/health');if(!health.ok){await health.body?.cancel();return result('unavailable');}
  const status=await readJson(health);
  if(!object(status)||status.status!=='ok'||status.platform!=='hermes-agent')return result('unsupported');
  if(!key)return result('auth_required');
  const response=await get('/v1/capabilities',key);
  if(response.status===401||response.status===403){await response.body?.cancel();return result('auth_required');}
  if(!response.ok){await response.body?.cancel();return result('unavailable');}
  const capabilities=await readJson(response);
  if(!object(capabilities)||capabilities.object!=='hermes.api_server.capabilities'||capabilities.platform!=='hermes-agent')return result('unsupported');
  const features=capabilities.features,runtime=capabilities.runtime,auth=capabilities.auth;
  if(!object(auth)||auth.type!=='bearer'||auth.required!==true)return result('unsupported');
  if(!object(features)||!object(runtime)||runtime.mode!=='server_agent'||runtime.split_runtime!==false)return result('unsupported');
  return result(['run_submission','run_status','run_events_sse','run_stop','session_resources'].every(name=>features[name]===true)?'ready':'unsupported');
 }catch(error){return result(error instanceof Error&&error.message==='invalid_response'?'invalid_response':'unavailable');}
}
