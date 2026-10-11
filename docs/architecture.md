# Shared Cloud Architecture

Date: 2026-10-10.
Status: Agreed product and architecture direction recorded from the discussion.
The OPEN prerequisites below remain explicit. The 2026-10-11 continuation
implements B1 identity/device operations for synthetic Linux acceptance, as
recorded in [B1 evidence](evidence/2026-10-11-b1-linux-acceptance.md).
This does not close retention, native client, joint integration or deployment gates.

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
aggregate capability prerequisite or authorize B1. AI SDK/OpenAI chat is
conditionally supported for the tested MiniMax-M3 path; production provider
configuration, identity deployment and deployment services remain unresolved.
The [2026-10-11 follow-up](evidence/2026-10-11-b0-closure-followup.md) establishes
bounded MiniMax-M3 tool-result/reasoning continuity and client abort behavior.
The cloud follow-up passed Keycloak 26.8.0 server cases with synthetic accounts;
self-hosted Keycloak with openid-client 6.8.8 is the conditional recommendation.
Windows native acceptance and production operations remain OPEN. Section 5 now
contains lifecycle proposals for review, and the initial plan defines conditional
B1 tasks. Those B0 additions did not authorize B1. The later 2026-10-11 user instruction
authorizes backend implementation/Linux acceptance on the current branch and
moves Windows acceptance to NYLRA/later joint integration. It does not approve
retention-dependent B1.5, B2+, real identities or deployment. Runtime startup
requires synthetic data mode until retention-dependent acceptance closes.
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

### Recommended identity boundary — PROPOSED FOR USER REVIEW

