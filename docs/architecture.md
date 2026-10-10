# Shared Cloud Architecture

Date: 2026-10-10.
Status: Agreed product and architecture direction recorded from the discussion.
Detailed interfaces and the OPEN prerequisites below still need written review
before implementation. No capability in this document is claimed implemented.

This file owns the shared architecture. The [NYLRA vision](../../nylra/Vision.md)
owns the companion's experience and future product capabilities. Shadows' own
specifications continue to own its planning and execution rules.

## 1. Product boundaries

| Repository | Sole responsibility |
| --- | --- |
| `shadows` | The local software-delivery runtime |
| `shadows-backend` | The shared cloud application |
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

The HTTP framework, database access library, provider SDK, durable-job library,
and deployment services have not been selected. Axum, SQLx, Rig, and PGMQ from
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

## 9. Reliability and disconnected devices

Topics and pending deliveries are durable. Requests carry stable identifiers,
scope, and their intended source versions. Reconnection resumes from a recorded
position and reconciles current topic state. Retries can redeliver a message;
idempotency prevents a second domain effect. Receipt is distinct from acceptance.

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

Personal work remains local initially. Team workspaces are a future server-owned
Shadows capability. A server-owned workspace is authoritative for its own data;
a cloud copy of local context is not a competing authoritative workspace.

Continuing personal execution on a server requires an explicit synchronization
and execution-handoff design. Conversation synchronization alone does not move
files, harness state, processes, or execution authority.

Server administration, production work, and AWS operations remain future scoped
Shadows capabilities. Their runtime owns execution and authorization. NYLRA
can explain and convey user intent without gaining unrestricted infrastructure
authority. These future capabilities belong to the complete product direction;
their delivery does not imply a cloud-language rewrite.

## 12. Source contracts and documentation

Use [the supplied template](contracts/TEMPLATE.yaml) for implemented source
modules. Its example bodies are illustrative. No example test name proves a
new project's behavior. Contracts describe inspected code, reference external
types, identify stable symbols in gaps, and state the evidence for obligations.

Maintain one code-map owner row per implemented module. Keep design intent,
source behavior, and dated verification separate. Do not maintain parallel
versions of this architecture in client documents; refer to its owner sections.

## 13. OPEN prerequisites and acceptance

These items are deliberately unresolved, with an explicit closing trigger:

- **Application framework and libraries:** close before the implementation plan
  selects packages, using an end-to-end provider stream, scoped retrieval,
  cancellation, and durable-delivery check for the actual supported providers.
- **Identity and confirmation:** close before pairing or approval implementation
  by reviewing account/device trust, revocation, and a model-independent human
  confirmation flow. Reconcile the relevant Shadows authority specifications
  with the new external client boundary; neither local Origin checks nor a
  claimed `human` field establish remote human authority.
- **Integration protocol and context production:** close before connector work
  by reviewing schemas, initial-context/reconnect semantics, permitted fields,
  context limits, source versions, and generation of the appropriate Planner
  work context. Existing local streams are not assumed a complete cloud feed.
- **Data lifecycle:** close before persisting real user/project content by setting
  retention, deletion, cached-context invalidation, and visible sharing rules.
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
assessment and confirmation; rejection of stale or repeated requests; link
revocation; and recovery after connector, worker, and daemon interruption.
Library support, unit tests, and documentation alone do not establish those
running product paths.
