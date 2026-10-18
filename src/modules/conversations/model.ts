export type TopicView = {topicId:string;title:string;project:null;state:'open';connectionId:string;model:string;createdAt:string;updatedAt:string;lastSeq:number};
export type TopicCreate = {commandId:string;title?:string;connectionId?:string};
export type TurnRequest = {commandId:string;message:string};
export type TurnAccepted = {turnId:string;entryId:string;seq:number};
export type MessageEntry = {type:'user_message';entryId:string;turnId:string;seq:number;createdAt:string;text:string} |
 {type:'assistant_message';entryId:string;turnId:string;seq:number;createdAt:string;text:string;status:'streaming'|'complete'|'partial';answeredBy:'cloud';sources:never[]};
export type TopicEvent = {type:'entry_added'|'entry_updated';seq:number;entry:MessageEntry}|{type:'topic_updated';seq:number;topic:TopicView}|
 {type:'delta';seq:number;entryId:string;text:string}|
 {type:'turn_finished';seq:number;turnId:string;connectionId:string;model:string;outcome:'done'|'error'|'cancelled';code?:string};
export type TurnCompletion={state:'done'|'error'|'cancelled'|'interrupted';outcome:'done'|'error'|'cancelled';partial:boolean;code?:string};
