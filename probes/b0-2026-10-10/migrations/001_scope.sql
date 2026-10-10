-- Non-product B0 fixture. Owner: capability probes only.
-- Up Migration
CREATE TABLE probe_item (id text PRIMARY KEY, account text NOT NULL, revision integer NOT NULL DEFAULT 0);
CREATE TABLE probe_delivery (id text PRIMARY KEY, fingerprint text NOT NULL, outcome text);
CREATE TABLE probe_remote_effect (id text PRIMARY KEY, fingerprint text NOT NULL, effects integer NOT NULL);
-- Down Migration
DROP TABLE probe_remote_effect;
DROP TABLE probe_delivery;
DROP TABLE probe_item;
