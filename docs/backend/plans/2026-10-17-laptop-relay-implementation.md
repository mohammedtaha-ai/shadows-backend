# Laptop Relay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user already chose inline execution; do not ask again or create worktrees.

**Goal:** Deliver a synthetic, authenticated paired-laptop/session path with durable ingress acknowledgements and replayable HTTP/SSE projections.

**Architecture:** One Fastify application; Links owns pairing/connection checkpoints, Sessions owns session/step projections, and Activity owns the transactional account journal. Transport adapters validate code-owned schemas and invoke public services; identity/devices retain authority. Native uses generated artifacts and its existing sidecar instead of a second hook/store.

**Tech Stack:** Existing Node 24.19.0, TypeScript 5.9.3, Fastify 5.12.5, TypeBox 0.34.52, Kysely 0.29.6, pg 8.23.1, PostgreSQL 18.4 and node-pg-migrate 9.0.0. Proposed additions: @fastify/websocket 11.3.4, @fastify/sse 0.6.1, ws 8.22.0 (test peer; current advisory fixes), json-schema-to-typescript 16.0.0 (development generator; registry verified 2026-10-17).

**Spec:** [Relay specification](../specs/2026-10-17-laptop-relay-design.md), including its concrete planning proposals. [Backend contract agreement](../../shared/requests/2026-10-17-laptop-relay.md) accepted by the coordinating human on 2026-10-17; Native implementation acceptance remains separate.

## Global Constraints

- Work only in the existing backend checkout on `codex/aylul-laptop-relay`, based on `65095a6`; existing planning commits are preserved. No worktree, branch switch, push, merge, deployment or sibling source edit.
- The human approved this plan/protocol for backend implementation on 2026-10-17. New Native integration needs its own plan/PR; this plan never merges `spec/aylul-hook-laptop` automatically.
- `B1_DATA_MODE=synthetic` remains mandatory. Do not read existing personal SQLite/session data, call a model, use `.env`, or change the deferred real-content lifecycle gate.
- MiniMax is a research provider only. No model/provider dependency, default model name, brain package, chat/memory, approvals, grants or push implementation in this slice.
- Every technical contract/endpoint comes from canonical code. Generate snapshots, frame declarations and clients; never hand-edit `api/` JSON or TypeScript. Markdown is not a second wire contract.
- No domain-to-transport imports, private sibling-module imports, foreign-table queries or SQL outside the owning store. Public cross-module transaction operations are allowed; the calling workflow owns commit/rollback.
- Exact proposed policy values and limits are in the spec. One active laptop/account/device, 20 laptops/account; code TTL five minutes; heartbeat/auth 15s, pong deadline 45s; frames 64KiB, batches 1–20, input four frames/256KiB, output 1MiB.
- Source contracts describe inspected behavior only and change with source. New contracts/map rows appear with actual modules, never placeholders.
- Execute checks inside Docker. Focused RED then GREEN per task; full affected suites only at integration or after reproduced corrections. Stage named files and commit each completed task.

## Review Focus

1. Lost ACK after a committed batch must replay without duplicating data; a changed payload under the same identity must refuse (Task 4).
2. An old connection's late message/close must neither overwrite a new epoch nor mark it offline (Tasks 3 and 5).
3. Revocation while a snapshot is read or a socket is idle must prevent subsequent protected delivery; do not claim recall of written bytes (Tasks 5–6).
4. A local shell summary may itself contain the command; no caller summary or generic target crosses ingress (Tasks 1 and 7).
5. Adding live routes must not contaminate auth-v1 export, and pending mock operations must not become fake product handlers (Tasks 1 and 6).

## Pre-execution gate

The human coordinating supervisor approved completing and executing this plan on
2026-10-17. The shared request records backend contract acceptance, including
Activity ownership and generated artifacts. Native implementation and device
acceptance remain separate; no successful experiment is treated as that evidence.

The inspected Native baseline is local `0d086b6`. Real acceptance requires its
review/integration into current NYLRA plus a new generated-artifact consumer.
Reference-peer tests below prove backend behavior, not those Native changes.

