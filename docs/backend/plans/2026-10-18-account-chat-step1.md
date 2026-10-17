# Account chat, step 1: implementation plan

**Goal:** An existing signed-in account saves encrypted provider connections,
picks a default, and holds separate text topics whose replies stream, stop,
survive restart and delete. One API format (`openai_compatible`).

**Spec:** [account chat and providers](../specs/2026-10-17-account-chat-and-providers-design.md), step 1.
**API agreement:** [shared request 2026-10-18](../../shared/requests/2026-10-18-account-chat-and-providers.md), `accepted`.
**Branch:** `backend/account-chat`, from `main` at `397cab7`.

## Global constraints

- `B1_DATA_MODE=synthetic` stays. The only relaxation: the human's own trial
  key may be stored, encrypted, in the local Docker database (spec, step 1).
  Conversation text is test text. The real-data gate does not change.
- Automated tests use the fake provider (B-5). No test calls a real provider or
  needs network. Only B-11 calls MiniMax, run by the human.
- Spec values are binding: AES-256-GCM with 12-byte nonce and associated data;
  lease heartbeat 5 s, expiry 30 s; coalesce ≤ 200 ms or 4,000 UTF-8 bytes;
  20 connections/account; one active generation per topic, two per account;
  model input ≤ 64 KiB and 100 messages; output ≤ 4,096 tokens and 16,000
  chars; connect 5 s, idle 30 s, total 120 s; zero retries, zero fallback;
  SSE ≤ 100 events/page, 15 s heartbeat, close at 1 MiB pending.
- Keys never appear in responses, events, URLs, logs, errors or test output.
- One owner per table. Provider settings and Conversations reach each other,
  Identity and Activity only through public operations in `index.ts`.
- Domain models import no SDK, HTTP or database client. The AI SDK lives only
  in `packages/aylul-brain` and `src/integrations/providers`.
- Never hand-edit `api/`. Generate with `npm run schema:nylra`, check with
  `npm run schema:check`.
- Each task: RED test first, then GREEN, `typecheck`, `check:contracts`, commit
  the Touch files plus `docs/backend/stages.md`.

## How to run checks

All Node checks run in Docker, as in the relay plan:

- focused test: `docker compose run --rm --no-deps tools node --import tsx --test <file>`
- typecheck: `docker compose run --rm --no-deps tools npm run typecheck`
- contracts: `docker compose run --rm --no-deps tools npm run check:contracts`

Tests own their PostgreSQL through `tests/integration/fixtures/postgres.ts`;
never use development databases or read `.local-runtime/secrets`.

## Ownership map

| Path | Job |
|---|---|
| `src/modules/provider-settings/` | Connections, default, encrypted credentials, destination validation, authorized credential resolution |
| `src/integrations/providers/openai-compatible.ts` | Builds a bounded model client for one validated connection: pinned address, TLS hostname, no redirects, deadlines, zero retries, safe error categories |
| `packages/aylul-brain/` | NYLRA instructions and one text-reply call on a model handed in by the host. No tools, storage, env or keys |
| `src/modules/conversations/` | Topics, messages, turns, dispatch intents, per-topic event journal, lease worker, stop, delete |
| `src/transports/http/` | Schemas, routes, topic SSE |
| `migrations/009_provider_settings.sql`, `010_conversations.sql` | Owned tables |

## Tasks

### B-1 · Generated contract for chat and connections

Add to `nylra-schema.ts` / `nylra-paths.ts`, all `status: 'planned'`:
connection list/create/update/delete, get/set default, test connection
(requires `costAcknowledged: true`), change topic connection (requires
`transferAcknowledged: true`), delete topic (requires `confirm: true`).
`TopicCreate` gains optional `connectionId`. `Topic` gains `connectionId` and
`model`. `turn_finished` gains `connectionId` and `model`; add `topic_deleted`
to account events. Connection read shape: `connectionId, name, format,
baseUrl, model, keyConfigured, revision, createdAt, updatedAt`; never a key.
Write shape carries `apiKey` (write only, 1–512 chars). Refusal codes:
`no_connection`, `credential_rejected`, `model_unavailable`, `quota`,
`network`, `destination_refused`, `generation_busy`, `context_too_large`.
Update mock fixtures with synthetic values. Regenerate.

