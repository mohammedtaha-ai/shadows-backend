import type { ProviderSettingsService } from '../provider-settings/index.js';

export type ReplyCategory = 'credential_rejected'|'model_unavailable'|'quota'|'network'|'destination_refused'|'context_too_large';
export type ReplyPart = string | {finish:'done'|'length'} | {finish:'error';category?:ReplyCategory};
export type ReplyInput = {
 connection:Awaited<ReturnType<ProviderSettingsService['resolveForDispatch']>>;
 history:readonly {role:'user'|'assistant';content:string}[];
 message:string;signal:AbortSignal;maxOutputTokens:number;
};
export type ReplyPort = (input:ReplyInput)=>AsyncIterable<ReplyPart>;