## File and ownership map

Paths below are intended additions/edits, not implemented source claims.

| Paths | Job |
| --- | --- |
| `src/transports/http/nylra-{schema,paths,routes}.ts` | Canonical HTTP operations/shapes and actual handler bindings |
| `src/transports/laptop-link/{schema,codec,connection,index}.ts` | Code-owned frame v1, wire mapping and bounded socket lifecycle |
| `scripts/export-laptop-link-schema.ts`, `scripts/check-laptop-link-schema.ts` | Deterministic JSON Schema/TS generation and freshness checks |
| `src/modules/activity/{model,store,service,index}.ts` | One account cursor/journal owner; not a general bus |
| `src/modules/links/{model,store,service,access-port,index}.ts` | Pairing, revocation, epochs, producer/checkpoint receipts |
| `src/modules/sessions/{model,store,service,links-port,index}.ts` | Local/cloud mapping, safe summaries and session stream |
| `migrations/006_activity.sql`, `007_links.sql`, `008_sessions.sql` | Ordered, explicitly owned storage changes |
| `tests/integration/fixtures/{relay,laptop-peer}.ts` | Fresh synthetic principals/databases and bounded real-socket peer |

Existing app composition, database types, architecture checks, contracts and code
map change in the tasks that first need them. Keep auth internals private. The
existing `IdentityService.authenticate`, `authorizeTransaction` and
`authorizeRevocation` are reused through injected public access ports.

## Verification convention

`tools` below means `docker compose run --rm --no-deps tools`; its existing ingress
network prerequisite must be available. Use only the documented synthetic local
runtime, never delete volumes or read its credential files into the conversation.
If ingress is stopped, use a separately owned test container/network with the
same image/dependency/test-runtime mounts and generated fixture configuration;
do not substitute development databases. The existing postgres fixture creates
and drops only its owned databases/clusters. Provider fixtures are synthetic.

Use `tools node --import tsx --test <test-path>` for focused tests, `tools npm run
typecheck`, and the named package checks. Each expected result is zero failures.
No tests named below exist merely because this plan names them.

## Task 1: Canonical operations and generated protocol artifacts

**Files:** Modify `src/transports/http/nylra-schema.ts`, `nylra-paths.ts`, HTTP
`contract.yaml`; `scripts/export-nylra-schema.ts`, `scripts/mock-nylra.ts`;
`tests/integration/nylra-wire.test.ts`, `nylra-mock.test.ts`; `package.json`,
`package-lock.json`, `.gitattributes`. Create laptop-link `schema.ts` and its
inspected `contract.yaml`; generator/checker scripts from the map;
`tests/integration/laptop-link-wire.test.ts`. Generate `api/nylra-v1.openapi.json`,
`nylra-v1.d.ts`, `laptop-link-v1.schema.json`, `laptop-link-v1.d.ts`; update only
synthetic `api/nylra-v1.fixtures.json`. Modify `tests/architecture/contracts.test.ts`
to cover the new inspected schema owner; update `docs/codebase/README.md` and
`docs/backend/stages.md`.

