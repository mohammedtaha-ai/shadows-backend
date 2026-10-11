import type { Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
export interface DeviceTrustPort { isActive(tx: Transaction<Database>, accountId: string, deviceId: string): Promise<boolean>; }
