# Backend Initial Implementation Plan

**Local stop-and-publish checkpoint, 2026-10-11:** continue from the
[B0 follow-up handoff](../../evidence/2026-10-11-b0-closure-followup.md).
MiniMax continuity and negative protocol bindings now have scoped evidence.
Keycloak server/native acceptance, lifecycle proposals and executable B1 expansion
remain unfinished; no B1 or later task has started.

**2026-10-11 B0 supplement:** [real MiniMax results](../../evidence/2026-10-11-minimax-provider-probe.md)
pass completion, client cancellation, injected partial-response fault and one-round
tool execution for requested MiniMax-M3. This narrows the provider blocker for that
configuration only. Multi-round reasoning continuity, deployed identity/native
login and content-lifecycle decisions are not closed; B1 has not started.

> **For agentic workers:** Use superpowers:executing-plans for inline execution,
> or superpowers:subagent-driven-development when delegation is explicitly selected.

**Goal:** Deliver durable, scoped NYLRA conversations connected to real Shadows,
then add verified confirmation, mobile/voice, teams and Production in bounded slices.
**Architecture:** One modular Node application; Rust Shadows retains project rules.
**Tech Stack:** TypeScript/PostgreSQL; B0 supports Fastify/TypeBox/OpenAPI,
Kysely/pg, node-pg-migrate and pg-boss for component review. AI SDK Core and
deployed identity selection remain unresolved pending actual-provider/native proof.
**Spec:** [Backend delivery](../specs/2026-10-10-backend-delivery-design.md).
**Status:** B0 experiments executed with partial verification on 2026-10-10;
actual-provider and Windows/deployed identity gates remain blocked. B1 and every
later task are unstarted. [Evidence](../../evidence/2026-10-10-backend-capability-probes.md).

## Global constraints

- Experiments come first; update this plan from their results before dependent tasks.
- Source paths below are intended destinations, not existing modules.
- No fake provider/owner result may be called real integration acceptance.
- Preserve the complete roadmap; do not scaffold its unused modules.
- Contracts describe inspected implementation, with actual test references.
- No implicit production deployment, account changes or repository publication.

## Review focus

1. A revoked link with a queued command must not dispatch (B4).
2. Snapshot/replay overlap must lose no event or duplicate an effect (B2).
3. Disconnect after a provider chunk must preserve a truthful partial result (B3).
4. A reused command identity with changed content must conflict (B4).
5. Account/workspace substitution must reveal no other source or topic (B1/B2).

## Joint checkpoints and dependencies

J0 = B0/N0 evidence and revised plans. J1 = reviewed backend wire schemas and
conformance fixtures, consumed by Windows N2 and later Dart. J2 = B3/N2 plus real
Shadows context/connector acceptance. J3 = B4/N3 plus Shadows §24.6 acceptance.
The [client plan](../../../../nylra/docs/superpowers/plans/2026-10-10-nylra-initial-plan.md)
uses these same checkpoint names. B0 and N0 may progress independently; schema
freeze, identity and owner-side behavior are actual dependencies, not mocks to skip.

### B0: Capability experiments and plan amendment

**Output files:** `docs/evidence/<run-date>-backend-capability-probes.md`; amend
`docs/architecture.md`, the delivery spec and this plan as results require.
Keep disposable scripts outside product source; record their revision/provenance.

- [x] Inspect supported Node/library versions and licenses; pin the probe environment.
- [x] Exercise Fastify validation and generated schema with TS and one Dart consumer.
- [ ] Test real-provider stream completion, partial failure and explicit cancellation.
- [x] Run disposable PostgreSQL migrations and concurrent revision-conflict tests.
- [x] Prove atomic enqueue rollback and worker restart with pg-boss; reconcile an
  external result already applied before the worker records completion.
- [ ] Exercise maintained OIDC login via a Windows system browser, return binding,
  logout and revocation. Record actual selected provider and deployment requirements.
- [x] Record pass/fail, exact commands/versions, alternatives and unavailable evidence.
- [ ] Update dependent task paths/interfaces and test commands to match the selected
  tools; replace initial task outlines with executable steps before starting B1.

**Exit:** evidence-backed library decisions, revised plan and remaining blocked
capabilities named. Queue delivery guarantees never replace domain idempotency.

**Observed B0 state:** 15 local assertions pass; actual-provider and Windows
system-browser/deployed identity acceptance are blocked. Synthetic OIDC protocol
passes, but does not check the native return listener or persisted device sessions.
The compiled Dart consumer covers a flat DTO; full generator/J1 conformance is
unresolved. B0 remains partially verified; unchecked items above are not closed.