**Interfaces:**
- Extend `NylraOperation` as an HTTP/WebSocket discriminated definition with stable `operationId` and explicit `planned|implemented` status. Export `NylraOperationId` and contract version 0.3.0 from source. Preserve existing operation behavior/shapes except the reviewed additive changes.
- Source adds operation `issueLaptopCode` at the pairing-code resource and `openLaptopLink` at the laptop-link resource, once, in `nylra-paths.ts`. Existing claim/list/unlink/session/account operations get stable IDs. Runtime and generators consume this registry; no second path table.
- HTTP adds `PairingCodeIssue`/`PairingCodeIssued`, LaptopList's matching account cursor, and opaque `laptop_unlinked`. Upgrade exports 101 and refusal outcomes, not a JSON 200 body. Mock filters out the actual WebSocket operation; it does not pretend to be a relay.
- Frame source exports `ClientFrame`, `ServerFrame`, `CLIENT_PROTOCOL_VERSION=1`. Client discriminants are `hello` and `batch`; hello fields are `protocolVersion`, `producerId`, `lastAck`. Batch field `entries` contains 1–20 consecutive records with `seq` and `event`; event discriminants are `session` and `step`. A session event names `localSessionId`, `agent`, `projectName`, `cwd`, `state` and `at`. A step names `localSessionId`, `localStepId`, `at`, `tool` and nullable `path`; **no summary/target/HookEvent**. Server discriminants are `ready`, `ack`, `refusal`; ready/ACK fields are `epoch`, `ackThrough`, `dropped` (sequence plus fixed `event_expired` code), and refusal has canonical `code`. These are edit instructions for the source owner, not a separately maintained schema artifact.
- Derive overlapping wire constraints using TypeBox Pick/Omit/Index or schema references. Services use their own pure input models, not imports from transports. Generate frame TS with json-schema-to-typescript 16.0.0; no runtime generator dependency.
- `laptopLinkArtifacts():Promise<{schema:string;declarations:string}>` in `scripts/export-laptop-link-schema.ts` generates both strings. `checkLaptopLinkArtifacts(root?:string):Promise<void>` in the checker compares against that output; drift tests use an owned temporary directory, never modify the real generated snapshots.

- [ ] Write failing `laptop_link_wire_generation_and_bounds`: source schema validates hello/batch/ACK, refuses extra summary/account/tool-input fields, unsafe/nonconsecutive sequence and 21-event batches; generated artifacts exactly match deterministic in-memory generation. Include deliberately modified generated text and expect the freshness checker to fail.
- [ ] Extend `nylra_wire` checks: retain all existing planned operations; issuance and upgrade come from registry; upgrade has 101, not a fabricated JSON 200; LaptopList fixture has a cursor; mock-only declarations remain visibly planned.
- [ ] Observe RED with focused wire/mock tests via `tools`; record the missing implementation/assertion, not an unrelated environment error.
- [ ] Implement source definitions and generators, update synthetic fixtures, add exact dependencies and `schema:laptop-link`/`schema:check:laptop-link` scripts. Generate files through those scripts. This task registers no fake product handler or future service.
- [ ] Observe GREEN with focused tests, generation/freshness checks, `tools npm run typecheck` and `tools npm run check:contracts`.
- [ ] Update inspected schema-only contract/map/stages; commit named files: `feat(protocol): generate laptop relay contracts from source`.

## Task 2: Transactional account activity journal

**Files:** Create Activity files and `contract.yaml`, `migrations/006_activity.sql`,
`tests/integration/activity-journal.test.ts`. Modify database `schema.ts` and
contract; `scripts/check-boundaries.ts`, `tests/architecture/boundaries.test.ts`,
`tests/architecture/contracts.test.ts`, `tests/integration/migrations.test.ts`,
`docs/codebase/README.md`, `docs/backend/stages.md`.

**Interfaces:**
- `createActivity(db, clock): ActivityService`; pure domain `AccountChange`/`AccountEvent` models, mapped to HTTP schema by transports.
- Its internal journal envelope uses closed event kinds, source laptop/session IDs, immutable caller-owned JSON projection and expiry. It imports no future Links/Sessions model; each publisher owns its projection, and HTTP validates mapped output against canonical schemas. It is not another wire DTO or a generic handler/topic registry.
- `append(tx, accountId, changes): Promise<AccountEvent[]>`, `read(tx, accountId, after, limit): Promise<{events,highWater,floor}>`, `cursor(tx,accountId):Promise<number>`, `invalidateLaptop(tx,accountId,laptopId):Promise<void>` and `prune(tx,accountId,now):Promise<void>`.
- Only Activity's store queries `activity_cursors` and `activity_events`. Lock the per-account counter row; allocate and append in the publisher's transaction. No PostgreSQL nontransactional sequence for the gapless committed account cursor. Reads use account scope and floor; no store/private table API is exposed.
- Invalidation removes affected payloads and advances the account replay floor to its current high-water mark. Counters never decrease. Pruning respects seven-day/source deadlines and advances the floor; reconnect below floor refuses resnapshot.

