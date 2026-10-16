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
That was the pre-review suite. Final review and the subsequent verified fix pass
are recorded below; this record is not a merge approval.

## Final reviewer and fixes
One fresh Astra/low review inspected 65095a6..deb35b7 read-only. It found five
Important issues: state-event lastStep loss, UUID-based list truncation, stalled SSE
send authorization/cancellation, dropped-ACK reconciliation and idle expiry cleanup.
All were reproduced by focused tests before fixes. The fix pass preserves latest
steps, selects active/recent sessions, cancels bounded sends independently, recovers
outstanding drop outcomes or refuses missing history, and schedules owned expiry.
Physical cleanup is startup plus each minute; logical expiry remains immediate.
An additional scheduler test verifies nonoverlap and draining at shutdown.
The reviewer did not rerun the suite. No second reviewer was dispatched.
One Minor documentation issue is deferred: old pre-relay statements remain beside
new implementation descriptions in the code map. Native/device, production/CI,
real-data lifecycle, provider-only origin invalidation, arbitrary filename secrets
and already-delivered bytes retain their explicitly separate limits.

## Post-fix verification
Final Docker npm test: **84/84 passed**, zero failures/skips, 116684 ms.
This includes the eight final-review regressions and an additional unstarted-pool
shutdown case. The earlier fix-suite failure in
`session_local_identity_is_laptop_scoped_and_expired_replay_refuses` came from
mixing PostgreSQL wall time with the injected fixture clock; its expiry inputs
now use that clock consistently, preserving the original refusal assertion.
Startup fixtures now migrate before starting, matching documented runtime setup;
`health_refuses_after_database_disconnect` also reproduced an already-ended pool
shutdown failure, fixed and verified. Contracts use literal test registrations.
Latest typecheck, boundaries/contracts, schema/freshness, docs/YAML, source secrets
and whitespace checks passed. All five Important findings were addressed in one
fix pass; the one documentation Minor is deferred. No second review or remote CI.

## Execution rulings

- Ruling: User's 2026-10-17 instruction to finish and execute approves the concrete planning proposals as coordinating supervisor — records backend contract acceptance, not Native implementation/device acceptance — cost if wrong: adapter changes need a reviewed contract revision.
- Ruling: Existing short branch isolates this work; no worktree — explicit user prohibition takes precedence — cost if wrong: unrelated changes must be preserved explicitly.
- Task 1: Ruling: Use ws 8.22.0 instead of planned 8.18.3 — npm audit identified two current memory/DoS advisories fixed by 8.21+ — cost if wrong: listener regression tests must detect peer incompatibility.
- Task 4: Ruling: Bind a narrow transactional Sessions invalidation port into Links — unlink must erase Sessions-owned payload atomically without querying foreign tables or adding a bus — cost if wrong: composition binding must remain mandatory in the live app.
- Task 5: Ruling: Move auth-only composition/export isolation forward from Task 6 — adding the real upgrade otherwise contaminates auth-v1 generation immediately — cost if wrong: wire snapshot tests detect unintended auth drift. Heartbeat authorization now refreshes Links-owned lastSeenAt so a healthy connected laptop does not falsely go offline.
- Task 6: Ruling: Synchronize locally revoked/expired origin sessions through public Identity operations and atomically remove the associated link/projections/journal — protected mobile reads must not retain revoked source payloads — cost if wrong: an expired native session requires deliberate re-pair rather than silently resuming erased history.
- Task 7: Ruling: The end-to-end verification can pass against Tasks 1–6 without inventing a product defect — after correcting a test-only Fastify compiler API mistake, the generated-artifact TLS journey passed on first valid run — cost if wrong: independent assertions and final reviewer must expose an unprotected integration assumption.
- Final: Ruling: Native/Flutter/device continuity remains separate — this is a backend synthetic slice with no consumer implementation — cost if wrong: real-device interoperability still needs Native acceptance.
- Final: Ruling: Production, real-data deletion/restore, deployment and remote CI remain unclaimed — existing lifecycle/runtime gates stay closed — cost if wrong: this branch cannot be treated as production acceptance.
- Final: Ruling: Previously written bytes cannot be recalled — authorize new deliveries and close pending work, without claiming network recall — cost if wrong: previously received content remains with its recipient.
- Final: Ruling: Legitimate filenames are not semantically redacted — preserve the reviewed file-tool policy and reject commands/caller summaries — cost if wrong: a user-chosen filename can still contain sensitive text.
- Final: Ruling: Origin-provider invalidation remains local-revoke based — reader authority remains freshly provider-checked, while synchronize follows the accepted local surrender authority — cost if wrong: origin-provider-only invalidation needs a separately reviewed owner policy.
- Final: Ruling: Preserve the 200-item wire limit with active/recent deterministic selection — correct random UUID truncation without inventing pagination — cost if wrong: older history needs a future generated pagination contract.
- Final: Ruling: Logical expiry is immediate; owned physical cleanup runs at startup and every 60 seconds — idle accounts cannot depend on client reads, and real-data lifecycle remains gated — cost if wrong: physical purge waits for the next healthy maintenance run or restart.
- Final: Ruling: Startup expiry requires migrated storage, matching the documented explicit migrate-before-start precondition — lifecycle fixtures now migrate before starting, and a separate test still proves stop-before-initialization — cost if wrong: an intentionally unmigrated health-only runtime now refuses startup.
