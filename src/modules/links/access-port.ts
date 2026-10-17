import type {Transaction} from 'kysely';
import type {Database} from '../../platform/database/schema.js';
import type {Principal} from '../identity/index.js';
export interface LinkAccess {
 authorizeTransaction(tx:Transaction<Database>,principal:Principal):Promise<void>;
 authorizeRevocation(tx:Transaction<Database>,principal:Principal):Promise<void>;
}
