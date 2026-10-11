-- Up Migration
-- Owner: identity. Opaque mapping, binding state and minimal synthetic audit only.
CREATE TABLE identity_accounts (
 id uuid PRIMARY KEY, issuer text NOT NULL, subject text NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','deleting')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(issuer,subject)
);
CREATE TABLE identity_login_attempts (
 id uuid PRIMARY KEY, state_hash text NOT NULL UNIQUE, binding_ciphertext text NOT NULL,
 binding_key_id text NOT NULL, return_uri text NOT NULL, return_challenge text NOT NULL,
 expires_at timestamptz NOT NULL, claimed_at timestamptz
);
CREATE TABLE identity_return_tickets (
 id uuid PRIMARY KEY, ticket_hash text NOT NULL UNIQUE, account_id uuid NOT NULL REFERENCES identity_accounts(id),
 return_challenge text NOT NULL, provider_sid text NOT NULL, tokens_ciphertext text NOT NULL,
 tokens_key_id text NOT NULL, expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE identity_audit_events (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, device_id uuid, operation text NOT NULL,
 outcome text NOT NULL, occurred_at timestamptz NOT NULL, policy_revision text NOT NULL
);
CREATE TABLE identity_deletions (
 id uuid PRIMARY KEY, account_id uuid NOT NULL UNIQUE REFERENCES identity_accounts(id),
 created_at timestamptz NOT NULL DEFAULT now(), provider_pending boolean NOT NULL DEFAULT true
);
CREATE TABLE identity_logout_events (
 issuer text NOT NULL, jti text NOT NULL, sid text NOT NULL, issued_at timestamptz NOT NULL,
 PRIMARY KEY(issuer,jti)
);
-- Down Migration
DROP TABLE identity_logout_events;
DROP TABLE identity_deletions;
DROP TABLE identity_audit_events;
DROP TABLE identity_return_tickets;
DROP TABLE identity_login_attempts;
DROP TABLE identity_accounts;