- [ ] Write failing tests for independent accounts, two concurrent publishers and rollback. Pin the core rule:
  ```ts
  // After an append transaction rolls back, the next committed event is still seq 1.
  assert.equal(committed[0].seq, 1);
  assert.deepEqual(otherAccount.events, []);
  ```
  Also assert unlink invalidation raises the floor without recycling IDs and stale replay refuses; no post-prune payload is returned.
  Seed the counter at Number.MAX_SAFE_INTEGER and assert further allocation refuses without overflow, reuse or partial commit; convert SQL bigint strings only after safe-integer validation.
- [ ] Observe RED: `tools node --import tsx --test tests/integration/activity-journal.test.ts`.
- [ ] Implement the owner/migration. Extend architecture checks only for each explicit new owner/table prefix and public module surface; prove identity querying Activity tables and Activity importing HTTP/private Links still fail. No blanket SQL-boundary exemption.
- [ ] Observe GREEN for journal, migration, boundaries/contracts tests and typecheck. Document this as the reviewed ownership amendment, not a generic bus.
- [ ] Commit named files: `feat(activity): own durable account event ordering`.

## Task 3: Pairing, link access and connection checkpoints

**Files:** Create Links files/contract, `migrations/007_links.sql`,
`tests/integration/laptop-pairing.test.ts`, `laptop-lease.test.ts`, fixture
`tests/integration/fixtures/relay.ts`. Modify `src/platform/database/schema.ts`
and contract; `scripts/check-boundaries.ts`, `tests/architecture/boundaries.test.ts`,
`tests/architecture/contracts.test.ts`, `tests/integration/migrations.test.ts`,
`docs/codebase/README.md`, `docs/backend/stages.md`.

**Interfaces:**
- `createLinks(db, access, activity, clock): LinksService`. `access` delegates to existing identity `authorizeTransaction` or `authorizeRevocation`; never queries identity/device tables directly.
- `issueCode(principal,name):Promise<PairingCode>`, `claim(principal,commandId,code):Promise<LaptopView>`, `list(principal):Promise<{laptops,cursor}>`, `unlink(principal,laptopId):Promise<void>`.
- `open(principal,producerId,lastAck):Promise<LinkLease>`, `requireConnection(tx,principal,lease):Promise<void>`, `commitReceipts(tx,lease,receipts):Promise<void>`, `receipts(tx,lease,positions):Promise<Receipt[]>`, `close(lease):Promise<void>`.
- `LinkLease` pins server laptop/account/device/session, producer and epoch; transport never constructs it from body account fields. Producer identity persists across reconnect. Different producer after established history or a client ACK ahead of the server requires explicit repair/re-pair; no silent reset. New open advances epoch; old close is a no-op for newer epochs.
- Links owns `links_laptops`, `links_pairing_codes`, `links_claim_commands`, `links_rate_windows`, `links_ingress_receipts`. Serialize account laptop-count/claim changes on an owned account guard row in `links_rate_windows`; enforce one active account/device link and the 20-device cap transactionally.
- When needed, lock the Links account guard before its link row, then session state, then Activity's account counter. No path takes the reverse order. Activity pruning does not acquire link/session locks after its counter; add a concurrent claim/unlink/ingest regression rather than relying on convention alone.

