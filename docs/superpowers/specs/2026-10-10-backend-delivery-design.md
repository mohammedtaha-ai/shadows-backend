# Backend delivery design

Date: 2026-10-10. Status: initial specification requested by Mohammed.
Library choices are candidates, not validated dependencies. No implementation is
claimed. The user explicitly requested writing this specification and its initial
plan together, with experiments first and plan revision from their results.

## 1. Ownership and intent

This file owns backend delivery gates and library evaluation. Existing owners:
[architecture](../../architecture.md) for product authority, data lifecycle and
deployment; [source structure](../../source-structure.md) for file placement;
[source contracts](../../contracts/README.md) for inspected implementation.
Amend those owners when an experiment changes their decisions; do not copy rules.

Build the cloud application that lets Windows NYLRA explain a selected Shadows
project with versioned sources, continue durable topics and request owner-validated
actions. Preserve mobile, voice, teams and Production in later complete slices.
Windows first does not make mobile protocols an afterthought.

## 2. Experiment gate B0

Use an isolated disposable environment and synthetic data. Record exact versions,
commands, machine, results, observed limits and license information. Provider
availability must be established before a real-provider claim; a fake is useful
for fault injection but cannot close a real-provider acceptance gate.

| Candidate | Proof required | Alternative if unsuitable |
| --- | --- | --- |
| Fastify + schema-derived OpenAPI | Stream start/chunk/end/error; cancellation; request/response validation; TS and Dart consumable schema | Evaluate Hono with the same fixture; do not silently replace the architecture |
| PostgreSQL + Kysely/pg | Scoped queries, explicit transactions, concurrent revision conflict, rollback and migration from empty/previous schema | Compare direct pg or Drizzle; select one store approach and one established migration tool |
| pg-boss | Domain write and enqueue commit or roll back together; crash after remote effect recovers through idempotency; retry exhaustion visible | Evaluate managed queue plus transactional outbox only if warranted |
| AI SDK Core | Actual supported provider stream, stop, disconnect, tool-call validation, partial output and usage/error semantics | Direct SDK for unsupported provider semantics behind the same consumer boundary |
| Established OIDC provider/client | System-browser login for Windows, one-time return binding, expired/revoked session and logout; future mobile support | Compare another maintained implementation/provider; do not invent authentication |

Evaluate SQL migration support explicitly; a query builder is not proof that raw
SQL migrations, locking and rollback satisfy our needs. Record which migration
tool owns history; do not run competing migration histories for the same tables.

HTTP/API schemas are owned at the transport boundary, exported as versioned
artifacts. Generate TS consumers first and compile one Dart consumer during B0.
Stream/reconnect envelopes must be documented even when OpenAPI generation alone
cannot describe all replay semantics. Prefer standard HTTP plus an explicitly
authenticated outbound connector; choose its transport from measured behavior.

**Exit:** select/reject each candidate, pin compatible versions, close or retain
named OPENs honestly, then amend this spec and every dependent plan task. A failed
candidate blocks dependent tasks, not independent character/UI work. Do not build
the application against an unproven choice and promise a later rewrite.

## 3. Application boundaries

Use the source-structure owner's modular application. HTTP handlers and job workers
call identical service operations. Framework/provider objects stay at boundaries.
Our modules own topics, permitted context, source provenance, confirmation records,
delivery outcomes and notification policy. Existing libraries own general HTTP,
SQL access, migration mechanics, job execution, authentication and model transport.

Do not publish a custom framework or general-purpose SDK at the start. A small
internal interface is justified by an actual adapter or test consumer. Extract a
versioned library only when another real consumer needs independent reuse. Shared
wire artifacts are not shared domain implementation. Rust Shadows remains the
owner of personal/team project rules and operational action authority.

## 4. Joint protocol contract J1

Before B2/client N2, write versioned schemas plus passing/invalid examples for:

- Account/device session and project-link scope, without provider secrets.
- Topic identity and instance/workspace/project/work/thread association.
- Source reference with version, acquisition time, permission scope and freshness.
- Snapshot with replay cursor; ordered event with stable identity and sequence.
- Conversation stream with explicit terminal outcome and persisted partial output.
- Command identity, operation kind/schema version, normalized fingerprint and
  expected source basis; receipt is separate from owner acceptance/completion.
- Error/refusal, source offline, authorization revoked and resnapshot required.

Pin producer schema revision and consumer artifact versions. Test reconnect at the
snapshot boundary, duplicates, gaps, expired cursor, client revision mismatch and
cross-project substitution. A new protocol version is introduced only for a real
compatibility need. Do not assume existing Shadows SSE is this external protocol.

## 5. Complete first journey

Sign in on Windows, link one explicitly selected project, open a topic after a
direct Planner conversation, retrieve permitted current-work evidence and receive
a streamed explanation with source links. Restart the client/backend/connector
and reopen the durable topic. Show source offline or revoked state truthfully.

An explanation can interpret sources but cannot grant a capability. Personal
preferences do not ingest private project facts into account-wide memory. Topic
retention, deletion and derived-cache invalidation must be decided in architecture
section 5/13 before real user content persists.

## 6. Later delivery gates

Assessment and confirmation depend on real Shadows §24.6 enforcement. Require a
restricted assessment context, exact trusted-client confirmation, owner revalidation
and replay of identical commands. Revocation must block queued dispatch and reads.
An unavailable owner leaves delivery pending; it does not turn cloud code into owner.

Voice adds independent STT/reasoning/TTS adapters, cancellation and text fallback.
Notification policy groups incidents and respects quiet hours, scope and urgency.
Mobile continues the same topic after Windows acceptance. Team identity is added
alongside the server Rust owner, never by reimplementing project rules here.
Production follows Shadows §17.12: observation first, then separately authorized
action and measured verification. Hosting/deployment choices remain separate from
the decision to integrate with AWS for the user's application.

## 7. Verification and unresolved decisions

Use real disposable PostgreSQL for store/transaction acceptance. Unit fakes cover
provider faults; separate real-provider evidence covers stream/cancel behavior.
Real Shadows integration and Windows acceptance are required before claiming an
end-to-end journey. Tests must prove scope isolation, replay, stale refusal,
revocation and worker interruption; source contracts cite inspected test bodies.

OPENs close at these triggers: B0 closes library selection; B1 closes identity and
real-data lifecycle decisions; J1 closes external schema/reconnect rules; B4 closes
remote authority proof with Shadows; voice/mobile gates close on actual devices.
No raw provider/session values belong in prompts, logs, evidence or source control.

Research: [candidate record](../../../../nylra/docs/evidence/2026-10-10-coucou-and-library-research.md).
Companion: [NYLRA spec](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md).
