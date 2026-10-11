import type { ColumnType, Generated } from 'kysely';
type Time = ColumnType<Date, Date | string, Date | string>;
type DefaultTime = ColumnType<Date, Date | string | undefined, Date | string>;
type OptionalTime = ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;
export interface Database {
  identity_accounts: { id: string; issuer: string; subject: string; status: Generated<'active' | 'deleting'>; created_at: DefaultTime };
  identity_login_attempts: { id: string; state_hash: string; binding_ciphertext: string; binding_key_id: string; return_uri: string; return_challenge: string; expires_at: Time; claimed_at: OptionalTime };
  identity_return_tickets: { id: string; ticket_hash: string; account_id: string; return_challenge: string; provider_sid: string; tokens_ciphertext: string; tokens_key_id: string; expires_at: Time; consumed_at: OptionalTime };
  devices: { id: string; account_id: string; created_at: DefaultTime; revoked_at: OptionalTime };
  identity_sessions: { id: string; handle_hash: string; account_id: string; device_id: string; provider_sid: string; tokens_ciphertext: string; tokens_key_id: string; issued_at: DefaultTime; last_active_at: Time; absolute_expires_at: Time; revoked_at: OptionalTime; provider_logout: Generated<'pending' | 'complete'> };
  identity_logout_tickets: { id: string; ticket_hash: string; session_id: string; input_ciphertext: string; input_key_id: string; callback_state_hash: string; expires_at: Time; consumed_at: OptionalTime; callback_at: OptionalTime; revocation_succeeded: Generated<boolean>; attempts: Generated<number> };
  identity_logout_events: { issuer: string; jti: string; sid: string; issued_at: Time };
  identity_audit_events: { id: string; account_id: string; device_id: string | null; operation: string; outcome: string; occurred_at: Time; policy_revision: string };
  identity_deletions: { id: string; account_id: string; created_at: DefaultTime; provider_pending: Generated<boolean> };
}
