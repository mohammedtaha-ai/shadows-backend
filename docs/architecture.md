# Shared Cloud Architecture

Date: 2026-10-10.
Status: Agreed product and architecture direction recorded from the discussion.
Detailed interfaces and the OPEN prerequisites below still need written review
before implementation. No capability in this document is claimed implemented.

This file owns the shared architecture. The [NYLRA vision](../../nylra/Vision.md)
owns the companion's experience and future product capabilities. Shadows' own
specifications continue to own its planning and execution rules.
Specifically, [Shadows §1.7](../../shadows/docs/superpowers/specs/2026-09-21-architecture-design.md#17-workspace-authority-and-deployment)
owns workspace authority, runtime placement, synchronization and worker assignment;
[§24.6](../../shadows/docs/superpowers/specs/2026-10-08-approval-authority-design.md#246-external-human-confirmation-and-assessment)
owns external confirmation and assessment. These decisions were clarified on
2026-10-10 at the user's request; they are not implementation evidence.

## 1. Product boundaries

| Repository | Sole responsibility |
| --- | --- |
| `shadows` | Rust project rules and runtime for local and future server deployment |
| `shadows-backend` | TypeScript cloud coordination and NYLRA application |
| `nylra` | The companion's desktop and mobile experiences |

The shared backend hosts NYLRA's conversation orchestration, personal memory,
context retrieval, model calls, notification policy, and human-intervention
workflow. Accounts, trusted devices, and project linking serve both products.
NYLRA remains a distinct optional product domain within that application.

Shadows works locally without NYLRA. Its local daemon owns local projects,
plans, contracts, Planner sessions, and execution as those capabilities are
delivered. Cloud integration does not require replacing its SQLite storage.

## 2. Languages and technology direction

| Component | Selected direction |
| --- | --- |
| Shared cloud application | TypeScript on Node.js |
| Cloud persistence | PostgreSQL with SQL migrations |
| Existing Shadows runtime | Rust |
| NYLRA desktop interface | TypeScript with React |
| NYLRA desktop platform integration | Rust inside Tauri 2 |
| NYLRA mobile application | Flutter with Dart for Android and iOS |

These choices divide responsibilities across the complete product. There is
no planned TypeScript-to-Go or TypeScript-to-Rust cloud-backend rewrite.
Adding capabilities follows the existing boundaries. Choice of a provider
library does not determine the application's domain shapes or authority rules.

The [B0 evidence](evidence/2026-10-10-backend-capability-probes.md) supports
Fastify 5 with TypeBox/schema-derived OpenAPI, Kysely/pg, node-pg-migrate as the
sole cloud SQL migration history owner, and pg-boss as durable job transport.
These component decisions remain subject to review; they do not close the
aggregate capability prerequisite or authorize B1. Actual model-provider SDK
selection, identity deployment and deployment services remain unresolved.
The [2026-10-11 follow-up](evidence/2026-10-11-b0-closure-followup.md) establishes
bounded MiniMax-M3 tool-result/reasoning continuity and client abort behavior.
Keycloak is a preliminary identity recommendation, with image-transfer/native
acceptance blocked. Lifecycle proposals and the B1 execution plan remain unwritten
at the user's local stop-and-publish checkpoint; no OPEN is closed by this handoff.
Axum, SQLx, Rig, and PGMQ from
earlier alternatives are not adopted cloud dependencies by this agreement.
Semantic search may use PostgreSQL extensions if justified by retrieval needs;
pgvector, Redis, and a dedicated graph engine are not mandatory infrastructure.

## 3. Application organization

The cloud application is organized as a modular application with one entry
point for composition, configuration, startup, and shutdown. Transport adapters
translate requests and events into service operations. Services own domain
rules and stores; provider adapters translate external APIs.

| Responsibility boundary | Sole ownership |
| --- | --- |
| Identity | Authenticated account identity |
| Membership | Account roles and access to team workspaces |
| Devices | Device trust lifecycle |
| Shadows links | Allowed access to paired instances and selected projects |
| Intervention topics | Lifecycle of an issue requiring human attention |
| Confirmations | Proof of explicit confirmation of exact content |
| Delivery | Reliable handoff of requests and responses |
| NYLRA conversations | The user's dialogue with NYLRA |
| Personal memory | User interaction preferences with provenance |
| Context | Bounded assembly of permitted source material |
| Notifications | Selection of user interruption channels |
| Provider adapters | Translation to model and speech APIs |

This is an ownership map for the design, not a claim that these source modules
exist. Exact package layout and service interfaces are specified with their
first implementation. Background workers invoke the same service rules as
interactive requests. They are not another authority or another copy of the
application. Deployment topology does not change ownership.

Clients never access PostgreSQL directly. Services do not reach into another
service's private store. Cross-service atomic work uses explicitly declared
transactional operations. A source module earns its place through a real user;
the architecture does not require empty packages for future features.

The [source organization proposal](source-structure.md) maps these boundaries to
future paths. It is a design for review, not an existing code map or scaffolding.

## 4. Connection topology

```text
NYLRA Desktop <------ local API ------> Shadows local daemon
      |                                      |
      | cloud client                         | authenticated outbound link
      v                                      v
                    shadows-backend
                           ^
                           | cloud client
                     NYLRA Mobile
```

Desktop presentation runs in TypeScript. Native desktop capabilities run in
Tauri's Rust side, including windows, tray behavior, shortcuts, and integration
with the local daemon. Its frontend reaches those functions through Tauri IPC.

Shadows' cloud connector belongs to the daemon's lifecycle, not to the NYLRA
desktop window. Closing NYLRA desktop does not terminate that connection while
the Shadows daemon is running. The local daemon initiates the connection;
no public inbound port is required on the user's computer.

| Operation | Path |
| --- | --- |
| NYLRA chat, personal memory, explanation | Desktop or mobile to shared backend |
| Open a local plan or navigate to local work | Desktop to local Shadows API |
| Ask Planner through NYLRA | Client to cloud to local connector to Planner |
| Confirm through NYLRA | Client confirmation flow to cloud to local owner validation |
| Planner requests human intervention | Local owner to cloud to desktop/mobile notification |
| Retrieve additional context | Cloud request through the scoped local connector |

Direct desktop integration supports local presentation and navigation. It does
not introduce an alternative hidden route for NYLRA approvals. Local Shadows
client actions continue to follow Shadows' own rules.

## 5. Accounts, instances, and project selection

A stable account identifier owns the user's relationship with trusted devices
and Shadows instances. Name and email are account attributes, not project keys.
Linking an instance does not automatically publish every project.

The user enables NYLRA for selected projects. Other projects remain local and
unavailable to the cloud connector. One personal companion can serve multiple
linked projects and instances. Each topic and source reference remains scoped
to its actual instance, workspace, project, plan, and relevant Planner thread.

Personal communication preferences can be account-wide. Project-specific
information retains its project scope. A preference is not authorization and
cannot override a project's approved rules. Cross-project context requires
permission for every involved source.

### What lives where

This is the sharing inventory. Shadows §1.7 owns workspace authority and sync.

| Data | Primary home | What this cloud application receives |
| --- | --- | --- |
| Personal plans, agreements, decisions and Planner history | Owning local Shadows | Selected topic context and permitted excerpts only |
| Personal source tree, artifacts and code index | Owning computer | No automatic upload; selected excerpts or explicit artifact transfer |
| Team plans, agreements and execution records | Server Rust runtime's PostgreSQL store | Authorized projections and topic evidence through its API |
| Team code and artifacts | Selected Git remote and scoped artifact storage, with worker checkouts | References/digests; content only for authorized operations |
| NYLRA conversations, personal memory and notification preferences | Cloud NYLRA store | Cloud-owned data with scoped client caches |
| Accounts, membership, device trust and project links | Cloud coordination store | Cloud-owned access metadata |
| Active harness processes and execution state | Assigned machine | Status/evidence through the owner, never live-process replication |

Connection states are **local only**, **linked for NYLRA**, and **member of a
team workspace**. Linking never converts a personal project into a team project.
Membership exposes neither personal projects nor personal NYLRA memory to a team.
Publication into a team is an explicit selected import with new target ownership
and source provenance, not ongoing bidirectional sync or publication of history.

Selecting a project is not blanket permission to upload its files. The user sees
permitted data categories and can inspect/revoke sharing. The local connector
filters before transmission; the cloud cannot widen its grant. Cross-project
retrieval checks every source, not just the destination topic.

Cloud NYLRA and the selected model provider process permitted plaintext. Encryption
in transit/at rest must not be presented as end-to-end encryption hiding that text
from those processors. Local-model support needs a separate future execution path;
BYOK does not make cloud reasoning local.

Revocation blocks new reads, queued dispatches and use of cached context for new
explanations. Summaries, embeddings and caches retain source scope for invalidation
and deletion. Personal memory cannot turn project content into account-wide access.
Already viewed/exported data cannot be recalled from people or providers; disclose
that limit. Minimal audit metadata is retained separately from content under an
explicit policy. Exact retention periods and backup purge deadlines close the
data-lifecycle OPEN before storing real content.

## 6. Current work context, not transcript replication

The integration follows the current work and intervention topics. It does not
upload complete Planner histories or copy the local SQLite database.

A topic carries the affected work, the reported contradiction, the manager's
assessment where present, Planner's proposed direction, the human question,
and references to relevant agreements, decisions, artifacts, and conversation
excerpts. References retain their source versions and provenance.

The working Planner thread is associated with that work. It is not selected
by taking the newest conversation globally. Relevant older decisions can be
retrieved by reference without replicating all older conversations.

When the user talks to Planner directly, NYLRA can obtain the permitted current
work context through Shadows when the user opens the related topic. The exact
production of that bounded context is an implementation prerequisite, not a
claim that current SSE already supplies it.

The backend retains NYLRA's own topic conversation and the permitted evidence
needed to continue explaining it on another device. Additional material is
fetched on demand. A summary is a derived explanation, not a replacement for
the authoritative decision, contract, or plan version.

## 7. Escalation and explanation

```text
Executor detects a task contradiction
    -> Manager evaluates within its granted authority
    -> Planner evaluates material planning issues
    -> NYLRA contacts the person for reserved or unresolved decisions
```

Manager and executor capabilities belong to Shadows' future execution design;
they do not become implemented through this document. NYLRA is not the manager,
Planner, or executor, and is not a mandatory hop between those roles.

Explanation uses NYLRA's independently selected model and bounded retrieval.
Ordinary clarification questions do not require another Planner turn. A request
for a new technical assessment is sent explicitly to Planner and returns as
Planner's opinion. Missing evidence or uncertain interpretation stays visible.
Retrieved project text never grants a capability or confirms an approval.

The objective is to move repeated explanation and voice dialogue away from
the expensive planning model. Measure model calls, retrieval, speech cost,
latency, and user corrections; illustrative savings are not measured results.

## 8. Decision and approval integrity

The lifecycle distinguishes user proposal, Planner assessment, human
confirmation, request delivery, acceptance by the owning runtime, and the
resulting work. Sending a proposal is not adopting it.

NYLRA's language model cannot generate human confirmation, modify project plans,
run shells, or bypass the owning runtime's rules. The trusted confirmation path
binds the person and device to the exact proposal and source basis. The owner
rechecks authority and current versions before recording acceptance.

The client distinguishes queued, delivered, accepted, rejected, expired, and
completed outcomes. It does not report adoption or resumed work merely because
a request was sent. Assessment-only requests need enforced write restrictions;
a natural-language instruction alone does not establish those restrictions.

Shadows §24.6 defines Planner approval versus human confirmation. The trusted
client displays the exact operation/proposal independently of generated chat and
requires a deliberate confirmation action. Voice may prepare a proposal; it cannot
automatically sign a model's interpretation. Voice-only confirmation requires a
separately reviewed mechanism. Preferences never become delegated authority.

## 9. Reliability and disconnected devices

Topics and pending deliveries are durable. Requests carry stable identifiers,
scope, and their intended source versions. Reconnection resumes from a recorded
position and reconciles current topic state. Retries can redeliver a message;
idempotency prevents a second domain effect. Receipt is distinct from acceptance.
An authorized identical retry returns its recorded outcome. Reusing the same
identity for different normalized content conflicts; duplicate delivery itself is
not an error. Reconnect does not reapprove work.

Changed or superseded proposals invalidate stale confirmation. Revoked project
links prevent new reads and dispatches, including work waiting in a queue.
Worker interruption must leave pending work recoverable.

If the local daemon is offline, NYLRA can explain retained permitted evidence
with its last-updated state visible. New local reads, Planner evaluations, and
local adoption wait for the owner to reconnect. Offline responses cannot bypass
the owner's fresh validation. No desktop UI is required to keep the local link
alive, but a running local daemon and device connection are required.

## 10. Speech and client responsibilities

```text
Client microphone -> STT -> NYLRA reasoning model -> TTS -> client playback
```

Reasoning, transcription, and speech synthesis providers are independently
selectable. Text remains usable when voice is unavailable. Clients own capture,
playback, presentation, and operating-system integration; the cloud owns the
shared NYLRA conversation and orchestration. Push, in-app speech, and a future
telephone call are distinct channels. Sensitive confirmation rules apply
regardless of the channel.

## 11. Future cloud workspaces and operations

Shadows §1.7 owns the runtime decision. Future cloud deployment composes this
TypeScript application with a Rust Shadows server from the `shadows` repository.
The TypeScript choice does not require rewriting project rules. The PostgreSQL
product adapter belongs to `shadows-core`. Deployment manifests may compose both
processes without transferring source or table ownership.

The workspace owner and execution machine are different roles. Team planning can
remain available while a member's laptop is offline; work assigned to that laptop
has not moved merely because a cloud conversation remains available.

Backup, code transfer, ownership migration and execution handoff are separate
explicit operations under §1.7. Initial NYLRA linking performs none implicitly.
A stopped personal computer has no available Planner or new local execution;
cloud explanation is limited to permitted cached facts.

Server administration, production work, and AWS operations remain future scoped
Shadows capabilities. Their runtime owns execution and authorization. NYLRA
can explain and convey user intent without gaining unrestricted infrastructure
authority. These future capabilities belong to the complete product direction;
their delivery does not imply a cloud-language rewrite.

The future Production feature is continuous application operations, including
AWS resource observation, diagnosis, proposed remediation and verified outcomes.
[Shadows §17.12](../../shadows/docs/superpowers/specs/2026-10-01-task-contracts-and-evidence-design.md#1712-production-operations-extension)
owns this lifecycle. This backend handles scoped observation delivery and NYLRA
incident conversations; Rust owns action authority and verification. An always-on
collector must have explicit placement and read scope. If a personal owner is
offline, cloud alerts can continue but owner-dependent actions cannot silently
transfer to this application. Existing autoscaling is not a second loop to fight.

No operations packages are scaffolded by this direction. The first implementation
maps each needed operation to its existing owner or gives a new responsibility
one explicit owner. Competition-specific research is a dated note, never the
authority for production behavior.

## 12. Source contracts and documentation

Use [the supplied template](contracts/TEMPLATE.yaml) for implemented source
modules. Its example bodies are illustrative. No example test name proves a
new project's behavior. Contracts describe inspected code, reference external
types, identify stable symbols in gaps, and state the evidence for obligations.
The [contract convention](contracts/README.md) owns placement, granularity and
evidence rules for applying that template in both new repositories.

Maintain one code-map owner row per implemented module. Keep design intent,
source behavior, and dated verification separate. Do not maintain parallel
versions of this architecture in client documents; refer to its owner sections.

## 13. OPEN prerequisites and acceptance

These items are deliberately unresolved, with an explicit closing trigger:

- **Application framework and libraries:** close before the implementation plan
  selects packages, using an end-to-end provider stream, scoped retrieval,
  cancellation, and durable-delivery check for the actual supported providers.
  B0 partially verifies the HTTP/SQL/job components above and synthetic AI/OIDC
  behavior. This OPEN remains until actual-provider evidence and the remaining
  reviewed integration gates are obtained; flat DTO consumers are not J1 acceptance.
- **Identity and confirmation:** close before pairing or approval implementation
  by reviewing account/device trust, revocation, and a model-independent human
  confirmation flow implementing Shadows §24.6, including owner-side membership
  freshness and revocation. Neither local Origin checks nor a
  claimed `human` field establish remote human authority.
  B0's established OIDC libraries pass a synthetic loopback protocol fixture;
  deployed issuer, Windows system-browser/native return, persistent sessions and
  device revocation are still unverified. Token revocation/logout alone cannot
  close backend device trust or Shadows owner-side authority.
- **Integration protocol and context production:** close before connector work
  by reviewing schemas, initial-context/reconnect semantics, permitted fields,
  context limits, source versions, and generation of the appropriate Planner
  work context. Existing local streams are not assumed a complete cloud feed.
- **Data lifecycle:** close before persisting real user/project content by setting
  retention periods, backup purge deadlines and testable deletion/invalidation
  propagation for section 5's sharing rules, including provider retention.
- **Voice and native client capabilities:** close before the corresponding client
  implementation plan by demonstrating capture, playback, interruption,
  background/lock-screen notification behavior, reconnect, and the same topic
  continued across a real desktop and phone.
- **Deployment and provider configuration:** close before deployment by reviewing
  hosting, durable workers, backups, provider configuration isolation, and
  secret-reference resolution without values in prompts, events, or logs.

Acceptance must show a direct Planner conversation followed by NYLRA explaining
the correct current work without a full-history upload; a manager/Planner
escalation when those roles exist; desktop-to-phone topic continuity; explicit
assessment and confirmation; stale/conflicting request rejection and identical
retry replay without a second effect; link
revocation; and recovery after connector, worker, and daemon interruption.
Library support, unit tests, and documentation alone do not establish those
running product paths.

## 14. Delivery order

The [delivery spec](superpowers/specs/2026-10-10-backend-delivery-design.md)
and [initial plan](superpowers/plans/2026-10-10-backend-initial-plan.md) make this
sequence actionable. Library candidates are tested first; experiment results amend
the spec and dependent tasks before implementation. Writing an initial conditional
plan does not close section 13's capability prerequisites.

The full local Shadows roadmap remains intact. NYLRA needs neither the future
manager nor executors to demonstrate value; cloud accounts never gate local use.

1. **Text integration:** close identity, context/protocol and data-lifecycle OPENs;
   connect one selected personal project, explain bounded current work after a
   direct Planner conversation, and continue the same topic on desktop and phone.
   Prove source/freshness display, revocation and reconnect without history upload.
2. **Assessment and confirmation:** implement §24.6's enforced assessment mode,
   trusted confirmation and owner validation. Prove stale-basis refusal, duplicate
   replay and recovery across client, connector and worker interruption.
3. **Voice and presence:** STT/TTS, native notifications, interruption, AYLUL and
   later telephone escalation require real-device evidence. Measure total cost
   and latency, including retrieval, speech, retries and corrections.
4. **Team workspace:** after the complete local release, implement §1.7's server,
   membership enforcement, PostgreSQL parity, artifacts and bounded local workers.
   Prove two users, isolation, conflicting edits and disconnected reconciliation.
5. **Cloud execution and portability:** prove isolated workers, attempt fencing,
   artifact handoff and explicit migration/restore. Future integrations, delegation,
   enterprise hosting and richer assistance stay in the full NYLRA inventory.

These are delivery boundaries, not an implementation plan or measured capability.
Each step needs reviewed interfaces and a runnable acceptance path.
