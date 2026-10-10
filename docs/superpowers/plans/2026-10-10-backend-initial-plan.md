# Backend Initial Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution,
> or superpowers:subagent-driven-development when delegation is explicitly selected.

**Goal:** Deliver durable, scoped NYLRA conversations connected to real Shadows,
then add verified confirmation, mobile/voice, teams and Production in bounded slices.
**Architecture:** One modular Node application; Rust Shadows retains project rules.
**Tech Stack:** TypeScript/PostgreSQL; Fastify, Kysely/pg, pg-boss and AI SDK Core
are B0 candidates, not dependencies already approved by experiment.
**Spec:** [Backend delivery](../specs/2026-10-10-backend-delivery-design.md).
**Status:** Initial plan, not executed. Requested together with the spec on 2026-10-10.

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

- [ ] Inspect supported Node/library versions and licenses; pin the probe environment.
- [ ] Exercise Fastify validation and generated schema with TS and one Dart consumer.
- [ ] Test real-provider stream completion, partial failure and explicit cancellation.
- [ ] Run disposable PostgreSQL migrations and concurrent revision-conflict tests.
- [ ] Prove atomic enqueue rollback and worker restart with pg-boss; reconcile an
  external result already applied before the worker records completion.
- [ ] Exercise maintained OIDC login via a Windows system browser, return binding,
  logout and revocation. Record actual selected provider and deployment requirements.
- [ ] Record pass/fail, exact commands/versions, alternatives and unavailable evidence.
- [ ] Update dependent task paths/interfaces and test commands to match the selected
  tools; replace initial task outlines with executable steps before starting B1.

**Exit:** evidence-backed library decisions, revised plan and remaining blocked
capabilities named. Queue delivery guarantees never replace domain idempotency.

### B1: Authenticated application and data lifecycle

**Intended files:** `src/main.ts`, `src/app/compose.ts`, `src/app/config.ts`,
`src/modules/identity/{index,service,model,store}.ts`, `src/modules/devices/`,
`src/platform/database/`, `migrations/`, `tests/integration/identity.test.ts`.
Create only required files; populate contracts and actual code map with the source.
**Consumes:** B0 identity/migration selections. **Produces:** verified principal
and device context through the selected identity adapter, never a caller-claimed id.

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
do not exist today. Each subsequent task starts with a failing behavioral test,
implements the smallest complete path, runs focused and required gates, updates
contracts and ends with one scoped commit. Documentation checks do not require
running the unrelated Shadows full suite. Runtime changes follow their own gates.

If a probe fails: record the failure, evaluate the named alternative against the
same cases, amend the owner decision and both affected plans, then restart dependent
work. Never preserve a rejected dependency just because its scaffold already exists.
