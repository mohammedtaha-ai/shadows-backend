-- Up Migration
-- Owner: Activity. Transactional counters never burn a cursor on rollback.
CREATE TABLE activity_cursors (
 account_id uuid PRIMARY KEY,
 high_water bigint NOT NULL DEFAULT 0 CHECK (high_water BETWEEN 0 AND 9007199254740991),
 floor bigint NOT NULL DEFAULT 0 CHECK (floor BETWEEN 0 AND high_water)
);
CREATE TABLE activity_events (
 account_id uuid NOT NULL REFERENCES activity_cursors(account_id), seq bigint NOT NULL,
 kind text NOT NULL, laptop_id uuid NOT NULL, session_id uuid,
 payload jsonb NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(account_id,seq)
);
CREATE INDEX activity_events_expiry ON activity_events(account_id,expires_at);
CREATE INDEX activity_events_laptop ON activity_events(account_id,laptop_id);
-- Down Migration
DROP TABLE activity_events;
DROP TABLE activity_cursors;
