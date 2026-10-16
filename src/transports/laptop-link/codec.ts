import {Value} from '@sinclair/typebox/value';
import {checkClientFrame,ServerFrame,type ClientFrame} from './schema.js';
export function decodeClientFrame(bytes:Buffer):ClientFrame {
 if(bytes.length>65536)throw new Error('frame_too_large');
 let value:unknown;try{value=JSON.parse(bytes.toString('utf8'));}catch{throw new Error('request_invalid');}
 if(!checkClientFrame(value))throw new Error('request_invalid');return value;
}
export function encodeServerFrame(value:unknown):string {
 if(!Value.Check(ServerFrame,value))throw new Error('operation_failed');return JSON.stringify(value);
}
