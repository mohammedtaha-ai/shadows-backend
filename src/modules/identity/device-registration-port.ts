import type { Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
export interface DeviceRegistrationPort {
 enroll(tx: Transaction<Database>, accountId: string): Promise<{deviceId:string;credential:string}>;
 reuse(tx: Transaction<Database>, accountId: string, credential:string): Promise<string>;
}