- [ ] Write failing tests with an injected clock: code succeeds before five minutes and fails at the boundary; new issuance invalidates old; storage retains only code hash. Assert same-account one-use claim, foreign-account refusal, concurrent single winner, same command/content replay, changed-content conflict, cap/rate limits surviving service restart, and re-pair after revoke uses a new laptop ID.
- [ ] Write epoch tests: reconnect from lost ACK returns server's committed position, wrong device/producer refuses, and an old close/message cannot change the new lease. Confirm unlink uses the existing local revocation path during provider outage while normal new reads fail closed.
- [ ] Observe RED with the two focused test files via `tools`.
- [ ] Implement pairing/lease/checkpoint services and stores with public transactional Activity calls. Issuance has no automatic retry/idempotency promise; claim's replay receipt is account+command scoped and persists its original outcome. Link-row locks linearize revoke/open/checkpoint.
- [ ] Observe GREEN for focused tests, schema validation of service projections, boundaries/contracts and typecheck. No actual client pairing claim yet.
- [ ] Commit named files: `feat(links): pair laptops and fence connection generations`.

## Task 4: Safe session ingestion with commit-before-ACK

**Files:** Create Sessions files/contract, `migrations/008_sessions.sql`,
`tests/integration/session-ingress.test.ts`, `session-replay.test.ts`,
`tests/integration/fixtures/local-sidecar.ts`. Modify `src/platform/database/schema.ts`
and contract, `scripts/check-boundaries.ts`, `tests/architecture/boundaries.test.ts`,
`tests/architecture/contracts.test.ts`, `tests/integration/migrations.test.ts`,
`docs/codebase/README.md`, `docs/backend/stages.md`; change Links receipt port only if its reviewed
interface requires a correction recorded in the execution ledger.

**Interfaces:**
- `createSessions(db, access, links, activity, clock): SessionsService`.
- `ingest(principal,lease,batch):Promise<IngestResult>`, `list(principal,laptopId?):Promise<SessionListView>`, `snapshot(principal,sessionId):Promise<SessionSnapshotView>`, `events(principal,sessionId,after,limit):Promise<SessionEventPage>`.
- Internal pure input models are mapped from validated frames. Ingest serializes by the active link row, checks identity/link/epoch inside its transaction, compares normalized payload hashes for duplicate positions, writes projections/events/receipts, then commits. Return ACK only afterward. No cross-module store import or transport DTO in domain models.
- Stable mapping keys include laptop and producer/local identity. Server generates cloud session/step UUIDs; per-session cursor and account cursor are distinct. A duplicate accepted event is not emitted again; changed payload under the same position refuses atomically.
- Domain projection generates a fixed tool-only summary. Reject non-null targets for shell/URL/pattern/unknown tools; only Read/Edit/Write/NotebookEdit filesystem paths are eligible. Caller summary, lastMessage and raw tool fields are not inputs.
- Use the earlier of valid reported timestamp+seven days and receive time+seven days for expiry. Invalid calendar dates/future times over five minutes refuse. Already expired input records only a dropped receipt/ACK outcome and advances the ingress checkpoint, never a step or activity payload. Retain receipt fingerprints at most seven days; an older unknown duplicate needs resnapshot, not an assumed match.

- [ ] Write failing `lost_ack_replays_without_second_step_or_event` and `changed_payload_under_same_position_refuses`. Assert step/event counts stay one, not merely that a helper returns a cached object. Inject rollback before commit and a disconnect after commit before send.
- [ ] Test foreign laptop/session reads, stale lease barriers, distinct local IDs on two laptops, expired input ACK/drop, invalid real timestamps, pruning floor, and safe projection. Fixture data is derived from inspected `0d086b6` shapes but imports no sibling source. Put a synthetic credential-shaped command in both local target and summary and prove neither is a valid ingress field.
- [ ] Observe RED for both focused test files via `tools`.
- [ ] Implement the workflow and owner queries; in the same transaction call Links public receipt/checkpoint operations and Activity append. Keep no authority/result deduplication in socket memory.
- [ ] Observe GREEN for focused tests, migrations, boundaries/contracts and typecheck.
- [ ] Commit named files: `feat(sessions): persist scoped ingress before acknowledgement`.

## Task 5: Bounded authenticated WebSocket transport

