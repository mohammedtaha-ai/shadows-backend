-- Up Migration
-- Owner: devices. Legacy rows intentionally have no reusable enrollment proof.
ALTER TABLE devices ADD COLUMN enrollment_hash text;
CREATE UNIQUE INDEX devices_enrollment_hash_unique ON devices(enrollment_hash) WHERE enrollment_hash IS NOT NULL;
ALTER TABLE devices ADD CONSTRAINT devices_enrollment_hash_shape CHECK (enrollment_hash IS NULL OR enrollment_hash ~ '^[A-Za-z0-9_-]{43}$');
-- Down Migration
ALTER TABLE devices DROP COLUMN enrollment_hash;
