import type {FastifyReply} from 'fastify';
import {Value} from '@sinclair/typebox/value';
import type {TSchema} from '@sinclair/typebox';

type Event={seq:number;type:string};
export async function serveEvents(reply:FastifyReply,after:number|undefined,schema:TSchema,
 read:(cursor:number|undefined)=>Promise<{events:Event[];highWater:number}>,guard:(cursor:number,events:Event[])=>Promise<void>) {
 let page=await read(after),cursor=after??page.highWater;
 if(after===undefined)page={events:[],highWater:cursor};
 await guard(cursor,page.events); // Refuse unknown/expired cursors before headers.
 for(const event of page.events)if(!Value.Check(schema,event))throw new Error('operation_failed');
 let wake:(()=>void)|undefined,closed=false,lastHeartbeat=Date.now(),sending=false,checking=false;
 let release!:()=>void;const cancelled=new Promise<void>(resolve=>{release=resolve;});
 let watchdog:ReturnType<typeof setInterval>|undefined,authorization:Promise<void>=Promise.resolve();
 const close=(force=false)=>{closed=true;wake?.();release();if(watchdog)clearInterval(watchdog);if(force)reply.raw.destroy();reply.sse.close();};
 reply.sse.onClose(()=>{closed=true;wake?.();release();if(watchdog)clearInterval(watchdog);});
 reply.sse.sendHeaders();reply.raw.flushHeaders();
 watchdog=setInterval(()=>{
  if(closed||checking)return;checking=true;
  authorization=guard(cursor,[]).then(()=>{
   if(closed)return;if(reply.raw.writableLength>1048576){close(true);return;}
   if(!sending&&Date.now()-lastHeartbeat>=15000){reply.raw.write(': heartbeat\n\n');lastHeartbeat=Date.now();}
  }).catch(()=>close(true)).finally(()=>{checking=false;});
 },15000);watchdog.unref();
 try{
  while(!closed&&reply.sse.isConnected){
   if(reply.raw.writableLength>1048576)break;
   await guard(cursor,page.events);
   for(const event of page.events){
    if(closed)break;if(!Value.Check(schema,event))throw new Error('operation_failed');
    if(event.seq!==cursor+1)throw new Error('resnapshot_required');
    await guard(cursor,[event]);if(closed)break;
    if(reply.raw.writableLength+Buffer.byteLength(JSON.stringify(event))+128>1048576)throw new Error('operation_failed');
    sending=true;let deadline:ReturnType<typeof setTimeout>|undefined;
    try{await Promise.race([reply.sse.send({id:String(event.seq),event:event.type,data:event}),cancelled,
     new Promise<void>(resolve=>{deadline=setTimeout(()=>{close(true);resolve();},15000);deadline.unref();})]);}
    finally{sending=false;if(deadline)clearTimeout(deadline);}
    if(closed)break;cursor=event.seq;
   }
   if(closed)break;
   if(page.events.length<100)await new Promise<void>(resolve=>{const timer=setTimeout(()=>{wake=undefined;resolve();},1000);wake=()=>{clearTimeout(timer);wake=undefined;resolve();};});
   if(!closed)page=await read(cursor);
  }
 }catch{ /* Headers already committed: reconnect obtains the canonical refusal. */ }
 finally{close();await authorization;}
}
export const serveAccountEvents=serveEvents;
export const serveSessionEvents=serveEvents;
export const serveTopicEvents=serveEvents;