**Files:** Create laptop-link `codec.ts`, `connection.ts`, `index.ts`; update its
contract and source-defined upgrade operation status. Create
`tests/integration/laptop-link.test.ts`, `tests/integration/fixtures/laptop-peer.ts`.
Modify `src/app/compose.ts`, `src/app/contract.yaml`,
`src/transports/http/contract.yaml`, `src/transports/http/nylra-paths.ts`,
`docs/codebase/README.md`, `docs/backend/stages.md`; regenerate affected API
artifacts named in Task 1 from source.

**Interfaces:**
- `registerLaptopLink(server, {identity,links,sessions}, clock):Promise<void>` registers plugin before application routes, using the canonical `openLaptopLink` definition. `decodeClientFrame(bytes):ClientFrame` validates exact schema/byte bounds; `encodeServerFrame(value):string` validates output before serialization.
- Authenticate the native bearer during upgrade. Queue handlers synchronously before initialization, but accept no batch until hello obtains a lease. Keep bearer only in connection memory; frames carry no credential.
- One bounded sequential receive loop invokes Sessions.ingest and sends its committed result. Enforce all spec bounds and close codes. Ping/auth every 15s, pong timeout 45s; invoke the existing identity owner, no new positive cache. Provider outage maps to retryable close 1013, invalid authority to 1008.
- Before protected sends, recheck current persisted identity/link/epoch. On disconnect cancel timers/listeners and close only its lease. No late timer may mark a newer connection offline; shutdown drains/closes owned sockets honestly.

- [ ] Write failing real-listener tests for upgrade refusal, first-frame initialization race, malformed/oversized frame, bad version, out-of-order batch, lost ACK, old socket fencing, queued bytes and slow receiver. Use controlled barriers/clock instead of timing sleeps for authorization/order assertions.
- [ ] Test post-upgrade device/session/link revoke through existing owners, including an idle connection and a barrier between reading data and final send authorization. No private identity SQL or synthetic revoked flag substitutes for these product checks.
- [ ] Observe RED: `tools node --import tsx --test tests/integration/laptop-link.test.ts`.
- [ ] Implement transport with per-message error handling and explicit limits. Native model/provider key is never loaded. Advance registry implementation status only for the actual bound upgrade.
- [ ] Observe GREEN for focused listener/wire tests, typecheck and source-secret checks. Record TLS/ingress/mobile behavior as unverified here.
- [ ] Commit named files: `feat(relay): add authenticated bounded laptop websocket`.

## Task 6: Generated live HTTP routes and race-free SSE

**Files:** Create `src/transports/http/nylra-routes.ts`, `nylra-sse.ts`,
`tests/integration/nylra-live-routes.test.ts`, `session-stream.test.ts`,
`account-stream.test.ts`. Modify compose/app/HTTP contracts, canonical operation
statuses, `scripts/export-auth-schema.ts`, wire tests/mock where needed and map/stages.
Regenerate affected API artifacts; preserve auth-v1 wire semantics.

**Interfaces:**
- `registerNylra(server,{identity,links,sessions,activity}):Promise<void>` binds only implemented operation IDs to handlers; method/path/schemas are taken from the same operation registry as generation. No placeholder handler for future chat/approval/push operations.
- `serveAccountEvents` and `serveSessionEvents` use @fastify/sse for framing/cleanup, the owning services for storage/floor and a bounded catch-up/read loop. Do not treat a plugin callback/in-memory array as durable replay.
- Snapshot lists/cursor use an explicit read-only REPEATABLE READ transaction, not PostgreSQL's default per-statement READ COMMITTED snapshots. Perform final delivery authorization from fresh state outside that snapshot. Subscribe/catch up against durable high-water marks; periodically re-read committed journal pages so process-local wakeups are only hints. No correctness dependency on receiving a local notification from another process.
- SSE reads at most 100 events/page, polls durable state at most once/second, heartbeats every 15s, and closes at 1MiB outgoing buffering. Reauthorize before protected pages/sends and on heartbeat. Unknown/expired cursor returns 410 before headers; after headers, close and let canonical reconnect obtain 410. Disconnect cleans polling and authorization work.
- Parse `?after=` once as canonical decimal/safe integer before strict schema validation; current app's `coerceTypes:false` must not turn valid decimal query strings into false 400s. Apply explicit refusal mapping in an encapsulated NYLRA route scope, not Auth's global error vocabulary.
- Isolate auth and NYLRA registrations without duplicating auth implementation. `compose(...,{routeSet:'auth'|'all'})` defaults to all; the auth exporter requests auth-only registration using the same existing auth route function. It must not export new NYLRA paths into auth-v1 or require database/model/network access to generate schemas.