Tests: extend `nylra_wire` to assert the new operations exist and are planned,
no read shape has `apiKey`, and write shape refuses extra fields.

### B-2 · Credential sealing and the BYOK key ring

`credential-seal.ts`: `seal(keyRing, aad, plaintext) → {keyId, sealed}` and
`open(keyRing, aad, keyId, sealed) → plaintext`, AES-256-GCM, fresh 12-byte
nonce, 16-byte tag. AAD = accountId, connectionId, destination, credential
revision. Its own code; does not import Identity's `TokenVault`.
Config: `BYOK_KEY` (base64, 32 bytes), `BYOK_KEY_ID`, optional
`BYOK_PREVIOUS_KEYS` (`id:base64,...`). Startup refuses a wrong length or id.
`docker/runtime.ts` reads secret `byok-key`; `docker/bootstrap.mjs` creates it
like `token-key`. Create the module's `contract.yaml` covering this file only.

Tests (`credential-seal.test.ts`): round trip; changed AAD field, nonce, tag or
key id refuses; previous key still opens; unknown key id refuses; two seals of
the same text differ. `startup.test.ts`: bad BYOK config refuses start.

### B-3 · Destination validation

`destination.ts`: `validateDestination(url, resolver) → {origin, host, port, addresses}`.
Refuse non-HTTPS, URL credentials, query/fragment, and any resolved address
that is loopback, private, link-local, CGNAT, multicast, unspecified,
metadata (169.254.169.254, fd00:ec2::254) or IPv4-mapped forms of these. All
resolved addresses must pass. Resolver injected (tests use a fake).

Tests (`provider-destination.test.ts`): each refused class, mixed safe/unsafe
DNS answer refuses, IPv6 and mapped forms, a public answer passes.

### B-4 · Provider settings owner

Migration `009_provider_settings.sql` (owner: provider-settings): connections
(account, name, format, origin, base path, model, credential revision,
sealed key, key id, state, revision) and account default. Service:
`list, create, update, remove, getDefault, setDefault` per account, max 20,
names unique per account. Changing origin requires a new key in the same
call and bumps credential revision. `remove` blocks future use at once.
`resolveForDispatch(tx, accountId, connectionId, revision)` returns
`{destination, model, apiKey}` only if the connection still exists at that
revision; it re-validates the destination. Wrong account sees `not_found`.

Tests (`provider-settings.test.ts`): cross-account refusal; reads never carry
a key; limit 20; destination change without key refuses; removed or
superseded revision refuses resolution; tampered row refuses and stays stored.
Plus migrations and boundaries tests for the new owner.

### B-5 · OpenAI-compatible adapter and fake provider

Add pinned `ai` and `@ai-sdk/openai-compatible` (exact versions current at
install; record them in the task report). `openai-compatible.ts` builds a model
for one resolved connection: custom fetch connects to a validated address
with TLS servername = host, `redirect: 'error'`, connect 5 s, idle 30 s,
total 120 s, `maxRetries: 0`. Maps failures to the refusal codes of B-1 with no
key or body text. `fixtures/fake-provider.ts`: local HTTPS OpenAI-compatible
server (uses `fixtures/tls.ts`) that streams scripted deltas, stalls, fails
with 401/404/429, or redirects; counts requests.

Tests (`provider-adapter.test.ts`): streams deltas; 401/404/429/network map to
categories; redirect refused; stall hits idle deadline; abort stops the
request; one request per call (no retry); key absent from errors.

### B-6 · aylul-brain package

Create `packages/aylul-brain` as an npm workspace (private, no publishing).
Exports `replyStream({model, history, message, signal, maxOutputTokens})`
returning an async iterable of text deltas plus a final `{finish: 'done' |
'length' | 'error'}`. Holds the NYLRA instructions. Imports nothing from
`src/`, reads no env/files. Boundaries check enforces both. Dockerfile copies
the workspace `package.json` before `npm ci`.

