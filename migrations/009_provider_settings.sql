-- Up Migration
-- Owner: Provider settings. No plaintext credentials or external-owner queries.
CREATE TABLE provider_settings_connections (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 format text NOT NULL CHECK(format = 'openai_compatible'), origin text NOT NULL, base_path text NOT NULL,
 model text NOT NULL CHECK(length(model) BETWEEN 1 AND 200),
 credential_revision bigint NOT NULL CHECK(credential_revision BETWEEN 1 AND 9007199254740991),
 sealed_key text, key_id text, state text NOT NULL CHECK(state IN ('active','removed')),
 revision bigint NOT NULL CHECK(revision BETWEEN 1 AND 9007199254740991),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 UNIQUE(account_id,id),
 CHECK((state='active' AND sealed_key IS NOT NULL AND key_id IS NOT NULL) OR
       (state='removed' AND sealed_key IS NULL AND key_id IS NULL))
);
CREATE UNIQUE INDEX provider_settings_active_name ON provider_settings_connections(account_id,name) WHERE state='active';
CREATE TABLE provider_settings_accounts (
 account_id uuid PRIMARY KEY, default_connection_id uuid,
 FOREIGN KEY(account_id,default_connection_id) REFERENCES provider_settings_connections(account_id,id)
);
-- Down Migration
DROP TABLE provider_settings_accounts;
DROP TABLE provider_settings_connections;
