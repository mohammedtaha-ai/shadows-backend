import type {LinksService} from '../links/index.js';
export type SessionLinks=Pick<LinksService,'requireConnection'|'receipts'|'commitReceipts'|'visible'|'bindSessions'>;
