-- Up Migration
-- Owner: Conversations. Activity amendment permits only topic events without a laptop.
ALTER TABLE activity_events ALTER COLUMN laptop_id DROP NOT NULL;
ALTER TABLE activity_events ADD CONSTRAINT activity_event_laptop_scope CHECK
 ((kind='topic_deleted' AND laptop_id IS NULL AND session_id IS NULL) OR (kind<>'topic_deleted' AND laptop_id IS NOT NULL));
CREATE TABLE conversations_topics (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 connection_id uuid NOT NULL, connection_revision bigint NOT NULL CHECK(connection_revision>0), model text NOT NULL,
 high_water bigint NOT NULL DEFAULT 0 CHECK(high_water BETWEEN 0 AND 9007199254740991),
 floor bigint NOT NULL DEFAULT 0 CHECK(floor BETWEEN 0 AND high_water), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE INDEX conversations_account ON conversations_topics(account_id,id);
CREATE TABLE conversations_turns (
 id uuid PRIMARY KEY, topic_id uuid NOT NULL REFERENCES conversations_topics(id) ON DELETE CASCADE,
 account_id uuid NOT NULL, origin_device_id uuid NOT NULL, origin_session_id uuid NOT NULL,
 connection_id uuid NOT NULL, connection_revision bigint NOT NULL, model text NOT NULL,
 state text NOT NULL CHECK(state IN ('accepted','running','done','error','cancelled','interrupted')),
 cancel_requested boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX conversations_one_active_topic ON conversations_turns(topic_id) WHERE state IN ('accepted','running');
CREATE INDEX conversations_active_account ON conversations_turns(account_id) WHERE state IN ('accepted','running');
CREATE TABLE conversations_messages (
 id uuid PRIMARY KEY, topic_id uuid NOT NULL REFERENCES conversations_topics(id) ON DELETE CASCADE,
 turn_id uuid NOT NULL, role text NOT NULL CHECK(role IN ('user','assistant')), text text NOT NULL,
 status text NOT NULL CHECK(status IN ('streaming','complete','partial')), seq bigint NOT NULL, created_at timestamptz NOT NULL,
 CHECK((role='user' AND length(text) BETWEEN 1 AND 2000) OR (role='assistant' AND length(text)<=16000)), UNIQUE(topic_id,seq)
);
CREATE TABLE conversations_intents (
 turn_id uuid PRIMARY KEY REFERENCES conversations_turns(id) ON DELETE CASCADE,
 topic_id uuid NOT NULL REFERENCES conversations_topics(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','claimed','finished')),
 lease_token uuid, lease_expires_at timestamptz
);
CREATE TABLE conversations_events (
 topic_id uuid NOT NULL REFERENCES conversations_topics(id) ON DELETE CASCADE, seq bigint NOT NULL,
 payload jsonb NOT NULL, PRIMARY KEY(topic_id,seq)
);
CREATE TABLE conversations_receipts (
 account_id uuid NOT NULL, operation text NOT NULL CHECK(operation IN ('topic','turn')), command_id uuid NOT NULL,
 topic_id uuid NOT NULL REFERENCES conversations_topics(id) ON DELETE CASCADE,
 fingerprint text NOT NULL, result jsonb NOT NULL, PRIMARY KEY(account_id,operation,command_id)
);
-- Down Migration
DROP TABLE conversations_receipts;
DROP TABLE conversations_events;
DROP TABLE conversations_intents;
DROP TABLE conversations_messages;
DROP TABLE conversations_turns;
DROP TABLE conversations_topics;
UPDATE activity_cursors AS c SET floor=greatest(c.floor,removed.seq)
 FROM (SELECT account_id,max(seq) AS seq FROM activity_events WHERE kind='topic_deleted' GROUP BY account_id) AS removed
 WHERE c.account_id=removed.account_id;
DELETE FROM activity_events WHERE kind='topic_deleted';
ALTER TABLE activity_events DROP CONSTRAINT activity_event_laptop_scope;
ALTER TABLE activity_events ALTER COLUMN laptop_id SET NOT NULL;