- [ ] Write failing actual-route coverage tests: each implemented registry row has exactly its runtime binding/request/refusal/response schema; each planned row has no fake product handler. Deliberately change a route method/schema and assert coverage/freshness checks fail. Keep both generators driven by code.
- [ ] Assert existing auth-v1 generated snapshots stay identical under full app composition changes; mock future operations still work only in the mock. Test legitimate cursor `1`, unsafe/exponent cursor refusal and the new LaptopList cursor.
- [ ] Test snapshot/replay/live barriers, two concurrent publishers, second process committing without a local wakeup, expiry/unlink resnapshot, wrong account and revocation while a page is pending. Assert exact IDs:
  ```ts
  assert.deepEqual(receivedIds, [snapshotCursor + 1, snapshotCursor + 2]);
  assert.equal(new Set(receivedIds).size, receivedIds.length);
  assert.equal(staleReconnect.status, 410);
  ```
- [ ] Observe RED for the three focused test files and relevant auth/nylra wire tests via `tools`.
- [ ] Implement route bindings and SSE adapters; advance only real operation statuses. Preserve all reviewed future declarations in the generated contract. No root error handler may swallow 409/410 into auth's 503 mapping.
- [ ] Observe GREEN for focused tests, generation/freshness checks, typecheck, contracts and boundaries.
- [ ] Commit named files: `feat(http): serve generated laptop and session contracts with replay`.

## Task 7: End-to-end synthetic journey and handoff

**Files:** Create `tests/journeys/laptop-relay.test.ts`,
`docs/evidence/2026-10-17-laptop-relay-acceptance.md`. Modify relevant actual
contracts/map, README/handoff, `.github/workflows/ci.yml`, stages/plan; fix reproduced
issues only within the earlier task scopes, with regression tests.

**Interfaces:**
- The reference peer consumes generated frame JSON Schema/TS artifacts, not a handwritten protocol or sibling code import. Product identity/device fixtures supply real B1 principals, with synthetic OIDC where appropriate.
- Journey: issue/claim -> open -> ingest state/step -> phone HTTP snapshot/SSE -> disconnect after commit before ACK -> reconnect/replay -> second epoch fences first -> unlink/revoke -> old sender/read/replay refuses. Account/cursor isolation is checked with another fixture account.
- Publish no package or endpoint; stage generated artifacts only. Native implementation needs separately accepted versioned artifact distribution; `file:../shadows-backend/src` is forbidden. Brain distribution remains a later provider-independent decision.

- [ ] Write failing journey first. Prove no duplicate SQL rows/events, no replay of revoked payloads and accurate online/offline after stale close. Use PostgreSQL and actual sockets, not only Fastify injection.
- [ ] Observe RED, complete missing integration and observe GREEN with `tools node --import tsx --test tests/journeys/laptop-relay.test.ts`.
- [ ] Final local checks: `tools npm run typecheck`, `tools npm run check:contracts`, `tools npm run test:boundaries`, `tools npm run schema:check`, `tools npm run schema:check:laptop-link`, `tools npm run check:docs`, `tools npm run check:secrets`, then `tools npm test`. Add the same required new generation/coverage checks to existing synthetic CI without credentials/model calls. Report actual results; local green is not CI green.
- [ ] Verify `test:lifecycle` remains deferred and runtime still refuses real-data mode. Seven-day component expiry tests do not close account/provider deletion or quarantine-restore acceptance. Test through the existing TLS ingress only if its documented synthetic runtime is available; otherwise name the missing acceptance.
- [ ] Record source versions, dependencies, commands/results and limitations. Explicitly separate synthetic peer, unmerged Native baseline, actual phone/hook and real identities. No paid MiniMax/provider requests are needed by this plan.
- [ ] Perform the one fresh whole-change review required by preserved inline execution; no per-task implementer/reviewer dispatch. Review does not bypass the Native agreement or unperformed device gates. Fix confirmed important findings with RED/GREEN regressions and affected/full checks.
- [ ] Commit named evidence/source fixes: `test(relay): verify synthetic laptop session continuity`. Leave the branch local; integration/publication requires the user's instruction.

