-- Up Migration
-- Owner: identity. Renewal timing is session state, not a positive authorization cache.
ALTER TABLE identity_sessions ADD COLUMN provider_refreshed_at timestamptz NOT NULL DEFAULT now();
-- Down Migration
ALTER TABLE identity_sessions DROP COLUMN provider_refreshed_at;
