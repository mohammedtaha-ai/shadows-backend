import type { ColumnType, Generated } from 'kysely';
type Time = ColumnType<Date, Date | string, Date | string>;
type DefaultTime = ColumnType<Date, Date | string | undefined, Date | string>;
type OptionalTime = ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;
export interface Database {
  links_laptops: {id:string;account_id:string;device_id:string;session_id:string;name:string;revoked_at:OptionalTime;online:Generated<boolean>;last_seen_at:OptionalTime;producer_id:ColumnType<string|null,string|null|undefined,string|null>;epoch:ColumnType<string,string|number|undefined,string|number>;ack_through:ColumnType<string,string|number|undefined,string|number>};
  links_pairing_codes: {account_id:string;device_id:string;session_id:string;code_hash:string;name:string;expires_at:Date};
  links_claim_commands: {account_id:string;command_id:string;fingerprint:string;laptop_id:string;result:unknown};
  links_rate_windows: {account_id:string;key:string;window_start:Date;count:number};
  links_ingress_receipts: {laptop_id:string;producer_id:string;seq:ColumnType<string,string|number,string|number>;fingerprint:string;dropped:boolean;expires_at:Date};
  activity_cursors: {account_id:string;high_water:ColumnType<string,string|number|undefined,string|number>;floor:ColumnType<string,string|number|undefined,string|number>};
  activity_events: {account_id:string;seq:ColumnType<string,string|number,string|number>;kind:'laptop_online'|'laptop_offline'|'laptop_unlinked'|'session_changed';laptop_id:string;session_id:string|null;payload:Record<string,unknown>;expires_at:Time};
  identity_accounts: { id: string; issuer: string; subject: string; status: Generated<'active' | 'deleting'>; created_at: DefaultTime };
  identity_login_attempts: { id: string; state_hash: string; binding_ciphertext: string; binding_key_id: string; return_uri: string; return_challenge: string; expires_at: Time; claimed_at: OptionalTime };
  identity_return_tickets: { id: string; ticket_hash: string; account_id: string; return_challenge: string; provider_sid: string; tokens_ciphertext: string; tokens_key_id: string; expires_at: Time; consumed_at: OptionalTime };
  devices: { id: string; account_id: string; enrollment_hash: ColumnType<string|null,string|null|undefined,string|null>; created_at: DefaultTime; revoked_at: OptionalTime };
  identity_sessions: { id: string; handle_hash: string; account_id: string; device_id: string; provider_sid: string; tokens_ciphertext: string; tokens_key_id: string; issued_at: DefaultTime; last_active_at: Time; absolute_expires_at: Time; provider_refreshed_at: Time; revoked_at: OptionalTime; provider_logout: Generated<'pending' | 'complete'> };
  identity_logout_tickets: { id: string; ticket_hash: string; session_id: string; input_ciphertext: string; input_key_id: string; callback_state_hash: string; expires_at: Time; consumed_at: OptionalTime; callback_at: OptionalTime; revocation_succeeded: Generated<boolean>; attempts: Generated<number> };
  identity_logout_events: { issuer: string; jti: string; sid: string; issued_at: Time };
  identity_audit_events: { id: string; account_id: string; device_id: string | null; operation: string; outcome: string; occurred_at: Time; policy_revision: string };
  identity_deletions: { id: string; account_id: string; created_at: DefaultTime; provider_pending: Generated<boolean> };
}
