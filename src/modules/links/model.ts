export type LaptopView={laptopId:string;name:string;status:'online'|'offline';lastSeenAt:string|null};
export type PairingCode={code:string;expiresAt:string};
export type LinkLease={laptopId:string;accountId:string;deviceId:string;sessionId:string;producerId:string;epoch:number;ackThrough:number};
export type Receipt={seq:number;fingerprint:string;dropped:boolean;expiresAt:Date};
