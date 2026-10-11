-- Up Migration
-- Owner: devices. Only devices store reads and writes this table.
CREATE TABLE devices (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES identity_accounts(id),
 created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
 UNIQUE(account_id,id)
);
-- Down Migration
DROP TABLE devices;
