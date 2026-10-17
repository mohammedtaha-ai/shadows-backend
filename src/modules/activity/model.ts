export type AccountChange={type:'laptop_online'|'laptop_offline'|'laptop_unlinked'|'session_changed';laptopId:string;sessionId:string|null;payload:Record<string,unknown>;expiresAt:Date};
export type AccountEvent=AccountChange & {seq:number};
export type ActivityPage={events:AccountEvent[];highWater:number;floor:number};
