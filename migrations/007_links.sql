-- Up Migration
-- Owner: Links. No credentials or plaintext pairing codes are stored.
CREATE TABLE links_laptops (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, device_id uuid NOT NULL, session_id uuid NOT NULL,
 name text NOT NULL, revoked_at timestamptz, online boolean NOT NULL DEFAULT false,
 last_seen_at timestamptz, producer_id uuid, epoch bigint NOT NULL DEFAULT 0,
 ack_through bigint NOT NULL DEFAULT 0 CHECK(ack_through BETWEEN 0 AND 9007199254740991),
 UNIQUE(account_id,id)
);
CREATE UNIQUE INDEX links_one_active_device ON links_laptops(account_id,device_id) WHERE revoked_at IS NULL;
CREATE TABLE links_pairing_codes (
 account_id uuid NOT NULL, device_id uuid NOT NULL, session_id uuid NOT NULL,
 code_hash text NOT NULL UNIQUE, name text NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(account_id,device_id)
);
CREATE TABLE links_claim_commands (
 account_id uuid NOT NULL, command_id uuid NOT NULL, fingerprint text NOT NULL,
 laptop_id uuid NOT NULL, result jsonb NOT NULL, PRIMARY KEY(account_id,command_id)
);
CREATE TABLE links_rate_windows (
 account_id uuid NOT NULL, key text NOT NULL, window_start timestamptz NOT NULL,
 count integer NOT NULL DEFAULT 0, PRIMARY KEY(account_id,key)
);
CREATE TABLE links_ingress_receipts (
 laptop_id uuid NOT NULL REFERENCES links_laptops(id), producer_id uuid NOT NULL,
 seq bigint NOT NULL CHECK(seq BETWEEN 1 AND 9007199254740991),
 fingerprint text NOT NULL, dropped boolean NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(laptop_id,producer_id,seq)
);
-- Down Migration
DROP TABLE links_ingress_receipts;
DROP TABLE links_rate_windows;
DROP TABLE links_claim_commands;
DROP TABLE links_pairing_codes;
DROP TABLE links_laptops;
