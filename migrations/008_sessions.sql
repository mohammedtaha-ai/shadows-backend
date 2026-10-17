-- Up Migration
-- Owner: Sessions. Counters survive payload expiry; identities are server generated.
CREATE TABLE sessions_sessions (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, laptop_id uuid NOT NULL, producer_id uuid NOT NULL,
 local_id text NOT NULL, payload jsonb, expires_at timestamptz NOT NULL,
 high_water bigint NOT NULL DEFAULT 0 CHECK(high_water BETWEEN 0 AND 9007199254740991),
 floor bigint NOT NULL DEFAULT 0 CHECK(floor BETWEEN 0 AND high_water),
 UNIQUE(laptop_id,producer_id,local_id)
);
CREATE TABLE sessions_steps (
 id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES sessions_sessions(id), local_id text NOT NULL,
 seq bigint NOT NULL, fingerprint text NOT NULL, payload jsonb NOT NULL, expires_at timestamptz NOT NULL,
 UNIQUE(session_id,local_id)
);
CREATE TABLE sessions_events (
 session_id uuid NOT NULL REFERENCES sessions_sessions(id), seq bigint NOT NULL,
 payload jsonb NOT NULL, expires_at timestamptz NOT NULL, PRIMARY KEY(session_id,seq)
);
CREATE INDEX sessions_account ON sessions_sessions(account_id,laptop_id);
CREATE INDEX sessions_events_expiry ON sessions_events(session_id,expires_at);
-- Down Migration
DROP TABLE sessions_events;
DROP TABLE sessions_steps;
DROP TABLE sessions_sessions;
