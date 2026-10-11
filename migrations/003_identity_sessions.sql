-- Up Migration
-- Owner: identity. Composite FK prevents cross-account device substitution.
CREATE TABLE identity_sessions (
 id uuid PRIMARY KEY, handle_hash text NOT NULL UNIQUE, account_id uuid NOT NULL REFERENCES identity_accounts(id),
 device_id uuid NOT NULL, provider_sid text NOT NULL, tokens_ciphertext text NOT NULL, tokens_key_id text NOT NULL,
 issued_at timestamptz NOT NULL DEFAULT now(), last_active_at timestamptz NOT NULL DEFAULT now(),
 absolute_expires_at timestamptz NOT NULL, revoked_at timestamptz,
 provider_logout text NOT NULL DEFAULT 'pending' CHECK(provider_logout IN ('pending','complete')),
 FOREIGN KEY(account_id,device_id) REFERENCES devices(account_id,id)
);
CREATE INDEX identity_sessions_provider_sid ON identity_sessions(provider_sid);
CREATE TABLE identity_logout_tickets (
 id uuid PRIMARY KEY, ticket_hash text NOT NULL UNIQUE, session_id uuid NOT NULL REFERENCES identity_sessions(id),
 input_ciphertext text NOT NULL, input_key_id text NOT NULL, callback_state_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, consumed_at timestamptz, callback_at timestamptz,
 revocation_succeeded boolean NOT NULL DEFAULT false, attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3)
);
-- Down Migration
DROP TABLE identity_logout_tickets;
DROP TABLE identity_sessions;
