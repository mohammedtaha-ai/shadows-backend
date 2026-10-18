export type AssistantState='submitting'|'running'|'done'|'error'|'cancelled'|'unknown'|'stopping';
export type AssistantConversation={id:string;title:string;createdAt:string;updatedAt:string};
export type AssistantTurn={id:string;commandId:string;input:string;output:string;state:AssistantState;createdAt:string};
export type AssistantSnapshot={conversation:AssistantConversation;turns:AssistantTurn[];truncated:boolean;connection:'ready'|'offline'|'unconfigured'};
