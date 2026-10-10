-- Non-product B0 fixture. Owner: capability probes only.
-- Up Migration
SELECT pg_sleep(0.5);
ALTER TABLE probe_item ADD COLUMN fixture_note text;
-- Down Migration
ALTER TABLE probe_item DROP COLUMN fixture_note;