Tests (`aylul-brain.test.ts`, using a mock model from the AI SDK test utilities
or the B-5 fake): instructions are sent first; history order kept; abort ends
the stream; length finish reported.

### B-7 · Conversations owner: topics, turns, delete

Migration `010_conversations.sql` (owner: conversations): topics (account,
title, connection id, model, revision pin), messages, turns, dispatch intents,
topic events journal with per-topic seq, command receipts. Service:
`createTopic` pins the given or default connection (`no_connection` if none);
`createTurn` stores message, turn, connection revision, fingerprint and intent
in one transaction; same `commandId` + same content returns the first result,
different content 409. Enforce one active per topic, two per account
(`generation_busy`). Before accepting, the eligible history + message must fit
64 KiB / 100 messages, else `context_too_large`. `changeConnection` between
turns only, needs `transferAcknowledged`. `deleteTopic` removes topic,
messages, events and intents, marks any active turn for abort, publishes
`topic_deleted` through Activity. Snapshot and events after a cursor, 410 below
floor.

Tests (`conversations.test.ts`): cross-account refusal; default pinning and
later default change not affecting old topics; idempotent turn and conflict;
busy limits; context refusal; delete removes all rows and later reads 404.

### B-8 · Dispatch worker, stop and restart fencing

`dispatch.ts`: claims an intent with a fenced lease (token + expiry),
heartbeat every 5 s, expiry 30 s. Before calling the provider and on every
heartbeat: `identity.authorizeTransaction` for the origin principal, topic
exists, connection resolves at the pinned revision; any failure aborts.
Generation goes through a `ReplyPort` interface the app wires to brain +
adapter (the domain imports neither). Deltas commit as journal events,
coalesced at 200 ms / 4,000 bytes; text stops at 16,000 chars (partial).
`cancelTurn` persists stop; the worker aborts and finishes `cancelled` with the
committed prefix. On start-up, expired claimed intents become `interrupted`,
never redispatched; writes with an old lease token are refused. App composition
starts and stops the worker.

Tests (`turn-dispatch.test.ts`, fake provider): reply streams and persists;
stop keeps partial; delete during generation aborts and refuses late writes;
logout and device revoke stop generation and reauthentication does not
resume it; removed connection stops it; expired lease → interrupted, no second
provider request; stale-token write refused.

### B-9 · Live HTTP routes and topic SSE

Mark the B-1 operations and the existing topic/turn operations `implemented`;
bind handlers to the services; topic SSE reads the conversations journal with
the existing SSE rules (page 100, heartbeat 15 s re-authorizing, close at 1 MiB).
Regenerate artifacts.

Tests (`chat-routes.test.ts`): every new route bound; key never in any
response; cross-account 404; cursor 410; SSE replays committed prefix after
reconnect; mock no longer serves the implemented operations. Existing wire and
live-route tests stay green.

### B-10 · Synthetic chat journey

`tests/journeys/account-chat.test.ts`: synthetic login → create connection
against the fake provider → set default → topic → turn → SSE reply → stop a
second turn → restart → delete. `docker/chat-journey.ts`: the same path against
the running Compose stack, taking base URL and model from arguments and the key
from a file path argument, printing no key; used by B-11. Run the full suite in
Docker once. Record results in `docs/evidence/2026-10-18-account-chat-acceptance.md`.

### B-11 · Manual MiniMax journey (human-run, conditional)

Hamoud checks that `MiniMax-M3` is still listed and its price on the MiniMax
site, then the human runs `docker/chat-journey.ts` with `https://api.minimax.io/v1`
and their key file. No cost cap (human decision 2026-10-18). Hamoud records
the outcome in the evidence file. No builder runs this task.

## Out of step 1

Lifecycle policy and real-data gate (step 2); open signup and other API
formats (step 3); model discovery; memory; tools; clients.