**PROPOSED FOR USER REVIEW:** use self-hosted Keycloak 26.8.0 and the standard
openid-client 6.8.8 adapter. The [cloud identity evaluation](evidence/2026-10-11-b0-closure-followup.md#cloud-identity-recommendation)
compares only Keycloak and ZITADEL and records server/native/operational limits.
A separate identity database belongs to Keycloak; this application must not query
its tables or store passwords. Map `(issuer, subject)` to an internal account id;
never merge accounts by matching email or trust a client-supplied account id.

**PROPOSED FOR USER REVIEW:** the Node backend is the confidential OIDC relying
party. NYLRA native code opens the system browser and receives a short-lived,
one-use backend return ticket bound to a native-generated redemption challenge.
The backend owns OIDC state, nonce, S256 verifier and the fixed HTTPS provider
callback; native clients receive only backend session credentials. This is a
proposed integration boundary, not the public-client B0 fixture's implementation.
Windows uses an application-controlled IPv4 loopback listener; later Flutter uses
reviewed OS-bound return registration. No provider tokens enter the webview, chat,
URLs returned to native code, or generated public artifacts. Review this flow
jointly with NYLRA N0/N2 before implementation.

**PROPOSED FOR USER REVIEW:** store only hashes of 256-bit random backend bearer
handles; persist a device-bound session with 24-hour idle and 30-day absolute
expiry. Reauthentication issues a fresh handle. Check account/session/device
revocation in PostgreSQL for every authorized operation, without a positive cache.
Database unavailability refuses authorization. Native code owns OS-protected
credential storage and removes it at logout. Backend credentials survive restart
only within their recorded lifetime; a changed client device id never establishes
trust. These limits balance restart convenience against long-lived bearer theft.

**PROPOSED FOR USER REVIEW:** set provider access tokens to five minutes, ordinary
SSO sessions to 24-hour idle/30-day maximum, and disable offline access, implicit
and password grants. Require S256, exact HTTPS callback registration, RS256 and
an explicit issuer/client/audience allowlist; allow at most 30 seconds clock skew.
Keep Keycloak persistent user sessions enabled. Store required provider tokens
only encrypted server-side, under separately provisioned runtime key material.
Key rotation, encrypted-token recovery and production PostgreSQL restore need
acceptance before deployment; the H2 probe does not establish them.

**PROPOSED FOR USER REVIEW:** local logout revokes the current backend session
before trying provider refresh-token revocation and RP-initiated browser logout.
Device revocation atomically revokes every backend session of that device and
leaves other devices intact. Global logout revokes all account sessions; report
provider logout as pending/failed separately if unreachable. Validate signed OIDC
back-channel logout with issuer, audience, event, sid and replay checks to revoke
mapped backend sessions. Provider token revocation alone does not revoke a backend
handle; a locally checked JWT may remain valid until expiry. Backend revocation
does not certify provider logout or recall already disclosed data. Existing SQL
fixtures prove only proposed mechanics, not this service or device trust.

### Content lifecycle defaults — PROPOSED FOR USER REVIEW

Every row below is **PROPOSED FOR USER REVIEW**. No retention policy is approved.
Section 13's data-lifecycle OPEN remains open until the user reviews these values,
provider terms are resolved, and deletion/invalidation/restore tests pass.

| Data / owner | Recommended default and tradeoff |
| --- | --- |
| Conversations / conversations | **PROPOSED FOR USER REVIEW:** retain NYLRA messages and source bindings for 90 days after the topic's last user activity; explicit deletion can occur sooner. Automated cache refresh does not extend that deadline. Disclose expiry in clients. Finite retention reduces exposure/storage but loses older conversational continuity; an explicit future keep/export choice requires separate review. |
| Scoped project evidence / context | **PROPOSED FOR USER REVIEW:** retain only selected excerpts, version/digest, acquisition time, owner grant and exact instance/workspace/project/work/thread scope; expire content seven days after acquisition or at the source grant/content deadline, whichever comes first. Re-fetch only through a still-valid grant. No whole-history or automatic source-tree upload. This favors minimization over long offline explanation. |
| Derived summaries, embeddings and caches / deriving module | **PROPOSED FOR USER REVIEW:** retrieval caches expire within 24 hours; summaries/embeddings within 30 days, always capped by every source's earlier deadline. Track all contributing source ids/versions, grant revisions and deletion ids; derived access requires permission for every source. Mixed-project derivation remains constrained by all scopes; it never becomes account-wide. Invalidate at source change/revocation/deletion before further use and rebuild only from permitted sources. Recompute cost is preferable to stale or broadened access. |
| Personal memory / memory | **PROPOSED FOR USER REVIEW:** disabled until explicit opt-in; retain user-inspectable communication preferences until correction/deletion/account deletion, with an annual review reminder. Record origin and consent time. No automatic conversion of project facts, retrieved instructions, approvals or team content into personal memory. Opt-in gives less automatic personalization but preserves source authority. |
| Deletion / each owning module | **PROPOSED FOR USER REVIEW:** hide/refuse deleted content synchronously with a durable deletion marker; purge live content and all dependent derivatives within 24 hours, with idempotent progress and visible failure. Account deletion revokes sessions immediately and propagates to each owner plus the identity provider; its provider purge remains pending until acknowledged. Tombstones carry only opaque ids and deadlines for 35 days after deletion. This allows retry/restore protection without retaining content. |
| Backups / deployment operator | **PROPOSED FOR USER REVIEW:** encrypted daily backups with a maximum 30-day lifetime, including incremental chains/replicas and identity backups; initial recovery objectives are RPO 24 hours and RTO 24 hours, to be demonstrated before deployment. Deleted content can remain inaccessible in backups until expiry. Restore in quarantine and replay deletion/revocation markers before serving traffic. A failed purge/restore audit blocks release; do not claim instant physical deletion from immutable backups. |
| Minimal audit metadata / operation owner | **PROPOSED FOR USER REVIEW:** retain for 90 days: opaque event/account/device/object ids, operation type, timestamp, outcome/refusal category and policy revision. Exclude message text, reasoning, prompts, excerpts, email, IP, user-agent, tokens, keys and request/response bodies. Record deletion progress without source content. A shorter forensic window trades investigation depth for minimization; audit data has separate restricted access and expiry. |
| Revoked links / links and context | **PROPOSED FOR USER REVIEW:** immediately deny new reads, explanation context use and queued dispatch; recheck grants before acquisition, provider send and owner dispatch. Hide all affected scoped evidence/derived entries immediately and purge their live copies within 24 hours, including conversation entries carrying that source if safe removal cannot be proven. Preserve only untainted dialogue with scope/freshness status. Revocation does not delete the local owner's project. |
| Revoked devices / devices and clients | **PROPOSED FOR USER REVIEW:** deny backend sessions immediately; clear credentials and scoped client caches on the next reachable client sync. Device revocation alone does not delete the account's conversations or revoke unrelated project links. An offline/lost device's previously downloaded data cannot be guaranteed erased; do not promise a physical purge deadline for it. |
| Provider processing / provider adapter and operator | **PROPOSED FOR USER REVIEW:** send only the minimum permitted text; disable optional provider history/training where supported and prefer contractual zero retention. Do not persist reasoning as conversation content or diagnostics. Provider retention, deletion capability and subprocessors must be reviewed before real content; backend deletion cannot certify deletion by a provider. No MiniMax B0 test established those contractual controls. |

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
  B0 verifies the scoped HTTP/SQL/job fixtures, real MiniMax cases and cloud
  Keycloak server cases described in evidence. This OPEN remains until native
  and remaining reviewed integration gates are obtained; flat DTO consumers
  are not J1 acceptance and scoped provider evidence is not all-model support.
- **Identity and confirmation:** close before pairing or approval implementation
  by reviewing account/device trust, revocation, and a model-independent human
  confirmation flow implementing Shadows §24.6, including owner-side membership
  freshness and revocation. Neither local Origin checks nor a
  claimed `human` field establish remote human authority.
  B0's established OIDC libraries pass a synthetic loopback protocol fixture;
  Keycloak server protocol, logout/revocation and development-store restart now
  have cloud evidence. Windows system-browser/native return, the proposed
  confidential-backend flow, production persistence and product device trust
  remain unverified. Token revocation/logout alone cannot
  close backend device trust or Shadows owner-side authority.
- **Integration protocol and context production:** close before connector work
  by reviewing schemas, initial-context/reconnect semantics, permitted fields,
  context limits, source versions, and generation of the appropriate Planner
  work context. Existing local streams are not assumed a complete cloud feed.
- **Data lifecycle:** close before persisting real user/project content by setting
  retention periods, backup purge deadlines and testable deletion/invalidation
  propagation for section 5's sharing rules, including provider retention. The
  section 5 defaults are PROPOSED FOR USER REVIEW; only explicit user review plus
  behavioral deletion/restore evidence closes this OPEN.
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