**Retained artifacts:** [non-product fixture package](../../../probes/b0-2026-10-10/README.md),
its exact lockfile, generated OpenAPI/TS/Dart artifacts and JSON results. The
report records baseline Git state and source/setup hashes. Do not delete the only
reproduction before reviewer inspection. No product source or code map is created.

**Executable B0 recheck commands (PowerShell):**

```powershell
Set-Location E:/Globalprojects/shadows-backend/probes/b0-2026-10-10
npm ci --fetch-timeout=30000 --fetch-retries=1
npm test
npm run check:docs
npm audit --json > artifacts/npm-audit.json
node provenance.mjs
```

The fixture package pins Fastify 5.12.5, TypeBox 0.34.52, swagger 9.9.2,
Kysely 0.29.6, pg 8.23.1, node-pg-migrate 9.0.0 and pg-boss 12.37.1.
AI SDK 6.0.303/OpenAI 3.0.125 and OIDC libraries are experimental pins until
their missing acceptance gates close. These are probe commands, not future
product test commands. The full versions/license table is in the evidence.

**Rulings for this bounded run:** keep the user's requested checkout and isolated
fixtures; no worktree/branch change or commit. Keep actual-provider/native gates
blocked rather than invent configuration. Adopt HTTP/store/migration/job components
only within observed limits; do not silently close architecture OPENs. Defer final
B1 adapter signatures and executable product steps until issuer/provider/lifecycle
decisions exist; guessing them would violate owner prerequisites. These rulings
require reviewer inspection before B1 and cost a follow-up B0 pass, not a rewrite.

### B1: Authenticated application and data lifecycle

**Intended files:** `src/main.ts`, `src/app/compose.ts`, `src/app/config.ts`,
`src/modules/identity/{index,service,model,store}.ts`, `src/modules/devices/`,
`src/platform/database/`, `migrations/`, `tests/integration/identity.test.ts`.
Create only required files; populate contracts and actual code map with the source.
**Consumes:** B0 identity/migration selections. **Produces:** verified principal
and device context through the selected identity adapter, never a caller-claimed id.

**Prerequisite amendment:** do not start from this outline. First finish actual
identity/native evidence and its review, accept B0 component selections, and close
real-content lifecycle. Then replace the identity adapter outline with executable
steps, exact product scripts and account/device revocation/expiry/restart cases.
Use node-pg-migrate for cloud migrations and Kysely/pg transactions; no second
application migration history. B0's synthetic automatic consent and in-memory
provider adapter must not be copied into product source.

- [ ] Close architecture identity and real-content retention/deletion decisions.
- [ ] Write failing acceptance cases: expired session, revoked device, foreign
  account id, replayed login return and restart with persisted session state.
- [ ] Implement composition, authentication and scoped persistence using selected tools.
- [ ] Verify fresh/upgrade migration behavior and that provider data never enters logs.
- [ ] Add successful login/logout journey and test fixtures for J1 clients.
- [ ] Run the selected checks; update contracts, evidence and commit this slice.

### B2: Selected links, bounded sources and J1

**Intended files:** `src/modules/links/`, `src/modules/context/`,
`src/modules/topics/`, `src/integrations/shadows/`, `src/transports/connector/`,
`api/`, `tests/integration/scoped-context.test.ts`,
`tests/journeys/connector-replay.test.ts`.
**Consumes:** B1 principal/device and actual Shadows grant boundary.
**Produces:** J1 schema artifact, examples and current topic/source projections.

**B0 amendment:** begin J1 review with TypeBox JSON schema and schema-derived
OpenAPI/TS artifacts; require explicit outgoing/envelope validation and runtime
consumer checks. Review a full Dart generator against rich J1 shapes before
calling TS/Dart conformance complete. Existing flat fixture names are not J1 DTOs.

- [ ] Specify J1 fields from spec section 4, normalized command hashing and schema
  ownership; choose exact DTO names once and generate consumer artifacts.
- [ ] Write failures for cross-project access, revoked links, inconsistent source
  versions, cursor gap/expiry, reconnect overlap and incompatible client schema.
- [ ] Implement initial snapshot plus replay boundary, selected-source filtering
  and resnapshot responses. Bound retained context and source sizes explicitly.
- [ ] Coordinate the Shadows dependency: daemon-owned outbound connector and
  bounded context production. Its implementation belongs in Shadows and its own plan.
- [ ] Run a real direct-Planner-conversation -> retrieved-context journey; fake
  connector tests prove protocol handling only. Mark J1/J2 readiness separately.
