# Backend delivery design

**2026-10-11 evidence update:** [MiniMax supplement](../../evidence/2026-10-11-minimax-provider-probe.md)
establishes a narrow real M3 non-reasoning path through the OpenAI chat adapter.
Retain cancellation/error handling and test multi-round tool/reasoning continuity
before widening adoption. Deployed identity and J1 remain separately gated.

Date: 2026-10-10. Status: initial specification requested by Mohammed.
Library choices now have [partial B0 evidence](../../evidence/2026-10-10-backend-capability-probes.md).
HTTP/SQL/job component selections are recorded in architecture; actual provider
and deployed identity/native acceptance remain OPEN. No product implementation is
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

### B0 evidence amendment - 2026-10-10

Retained [non-product reproduction](../../../probes/b0-2026-10-10/README.md)
pins Node 24.15.0 and the inspected dependencies. Fifteen local assertions pass;
actual-provider and deployed-identity/Windows system-browser experiments are
blocked, so B0 is partially verified and B1 remains gated. The evidence report
owns observations, exact versions, decision table and review prerequisites.

- Use one canonical TypeBox wire schema for validation and OpenAPI export at the
  reviewed HTTP boundary. Fastify serialization does not enforce all constraints:
  validate outgoing objects and each raw stream envelope explicitly. Generated TS
  types alone do not validate untrusted JSON. The compiled Dart flat fixture does
  not select a general generator or prove rich J1/mobile compatibility.
- Kysely/pg passed real transactions and conditional revision conflicts.
  node-pg-migrate owns cloud SQL migration history, advisory exclusion and ordered
  upgrades; pg-boss owns its internal schema migrations. Do not create a second
  application history or let product modules access queue internals.
- Domain persistence and enqueue must share the workflow's transaction connection
  through the declared pg-boss Db adapter. Explicitly review expiry, heartbeat,
  monitor and supervise intervals: changing supervise alone does not bound recovery.
  Reconcile a remote durable outcome using stable identity/fingerprint before
  retrying an uncertain effect. This still requires real Shadows proof at B4.
- AI SDK Core 6.0.303/OpenAI adapter 3.0.125 pass synthetic tests only. An iterator
  may throw after text rather than yield an error part. Preserve partial output
  and persist one truthful complete/failed/cancelled terminal result on either path.
  Tool input validation is not project authorization. Real provider selection stays
  OPEN until actual stream, stop, faults and relevant tools are observed.
- openid-client 6.8.8/oidc-provider 9.12.2 pass synthetic public-client PKCE/state/
  nonce, expiry, replay, refresh revocation and logout cases. No hosted provider is
  selected. Native Windows return handling, persisted identity/device sessions,
  issuer configuration, production keys and immediate revocation policy require
  separate evidence. Review clock tolerance explicitly; the fixture uses zero.

No alternative HTTP/store/queue stack was needed after explicit schema validation
and recovery-timing configuration. Rejected older AI pins were patched and rerun;
unexecuted alternatives are not ranked. All library acceptance is bounded by the
report's cases, not a reduction of the full product direction.

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

OPENs close at these triggers: B0 evidence and review close library selection;
blocked actual-provider/native identity experiments keep that gate open. B1 closes identity and
real-data lifecycle decisions; J1 closes external schema/reconnect rules; B4 closes
remote authority proof with Shadows; voice/mobile gates close on actual devices.
No raw provider/session values belong in prompts, logs, evidence or source control.

Research: [candidate record](../../../../nylra/docs/evidence/2026-10-10-coucou-and-library-research.md).
Companion: [NYLRA spec](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md).
