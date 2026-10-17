// Canonical wire v1. Domain services receive mapped inputs, never wire authority.
import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import * as S from '../http/nylra-schema.js';

export const CLIENT_PROTOCOL_VERSION = 1;
const closed = <T extends Parameters<typeof Type.Object>[0]>(fields:T) => Type.Object(fields,{additionalProperties:false});
const localId=Type.String({minLength:1,maxLength:128});
export const SessionInput=closed({type:Type.Literal('session'),localSessionId:localId,
  ...Type.Pick(S.Session,['agent','projectName','cwd','state']).properties,at:S.Timestamp});
export const StepInput=closed({type:Type.Literal('step'),localSessionId:localId,localStepId:localId,
  ...Type.Pick(S.Step,['at','tool','path']).properties});
export const BatchEntry=closed({seq:Type.Integer({minimum:1,maximum:Number.MAX_SAFE_INTEGER}),event:Type.Union([SessionInput,StepInput])});
export const ClientFrame=Type.Union([
  closed({type:Type.Literal('hello'),protocolVersion:Type.Literal(CLIENT_PROTOCOL_VERSION),producerId:S.Id,lastAck:S.Seq}),
  closed({type:Type.Literal('batch'),entries:Type.Array(BatchEntry,{minItems:1,maxItems:20})}),
]);
const result={epoch:Type.Integer({minimum:1,maximum:Number.MAX_SAFE_INTEGER}),ackThrough:S.Seq,
  dropped:Type.Array(closed({seq:S.Seq,code:Type.Literal('event_expired')}),{maxItems:20})};
export const ServerFrame=Type.Union([
  closed({type:Type.Literal('ready'),...result}),closed({type:Type.Literal('ack'),...result}),
  closed({type:Type.Literal('refusal'),...S.NylraRefusal.properties}),
]);
export type ClientFrame=Static<typeof ClientFrame>;
export type ServerFrame=Static<typeof ServerFrame>;
export function checkClientFrame(value:unknown):value is ClientFrame {
  return Value.Check(ClientFrame,value) && (value.type!=='batch'||value.entries.every((entry,i,entries)=>i===0||entry.seq===entries[i-1]!.seq+1));
}