- [ ] Validate generated consumers and contracts, record evidence and commit.

### B3: Durable streamed conversation

**Intended files:** `src/modules/conversations/`, `src/integrations/providers/`,
`src/transports/http/`, `src/transports/jobs/`,
`tests/integration/conversation-stream.test.ts`, `tests/journeys/topic-restart.test.ts`.
**Consumes:** J1 topic/source projection. **Produces:** persisted conversation
entries, stream events and explicit terminal outcome under J1.

**B0 amendment:** actual-provider selection remains a gate. Add cases for thrown
stream iteration errors as well as error parts, retained deltas, usage and terminal
outcome. Distinguish HTTP disconnection from deliberate cancellation in persisted
service behavior. The synthetic provider cannot close J2.

- [ ] Test disconnect mid-output, explicit stop, provider failure, repeated send,
  out-of-order delivery, backend restart and source revocation during retrieval.
- [ ] Implement scoped orchestration and durable conversation lifecycle; separate
  client disconnection from intentional cancellation in the reviewed protocol.
- [ ] Prove source citations point to the actual versions used in the response.
- [ ] Run J2 jointly with Windows N2 using real provider and real Shadows sources.
- [ ] Record complete versus partial behavior, verify contracts and commit.

### B4: Assessment, exact confirmation and reliable handoff

**Intended files:** `src/modules/confirmations/`, `src/modules/delivery/`,
`tests/integration/confirmation-scope.test.ts`, `tests/journeys/owner-handoff.test.ts`.
**Consumes:** J1 and real Shadows §24.6 enforcement. **Produces:** owner-attributed
assessment/command outcomes without cloud substitution for runtime acceptance.

**B0 amendment:** use the declared same-transaction pg-boss Db operation for
enqueue; review lease/heartbeat/monitor/supervise budgets together. Require real
owner outcome replay/lookup after an ambiguous effect, refusal of changed command
fingerprints, and failed/retry-exhausted delivery visibility. Synthetic remote
tables and queue completion cannot substitute for §24.6 acceptance.

- [ ] Confirm Shadows dependency before enabling writes; unavailable enforcement
  results in an unavailable capability, not a prompt-only restriction.
- [ ] Test stale proposal, changed fingerprint, revoked device/link, duplicate
  delivery, two-device confirmation, worker crash and ambiguous owner timeout.
- [ ] Implement trusted confirmation binding and atomic durable delivery requests.
- [ ] Prove assessment cannot mutate project state; prove identical retry returns
  the original authorized result without another effect.
- [ ] Run J3 with Windows N3, inspect actual owner records, then commit with evidence.

## Later slices retained in the full plan

These are delivery outlines, expanded into executable tasks after prerequisite
evidence. Do not invent signatures or tests for components not yet designed.

| Slice | Dependencies | Intended owner/path | Acceptance exit |
| --- | --- | --- | --- |
| B5 Voice and notifications | B3, real client capture/playback proof | `integrations/providers/`, `modules/notifications/` | Interrupted audio, text fallback, quiet hours, duplicate alert grouping |
| B6 Personal memory and mobile continuity | B1/B3, retention decisions, N5 | `modules/memory/`, existing topics | Preference correction/deletion, scoped derived data, same topic on desktop/phone |
| B7 Team integration | Complete local release and Rust team server | `modules/membership/`, Shadows client adapter | Two users, role revocation, isolated workspaces, conflicting changes |
| B8 Production observation | Shadows §17.12 design and scoped collector | Context/topics/notifications, named provider adapter | Sourced incident while collector runs, explicit stale/offline behavior |
| B9 Production action/cloud portability | Real owner authority and worker design | Delivery plus Rust owner integration | Confirmed action, duplicate reconciliation, measured improvement or honest failure |

Advanced integrations, enterprise hosting, managed billing and broader channels
remain in Vision. Each gets a first-consumer design; no generic framework is reserved.

## Verification and change discipline

B0 must write exact reproducible commands for the selected package manager/test
runner, schema generation, migration and PostgreSQL fixture setup. These commands
now exist for the non-product probes above. Product package/scripts and exact
adapter-specific gates still require prerequisite review before B1. Each subsequent task starts with a failing behavioral test,
implements the smallest complete path, runs focused and required gates, updates
contracts and ends with one scoped commit. Documentation checks do not require
running the unrelated Shadows full suite. Runtime changes follow their own gates.

If a probe fails: record the failure, evaluate the named alternative against the
same cases, amend the owner decision and both affected plans, then restart dependent
work. Never preserve a rejected dependency just because its scaffold already exists.
