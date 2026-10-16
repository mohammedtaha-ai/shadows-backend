import WebSocket from 'ws';
import {once} from 'node:events';
export async function laptopPeer(url:string,handle:string,onOpen?:(socket:WebSocket)=>void,options:WebSocket.ClientOptions={}) {
 const socket=new WebSocket(url,{...options,headers:{authorization:`Bearer ${handle}`}});
 const inbox:unknown[]=[];let waiter:((value:unknown)=>void)|undefined;
 socket.on('message',bytes=>{const value=JSON.parse(bytes.toString());if(waiter){const send=waiter;waiter=undefined;send(value);}else inbox.push(value);});
 socket.on('error',()=>{});if(onOpen)socket.once('open',()=>onOpen(socket));
 await once(socket,'open');
 return {socket,send:(value:unknown)=>socket.send(JSON.stringify(value)),
  async next():Promise<any>{if(inbox.length)return inbox.shift();return Promise.race([new Promise(resolve=>{waiter=resolve;}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('peer_frame_timeout')),5000);timer.unref();})]);},
  async close(){if(socket.readyState===WebSocket.CLOSED)return;const done=once(socket,'close');socket.close();await done;},
 };
}
