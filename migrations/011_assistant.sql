-- Up Migration
-- Owner: Assistant. Account bindings and bounded transcript projections, not Hermes storage.
CREATE TABLE assistant_conversations (
 id uuid PRIMARY KEY, account_id uuid NOT NULL, command_id uuid NOT NULL,
 title text NOT NULL, session_id text NOT NULL UNIQUE, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 UNIQUE(account_id,command_id)
);
CREATE INDEX assistant_conversations_account ON assistant_conversations(account_id,updated_at);
CREATE TABLE assistant_turns (
 id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
 account_id uuid NOT NULL, command_id uuid NOT NULL, fingerprint text NOT NULL, input text NOT NULL,
 output text NOT NULL DEFAULT '', run_id text,
 state text NOT NULL CHECK(state IN ('submitting','running','done','error','cancelled','unknown','stopping')),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, UNIQUE(account_id,command_id)
);
CREATE UNIQUE INDEX assistant_one_active ON assistant_turns(conversation_id)
 WHERE state IN ('submitting','running','unknown','stopping');
-- Down Migration
DROP TABLE assistant_turns;
DROP TABLE assistant_conversations;
