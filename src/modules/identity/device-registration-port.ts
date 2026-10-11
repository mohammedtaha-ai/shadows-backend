import type { Transaction } from 'kysely';
import type { Database } from '../../platform/database/schema.js';
export interface DeviceRegistrationPort { create(tx: Transaction<Database>, accountId: string): Promise<string>; }
