# Laptop relay local synthetic acceptance

Date: 2026-10-17. Branch: `codex/aylul-laptop-relay`, original checkout, no worktree.
The human approved the [plan](../backend/plans/2026-10-17-laptop-relay-implementation.md)
for inline backend execution on Docker. The [shared request](../shared/requests/2026-10-17-laptop-relay.md)
records backend contract acceptance; it does not claim Native implementation acceptance.

## Implemented boundary

One Fastify application wires existing Identity/Devices and the new Activity,
Links and Sessions owners. Canonical TypeBox operation/frame code generates
NYLRA 0.3.0 OpenAPI/TS and laptop frame v1 JSON Schema/TS. Only implemented rows
bind product handlers; future chat/approval/grant/push rows remain mock-only.
Auth 1.1.0 generation is isolated using the same auth registrar and stays unchanged.

Pairing codes are hashed, same-account, one-use, five-minute codes with persistent
limits. Links owns fenced epochs and receipt checkpoints. Sessions maps local
identities to server UUIDs and commits projections, journals and receipts together
before ACK. Ingress accepts no caller summary, raw hook, message or command target.
Summaries are fixed tool labels; file paths are allowed only for the reviewed tools.

SSE reads persisted pages, so a separate publisher process needs no local wakeup.
Snapshots use read-only repeatable-read transactions followed by fresh authority.
Unlink/source revocation removes payloads and invalidates replay before protected
delivery. Already written/viewed bytes cannot be recalled.

## Executed evidence

All Node/npm, generated schema checks and PostgreSQL tests run inside Docker's
`shadows-backend-local:dev` image, Node 24.19.0. Test PostgreSQL is owned ephemeral
18.4, not development databases. Synthetic OIDC fixtures use existing B1 services.
Root lockfile additions: @fastify/websocket 11.3.4, @fastify/sse 0.6.1,
ws 8.22.0, @types/ws 8.18.1 and json-schema-to-typescript 16.0.0.
ws was advanced from the planned 8.18.3 after npm audit reported memory/DoS
advisories; the observed install audit then reported zero vulnerabilities.

- Wire/mock generation checks: valid strict frames and deterministic snapshots;
  deliberate declaration drift refuses. HTTP binding tests deliberately alter
  method/body schema and detect drift. Auth generated snapshots stay identical.
- Activity: rollback does not burn seq 1; concurrent publishers, account isolation,
  invalidation/floor, pruning and safe-integer overflow pass.
- Pairing/leases: expiry/reissue, concurrent single winner, command replay/conflict,
  persistent device/account limits, 20-laptop cap and stale-epoch fencing pass.
- Sessions: actual SQL counts remain one after lost ACK/replay; a later batch
  failure rolls back its earlier step and receipt. Laptop identity isolation,
  expired/drop outcomes, caller-summary/command refusal and stale replay pass.
- Real loopback listeners: initialization race, malformed/oversized messages,
  device/session/link revocation, bounded queued input and pending-ACK authorization
  pass. Output saturation uses a controlled buffered-byte boundary, not a claim
  of real network saturation.
- HTTP/SSE: strict cursors, exact snapshot/replay/live IDs, independent process
  publishing and barriers between persisted reads and delivery pass. Wrong/revoked
  principals refuse; pending protected payloads are not delivered after revocation.
- The generated-artifact reference peer runs the complete HTTPS/WSS journey with
  a fresh synthetic TLS fixture: pairing, lost ACK, reconnect/replay, snapshot/SSE,
  epoch fencing, unlink and revocation. No sibling source is imported.

Full-suite results and final review are recorded below when observed.

## Acceptance still separate

The local Native baseline is unmerged `spec/aylul-hook-laptop` at `0d086b6`;
its actual generated-artifact consumer/outbox, phone/hook and current NYLRA
integration were not implemented or device-tested here. No model/provider call,
key lookup, real project/identity content, push, approval, memory or chat is part
of this slice. MiniMax remains a trial provider, with no primary-model selection.

The existing shared TLS ingress was stopped. The journey proves fresh loopback
TLS/WSS, not deployed ingress or real-device trust. `test:lifecycle` remains
explicitly deferred (exit 2), and real-data startup remains refused. Component
expiry tests do not close account/provider deletion, backup or quarantine restore.
Remote CI, production readiness, publication, PR and deployment are not claimed.

## Full local verification
Docker npm test: 75 tests passed, zero failed/skipped, 119146 ms. This includes
the pinned synthetic Keycloak HTTPS journey and fresh-process restart cases.
Typecheck, source contracts, boundaries, auth/NYLRA snapshots, laptop frame
freshness, documentation links/YAML and source secret checks passed. Docs check
reported 41 files and 16 external sibling links unverified by that checker.
Lifecycle intentionally returned its existing deferred exit 2. No remote CI ran.
Final fresh-context review is pending; this record is not a merge approval.
