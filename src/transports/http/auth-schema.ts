import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
const object = <T extends Record<string, ReturnType<typeof Type.String>>>(fields: T) => Type.Object(fields,{additionalProperties:false});
export const Opaque = Type.String({pattern:'^[A-Za-z0-9_-]{43}$'});
const Id = Type.String({pattern:'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'});
export const NativeLogin = Type.Object({platform:Type.Literal('windows'),returnUri:Type.String({maxLength:256}),returnChallenge:Opaque},{additionalProperties:false});
export const LoginStart = Type.Object({attemptId:Id,authorizationUrl:Type.String({maxLength:4096})},{additionalProperties:false});
export const ReturnRequest = object({ticket:Opaque,returnVerifier:Type.String({minLength:43,maxLength:128,pattern:'^[A-Za-z0-9._~-]+$'})});
export const Principal = object({accountId:Id,deviceId:Id,sessionId:Id});
export const SessionGrant = Type.Object({handle:Opaque,principal:Principal,expiresAt:Type.String({maxLength:40})},{additionalProperties:false});
export const LogoutResult = Type.Object({local:Type.Literal('revoked'),provider:Type.Union([Type.Literal('pending'),Type.Literal('complete')]),browserLogoutUrl:Type.Optional(Type.String({maxLength:4096}))},{additionalProperties:false});
export const DeviceList = Type.Array(Type.Object({id:Id,revoked:Type.Boolean()},{additionalProperties:false}));
export const DeviceParams = object({deviceId:Id});
export const Callback = Type.Object({code:Type.Optional(Type.String({minLength:1,maxLength:4096})),state:Type.String({minLength:1,maxLength:256}),error:Type.Optional(Type.String({maxLength:128})),iss:Type.Optional(Type.String({maxLength:512})),session_state:Type.Optional(Type.String({maxLength:512}))},{additionalProperties:false});
export const LogoutCallback = object({state:Opaque});
export const LogoutTicket = object({ticket:Opaque});
export const Backchannel = object({logout_token:Type.String({minLength:1,maxLength:8000})});
export const Refusal = object({code:Type.String({maxLength:64})});
export const Empty = Type.Object({}, {additionalProperties:false});
export function output<T>(schema: Parameters<typeof Value.Check>[0], value:T):T {
  if(!Value.Check(schema,value)) throw new Error('output_invalid'); return value;
}
