import type WebSocket from 'ws';
import type {RawData} from 'ws';
import type {Principal} from '../../modules/identity/index.js';
import type {LinksService,LinkLease} from '../../modules/links/index.js';
import type {SessionsService} from '../../modules/sessions/index.js';
import {decodeClientFrame,encodeServerFrame} from './codec.js';

export function attachConnection(socket:WebSocket,principal:Principal,links:LinksService,sessions:SessionsService,clock:()=>Date) {
 let lease:LinkLease|undefined,closed=false,running=false,pendingBytes=0,lastPong=clock().getTime(),checking=false;
 const queue:Buffer[]=[];let finish!:()=>void;
 const done=new Promise<void>(resolve=>{finish=resolve;});
 let work:Promise<void>=Promise.resolve(),heartbeat:Promise<void>=Promise.resolve();let deadline:ReturnType<typeof setTimeout>|undefined;
 const stop=(code:number)=>{
  if(closed)return;closed=true;queue.length=0;pendingBytes=0;clearInterval(timer);
  if(socket.readyState===socket.OPEN){socket.close(code);deadline=setTimeout(()=>socket.terminate(),2000);deadline.unref();}
 };
 const failure=(error:unknown)=>{
  const reason=error instanceof Error?error.message:'';
  if(!closed&&socket.readyState===socket.OPEN&&socket.bufferedAmount<1048000){
   const code=['unauthorized','not_found','resnapshot_required','request_invalid','command_conflict'].includes(reason)?reason:'operation_failed';
   socket.send(encodeServerFrame({type:'refusal',code}),()=>{});
  }
  stop(reason==='frame_too_large'?1009:['unauthorized','not_found','resnapshot_required'].includes(reason)?1008:['request_invalid','command_conflict'].includes(reason)?1002:1013);
 };
 const send=async(value:unknown)=>{
  if(!lease)throw new Error('request_invalid');await links.assertConnection(principal,lease);
  if(closed||socket.readyState!==socket.OPEN)return;
  const text=encodeServerFrame(value);if(socket.bufferedAmount+Buffer.byteLength(text)>1048576){stop(1013);return;}
  socket.send(text,error=>{if(error)stop(1013);});
 };
 const run=async()=>{
  if(running)return;running=true;
  try{
   while(queue.length&&!closed){const bytes=queue.shift()!;pendingBytes-=bytes.length;const frame=decodeClientFrame(bytes);
    if(!lease){if(frame.type!=='hello')throw new Error('request_invalid');lease=await links.open(principal,frame.producerId,frame.lastAck);
     if(closed)break;await send({type:'ready',epoch:lease.epoch,ackThrough:lease.ackThrough,dropped:lease.dropped});
    }else{if(frame.type!=='batch')throw new Error('request_invalid');const result=await sessions.ingest(principal,lease,frame.entries);await send({type:'ack',...result});}
   }
  }catch(error){failure(error);}finally{running=false;}
 };
 const message=(raw:RawData,binary:boolean)=>{
  if(closed)return;if(binary){stop(1002);return;}
  const bytes=Buffer.isBuffer(raw)?raw:Array.isArray(raw)?Buffer.concat(raw):Buffer.from(raw);
  if(bytes.length>65536){stop(1009);return;}
  if(queue.length+(running?1:0)>=4||pendingBytes+bytes.length>262144){stop(1013);return;}
  pendingBytes+=bytes.length;queue.push(bytes);if(!running)work=run();
 };
 // Installed synchronously; awaited hello authorization cannot lose the next message.
 socket.on('message',message);socket.on('pong',()=>{lastPong=clock().getTime();});
 socket.on('error',()=>stop(1013));
 const timer=setInterval(()=>{
  if(closed||checking)return;
  if(!lease){stop(1002);return;}if(clock().getTime()-lastPong>=45000){stop(1008);return;}
  checking=true;heartbeat=links.assertConnection(principal,lease).then(()=>{if(!closed)socket.ping();}).catch(failure).finally(()=>{checking=false;});
 },15000);timer.unref();
 socket.once('close',()=>{
  closed=true;clearInterval(timer);if(deadline)clearTimeout(deadline);socket.off('message',message);queue.length=0;
  void Promise.all([work,heartbeat]).catch(()=>{}).then(()=>lease?links.close(lease):undefined).catch(()=>{}).finally(finish);
 });
 return {done,stop:()=>stop(1001)};
}
