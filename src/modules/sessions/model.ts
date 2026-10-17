export type SessionInput={type:'session';localSessionId:string;agent:'claude_code'|'codex';projectName:string;cwd:string;state:'running'|'waiting'|'ended'|'offline';at:string};
export type StepInput={type:'step';localSessionId:string;localStepId:string;at:string;tool:string;path:string|null};
export type IngressEntry={seq:number;event:SessionInput|StepInput};
export type StepView={stepId:string;seq:number;at:string;tool:string;path:string|null;summary:string};
export type SessionView={sessionId:string;laptopId:string;agent:'claude_code'|'codex';projectName:string;cwd:string;state:'running'|'waiting'|'ended'|'offline';startedAt:string;updatedAt:string;lastStep:StepView|null;lastSeq:number};
export type SessionEvent={type:'step_added';seq:number;step:StepView}|{type:'session_updated';seq:number;session:SessionView};
export type IngestResult={epoch:number;ackThrough:number;dropped:{seq:number;code:'event_expired'}[]};
