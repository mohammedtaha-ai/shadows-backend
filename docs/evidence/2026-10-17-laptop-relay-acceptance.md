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

During Tasks 1–7 the existing shared TLS ingress was stopped. That journey proves
fresh loopback TLS/WSS, not deployed ingress or real-device trust. The later
Task 8 development-ingress results below supersede only the local-ingress gap.
`test:lifecycle` remains
explicitly deferred (exit 2), and real-data startup remains refused. Component
expiry tests do not close account/provider deletion, backup or quarantine restore.
Remote CI, production readiness, publication, PR and deployment are not claimed.

## Development ingress continuation (Task 8)

The human asked to continue after the persistent development `shadows` database
was migrated through 008 and all five Compose services were started. No database
volume was reset. The existing generic proxy lacked WebSocket Upgrade forwarding.
The actual-Nginx test first failed with `Unexpected server response: 404` on WSS.
The SSE test already passed because the SSE plugin emits `X-Accel-Buffering: no`;
this was verified baseline behavior, not an SSE failure claimed as reproduced.

The generic API proxy now explicitly forwards upgrade headers using HTTP/1.1,
retains the inherited host/protocol headers, disables buffering/cache and uses
a 75-second read timeout. Paths/schemas/domain behavior remain code-owned and
unchanged. The pinned Nginx fixture uses the actual config, replacing only ports
and TLS paths. Both WSS/revocation and prompt small-event SSE tests passed.

Before reload, the new actual-Compose journey failed at WSS as expected. After
`nginx -t` and reload, it passed actual Keycloak login, pairing, WSS, recovery
from an unpersisted ACK checkpoint, deduplicated replay, session/account SSE,
unlink refusal and created-device revocation through `https://127.0.0.1:8443`.
An initial journey assertion expected `session_updated` on the account stream;
the canonical account event is `session_changed`. Only that test expectation was
corrected; no wire schema or product rule changed to accommodate it.
The journey does not claim a true network-lost ACK (the original SQL-barrier
journey covers that), real Native/hook/phone acceptance or lifecycle closure.
Credentials were neither printed nor persisted by the new journey. Its synthetic
database rows use the ordinary owners' cleanup/expiry rules, not direct DB edits.

The prior code-map Minor (pre-relay statements beside live descriptions) is now
corrected as part of the explicitly authorized continuation/documentation task.
The scoped Astra/low read-only review found no Critical issue and one Important:
revocation-close waits could hang without reaching cleanup. A real socket whose
remote peer paused reads reproduced the unbounded cleanup before the fix. The
shared synthetic peer now has an abortable close deadline and force-termination
on timeout; a second regression checks bounded failure and execution of cleanup.
The review also identified a missing explicit timeout on generated HTTP-client
requests; the journey now gives each request its own 15-second abort deadline.

The first final suite was interrupted when all five Docker services stopped
together (exit 255). Its partial log is not a passing suite result. The same
existing services/volumes were restarted; final verification is recorded below
only after a completed rerun. The reviewer did not rerun runtime/tests; Native,
phone, production and real-data lifecycle remain separate, and the already
reviewed Tasks 1–7 were not reviewed again for this small continuation.

Final completed rerun: Docker `npm test` passed **88/88**, zero failed, skipped
or cancelled, 126089 ms. Typecheck, contracts, architecture boundaries,
auth/NYLRA snapshots, laptop-frame freshness, docs/YAML and source-secret checks
passed. Docs checked 41 files with 16 sibling links explicitly unverified by that
checker; source-secret check inspected 13 changed files with zero findings.
The actual Compose relay journey passed again after the review fixes. Nginx
syntax validation passed; Windows HTTPS health with the explicit CA returned
200; the five existing Compose services were healthy. No remote CI was run.

Read-only next-consumer inspection: `nylra` remains at `93d787f`, clean on
`codex/aylul-laptop-relay`; local Native baseline `spec/aylul-hook-laptop`
at `0d086b6` is still unmerged. It already owns the SQLite session/step store,
hooks and Tauri sidecar lifecycle. It has no cloud-link/outbox module, and local
step targets/summaries can contain shell commands. Its Native integration needs
generated-artifact projection, scoped persistent outgoing checkpoints and a
native-only credential handoff. This continuation changes no sibling source,
installs no actual agent hook and does not forward real local history.

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