## Self-review and handoff

Spec intent and scope map to Tasks 2–6; code-owned generation to Tasks 1/6;
provider independence to Global Constraints and Task 7; modular ownership to
Tasks 2–4; protocol limits/security to Tasks 3–6; projection to Tasks 1/4/7;
acceptance and lifecycle limits to Task 7. Each Review Focus item has an owning test.

This plan includes human-approved backend protocol/ownership decisions, not
an assertion that Native accepted them. No product files, generated API artifacts,
dependencies or databases have been changed during planning. The user already
selected inline execution and prohibited worktrees; preserve those choices after
approval rather than requesting those choices again.

## Execution record
All seven tasks completed on the original branch. The one final review and its
RED/GREEN fixes, full 84/84 Docker result, decisions and separate acceptance gates
are recorded in [local acceptance](../../evidence/2026-10-17-laptop-relay-acceptance.md).
The branch remains local; no Native integration, publication or deployment.

## Task 8: Verify the development TLS ingress

Continuation authorized by the human on 2026-10-17 after the existing Compose
database was migrated and started. This bounded fix completes the existing
Task 7 ingress acceptance; it does not merge the unmerged Native baseline.

**Files:** `docker/nginx.conf`, `docker/synthetic-login.ts`,
`docker/stack-journey.ts`, `docker/relay-journey.ts`,
`tests/integration/fixtures/ingress.ts`, `tests/integration/fixtures/laptop-peer.ts`,
`tests/journeys/relay-ingress.test.ts`,
`.github/workflows/ci.yml`, `docs/nylra-local-auth-handoff.md`,
`docs/codebase/README.md`, `docs/evidence/2026-10-17-laptop-relay-acceptance.md`,
and this plan/stages. No generated contract or domain behavior changes.

**Interfaces:** Use the existing generic `/v1/` upstream, with explicit HTTP/1.1
upgrade forwarding and unbuffered, uncached responses. Preserve all existing
forwarded host/protocol headers, body limits and authentication. Use a 75-second
read timeout above the existing 15-second heartbeats. No new path registry in
Nginx. An owned fixture runs the pinned Compose Nginx image against a synthetic
app using the actual config with only listen/upstream ports and TLS paths changed.
Extract the existing bounded synthetic login into a shared development helper;
the new Compose journey uses actual Keycloak login, generated wire types, WSS,
snapshot/SSE, disconnect/replay, unlink and created-device cleanup. Never log a
credential or read `.env`, never reset development volumes.

- [x] Add actual-Nginx WSS and prompt SSE delivery tests; observe WSS RED before config changes (SSE baseline already green).
- [x] Fix ingress, run focused tests and typecheck in Docker; observe GREEN.
- [x] Run the authenticated synthetic journey through the existing `8443` ingress;
      record its actual results separately from fixture and Native acceptance.
- [x] Update code map/handoff/evidence and CI fixture pull; run affected checks.
- [x] One fresh review of this continuation delta; Important fixes get RED/GREEN.
- [x] Commit explicit paths, keep local branch; Native integration needs its own
      plan based on the inspected existing baseline and generated contracts.

Task 8 final verification: 88/88 Docker tests passed, zero failed/skipped,
126089 ms. Typecheck, contracts/boundaries, auth/NYLRA and laptop-frame freshness,
docs/YAML and source-secret checks passed. Actual Compose relay journey passed
again after the bounded-close/HTTP-deadline fixes. No second review or remote CI.
