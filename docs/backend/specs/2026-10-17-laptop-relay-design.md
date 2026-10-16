# Paired laptop and live-session relay

Date: 2026-10-17. Status: proposed written specification for user review.
Owner: Backend, with NYLRA Native as the laptop consumer and Flutter as HTTP/SSE
consumer. No implementation plan or product source change is approved by this file.

## Intent

Connect AYLUL desktop's sidecar to the existing backend so the same account can
see its paired laptop and summarized agent sessions from the phone. Closing the
desktop main panel must not end the link; quitting AYLUL does. The laptop opens
the connection; no inbound laptop port or direct UI-to-sidecar channel is added.

The first observable journey is a synthetic laptop event reaching a real backend
session snapshot and SSE client, followed by disconnect/reconnect without duplicate
steps, and revocation preventing further delivery. Real hook/mobile acceptance is
a later joint run against the actual consumers, not a renamed synthetic fixture.

Existing owners remain authoritative: identity/devices for the authenticated
principal; the laptop for local hooks, pending agent requests and grant enforcement;
backend services for cloud projections and durable event positions. No Shadows
database, account-derived approval authority or model-generated consent is added.

## Basis and approach

The [architecture](../../architecture.md#4-connection-topology) and
[first-release order](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#first-release-and-who-builds-it)
already select outbound laptop WebSocket and mobile HTTP/SSE. The
[research record](../../evidence/2026-10-17-laptop-relay-research.md) supplies current
library and narrowly scoped real-provider evidence.

Use the existing modular Fastify/PostgreSQL application. A separate relay service
would add identity/state ownership and deployment before a running product path;
polling would not satisfy the already agreed duplex connection for later laptop
dispatch. Use the named transport plugins for connection/framing work, with
application-owned persistence and authorization.

## First implementation scope

1. Pair an authenticated account-owned desktop installation with the same
   account's phone through an explicitly displayed one-time code. List linked
   laptops and revoke the link. Pairing proves neither hardware identity nor a
   right to read Shadows projects.
2. Establish one current laptop connection generation, expose online/offline and
   last-seen state, and fence messages from a superseded connection.
3. Accept a strictly bounded projection of session state and summarized steps.
   Serve the existing sessions/snapshot/account/session SSE operations from
   `nylraOperations` rather than the fixture server.
4. Acknowledge accepted ingress only after the projection and its durable event
   position commit. Retry and reconnect must neither duplicate steps nor silently
   overwrite a previously accepted message with different content.
5. Provide synthetic PostgreSQL/real-socket acceptance before connecting personal
   session data. All runtime real-content restrictions remain in force.

The first-release relay/session work is split from subsequent approval dispatch
and push so this slice cannot accidentally turn a fixture into permission.
Conversation/memory and `packages/aylul-brain` remain step 2(c); AWS, voice and
Shadows approvals remain outside this first release.

## Code-owned contracts and endpoint generation

User requirement, 2026-10-17: technical contracts and endpoint descriptions are
generated from code, never maintained as a second handwritten interface.

- Canonical TypeBox operation definitions in source own method, path, request,
  response, refusal and stream-event shapes. Runtime route registration and the
  OpenAPI exporter consume the same definitions. Bind actual service handlers to
  these operations; do not repeat an endpoint list in a separate generator.
- `api/*.openapi.json`, generated TypeScript/Dart clients and published laptop
  frame JSON Schema are derived artifacts. Regenerate them from inspected source;
  do not edit generated fields, paths or types by hand.
- The laptop-link wire schema has one named TypeBox owner. Reuse/reference
  externally owned HTTP shapes where applicable instead of copying wire DTOs.
- Contract checks compare generated snapshots to source and exercise real route
  bindings. Reject undocumented active routes, duplicate registrations and schema
  drift. Keep the distinction between existing mock-only declarations and actual
  implemented operations; do not silently remove the mobile contract's future
  operations or label mock operations implemented.
- Markdown examples and shared requests explain intent and review decisions;
  they are not endpoint/schema authority. Source-contract YAML documents module
  ownership, actual symbols and test evidence without duplicating wire fields.

## Model/provider independence

User requirement, 2026-10-17: MiniMax is an experiment provider, not the selected
primary model or an architectural dependency.

The relay has no model call or provider SDK dependency. In the later brain slice,
the host injects the chosen model and available tool adapters into the shared agent
loop. The shared brain chooses no provider, reads no environment keys and defines
no default model name; concrete provider adapters belong to host composition.
Preserve opaque provider metadata without making one provider's reasoning format
part of the shared loop. Validate required capabilities and report unsupported
ones explicitly rather than silently switching models. Future brain checks must
exercise model substitution and missing host tools without requiring a paid
provider. Record live acceptance separately for each provider actually tested.

## Boundaries and proposed module jobs

These are future paths, not an implemented code map or placeholder contracts:

| Intended owner | Job |
| --- | --- |
| `src/modules/links/` | Account/device-bound pairing, current connection generation and link revocation |
| `src/modules/sessions/` | Cloud session/step projection and its stable replay positions |
| `src/transports/laptop-link/` | Versioned frame validation, socket lifecycle and translation into public service operations |
| Existing `src/transports/http/` | Actual linked-laptop/session HTTP and SSE operations using their canonical schemas |
| Existing identity/devices public interfaces | Principal validation and revocation; no second token/session implementation |

Add storage/migrations only for the accepted path. Do not build a generic event
bus, queue framework, provider router or empty feature directories. Changed source
contracts and the hand-written code map arrive with inspected implementation.

## Protocol invariants for the Native agreement

The accepted consumer agreement, before an implementation plan locks signatures,
must fix the operation table and wire version around these requirements:

- Authenticated principal determines account and device; frames cannot choose an
  account. The code issuer and claimer must belong to the same account.
- One-time pairing code issuance is a new backend operation, not something the
  desktop UI invents locally. The existing claim operation/schema remains canonical.
- The sidecar receives credentials from Tauri in memory, never reads a `.env` or
  keeps backend credentials in its SQLite database. No credential goes in a URL,
  JSON session event, model prompt or diagnostic report.
- Versioned handshake and event envelopes name one linked laptop, one connection
  generation and stable retransmission identities. The server assigns/validates
  cloud IDs and maps local session/step identities explicitly; never assume a
  Claude Code session ID is already the cloud UUID.
- Maintain one bounded ordered processing lane per laptop. Install message
  listeners before awaited initialization. Check types, size and scope before
  persistence, and catch established-message errors outside HTTP error hooks.
- Initial authentication is insufficient for a long-lived connection: reuse the
  identity owner's current authorization before accepting state-changing batches
  and sending protected events. Revocation prevents further reads/dispatch;
  idle sockets and credential refresh need an explicit Native lifecycle agreement.
- Client acknowledgement means the backend committed receipt. Later approval
  dispatch will separately distinguish queued, accepted and executed outcomes.
- Durable per-stream cursors are safe integers and are never reused. Snapshot and
  replay/live cutover must not lose an event accepted during the transition.
- Continue existing `?after=` semantics. Unknown or expired cursor returns
  `410 resnapshot_required` before SSE headers commit. Do not replace that with
  the plugin's example of replaying arbitrary in-memory history.
- Bound frames, queued bytes and concurrent work. A slow peer must be paused or
  disconnected with an honest resnapshot/retry outcome, never given an unbounded
  in-process queue. Crash/reconnect recovers from committed data, not socket memory.

### Session projection and existing local implementation

The local NYLRA branch `spec/aylul-hook-laptop` at `0d086b6` already contains
session/approval/store code and a Rust hook. It was inspected, not merged or
retested here. Its review/integration into current main is a Native dependency;
do not create a second hook, SQLite store or grant evaluator in this slice.

The sidecar-to-cloud projection allows only the reviewed session metadata and the
canonical tool/path/one-line-summary step fields. Never forward the full HookEvent,
transcript path, tool input/output, patches, file content or full assistant message.
The existing local path/target field may contain shell commands and inline secrets;
the Native agreement must explicitly omit those command targets from session
steps, while retaining their source only on the laptop. Full approval-command
presentation is a separate consent-bearing path, not a reason to leak it through
session summaries. A field allowlist does not prove semantic secret redaction;
actual projection fixtures must exercise the inspected source shapes.

## Acceptance

The implementation plan must give exact paths and test assertions for:

1. Pairing from the correct account, wrong-account refusal, one-use/expiry and
   concurrent claims; revocation and retries cannot create duplicate links.
2. Authenticated upgrade, denied first frame, initialization race, malformed or
   oversized frame and post-upgrade device/session/link revocation.
3. Stable local-to-cloud mapping, duplicate event replay, changed-payload conflict,
   transaction rollback and reconnect after a crash before/after acknowledgement.
4. Newer connection fencing an older one; disconnect cannot mark a newer live
   connection offline or resurrect a revoked link.
5. Snapshot/replay/live cutover, gapless ordering, expiry/unknown cursor 410 and
   slow-consumer bounds through a real HTTP/WebSocket listener and PostgreSQL.
6. Projection fixtures showing no tool payload, transcript, full assistant message
   or inline shell-command credential enters cloud session storage/events.
7. Continued account/device isolation through HTTP/SSE and actual existing B1
   authorization; transport fixtures alone are not evidence of that integration.
8. Existing auth/schema/contracts checks, and real NYLRA/phone acceptance recorded
   separately with the relevant consumer source versions.
9. Generate OpenAPI, clients and laptop frame artifacts from canonical source,
   detect deliberate drift and verify real route bindings, while preserving the
   distinction between mock-only and implemented operations.

Before using real identity/project/session content, close the approved lifecycle
requirements with deletion, invalidation and quarantine-restore tests. Do not
simply remove synthetic mode or turn the existing deferred lifecycle script green.
The first synthetic relay path must document the gate without claiming real-data
or deployment readiness.

## Decisions to close before the implementation plan

These are explicit owner decisions and closing triggers, not permission for an
implementer to choose a wire protocol silently:

| Decision | Owner and closing trigger |
| --- | --- |
| Native code baseline | Native: review/integrate the existing hook branch or explicitly select its immutable artifact; accepted shared agreement names it |
| Pairing issue operation and code policy | Backend + Native: accept issuance/claim shape, lifetime, retry/reissue and attempt limits using current authenticated-device semantics |
| Laptop frame protocol | Backend + Native: accept version negotiation, durable local outbox/ack/replay mapping, connection fencing, refresh/idle revocation and concrete resource bounds |
| Canonical protocol generation | Backend: select the exact TypeBox source owner and generator entry point under the mandatory code-owned generation rules above |
| Cloud projection | Native + Backend: agree exact inspected fields and command-target omission before reading real local records |
| Real-data lifecycle | Each persistence owner: deletion/invalidation/restore evidence under approved architecture policy; scoped project excerpts remain separately unapproved |
| Brain distribution and usage mapping | Step 2(c), Backend + Native: versioned provider-independent artifact and per-adapter usage mapping; MiniMax testing selects no primary provider |

User review of this written specification and acceptance of the cross-side
agreement precede the implementation plan. Product code, root dependencies,
schema snapshots and publication remain unchanged by this draft. The user
authorized a local documentation commit and Astra/low review on 2026-10-17;
that review does not accept the unresolved Native interface or authorize source work.
