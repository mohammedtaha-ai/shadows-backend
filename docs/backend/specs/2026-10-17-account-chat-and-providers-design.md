# Backend text chat and BYOK providers

Created: 2026-10-17. Revised: 2026-10-18.
Status: delivery scope/order agreed; technical proposals await written-design review.
Owner: Backend. Branch: codex/aylul-laptop-relay, original checkout, no worktrees.

## Outcome and agreed scope

An existing authenticated account saves provider connections, selects a model,
creates separate text conversations and receives persisted streaming replies.
The backend owns this slice. Desktop/mobile screens and hook integration follow
separately; no agent action or local-history access follows from a chat message.

| Human decision | Required behavior |
| --- | --- |
| Conversations | Separate saved topics with their own context |
| Provider selection | Account default, overridable per topic |
| Provider settings | Account-owned keys, connection addresses and models; several saved connections |
| Changing provider | Keep the topic context; disclose transfer to the newly selected provider |
| Account | Email, username and password; open signup without invitations; Google/GitHub linking later |
| Account scope | History and provider settings available to the account's trusted devices |
| First input | Text only; attachments and voice later |
| Memory | Per-topic history now; shared personal memory later |
| Execution | Backend generation first; local brain execution later |
| Delete | Permanent deletion after confirmation; no trash/recovery UI |
| Work | Verified task, explicit-path commit; backend checks in Docker |

The human accepted this delivery order on 2026-10-18, chat before lifecycle:

1. Close technical design. Deliver the existing-account chat path on synthetic
   data with one OpenAI-compatible API format, several saved connections,
   defaults, stream, stop and delete.
2. Implement the applicable existing lifecycle policy against the chat, provider
   and identity tables that now exist. Only then open the real-data gate for one
   bounded real-provider journey.
3. Add open registration and other API formats. Open signup remains a requirement.

Lifecycle follows chat because its deletion, invalidation and restore tests
need the owning tables. The synthetic gate stays closed throughout steps 1-2,
so the reorder admits no real key or message earlier.

One API format is not one hard-coded provider. MiniMax is a trial configuration,
not the primary model or an automatically chosen account default.

## Baseline, ownership and interfaces

The [implemented map](../../codebase/README.md) records Identity/Devices and the
synthetic relay at 7d99ab3. Chat operations in
src/transports/http/nylra-paths.ts are planned; their mock/generated fixtures
do not prove live chat. Provider settings and persisted model keys are new work.
src/app/config.ts currently permits synthetic data mode only.

| Backend owner | Named job |
| --- | --- |
| Identity / Keycloak | Existing account, trusted-device and session authority; later signup configuration |
| Provider settings, proposed | Account connections/defaults, encrypted credentials and authorized resolution |
| Conversations, proposed | Topics, messages, durable turn/dispatch lifecycle, replay, cancellation and deletion |
| Provider adapter | Supported API-format translation and bounded model requests |
| HTTP/SSE | Canonical code-owned schemas and service/event translation |

Use the intended aylul-brain owner for NYLRA instructions/generation without
project tools. Storage and provider selection belong to the host. Cloud-only use
does not require publishing a client package before there is a client consumer.

The human's backend-first choice settles execution for this phase while retaining
the longer-term laptop/cloud direction. See [Vision section 28](../../../../nylra/Vision.md#28-cloud-hosting-and-future-deployment-options),
the [later delivery decision](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#independent-companion)
and [source placement](../../source-structure.md#aylul-brain-package).
Personal memory is deferred by the newer human decision, superseding its earlier
“enabled from the start” ordering, not its ownership or future controls.

Public operations and shapes originate in TypeBox/code and generate consumer
artifacts. The plan must record the shared contract agreement before changing
the API. This document defines requirements, not handwritten endpoints/DTOs,
source contracts or a fictional implemented map. Each module owns its tables;
cross-module work uses declared public operations.

## Provider behavior

A connection has a name, supported API format, destination, credential and model
selection. Start with the OpenAI-compatible text adapter. Further formats need
their own adapter and acceptance. Manual model IDs are sufficient initially;
automatic model discovery is optional capability.

New topics pin the current account default. Later default changes affect new
topics only. Provider/model changes apply between turns, with a destination/context
notice before the next send. A turn pins an immutable connection revision.
Connection deletion blocks future uses; retained topics need another connection.

Credential writes never return stored keys. Reads expose connection metadata and
a configured-key indicator. Exclude keys from messages, URLs, events and logs.
Connection tests run only on explicit request; disclose a paid probe beforehand.
Return safe credential/model/quota/network error categories. A failed request
does not automatically switch provider/model or trigger another paid attempt.

Custom destinations require verified HTTPS. Validate resolved addresses at
connection time, pin the validated destination while retaining correct TLS
hostname verification, and refuse redirects. Reject embedded URL credentials,
internal/metadata/loopback destinations and DNS-rebinding bypasses. Local models
need their later execution design. Changing the destination requires a newly
submitted/reconfirmed key and invalidates old queued configuration revisions.

## Proposed encryption and rotation

These concrete choices are proposed for review, not claimed as implemented.

- Provision a dedicated 32-byte BYOK encryption key, separate from the existing
  OIDC-token key. The local operator keeps it in a restricted ignored runtime
  file mounted read-only as a Compose secret. Active/previous key IDs and file
  locations are configuration; key bytes stay out of Git, images and database.
- Encrypt with AES-256-GCM, a fresh random 12-byte nonce and a 16-byte tag.
  Authenticate account ID, connection ID, destination and credential revision
  as associated data. Store the sealed value and key ID; decrypt only for a
  freshly authorized operation. Ciphertext is not a public API field.
- Rotation loads the active key plus explicitly retained old IDs. New writes use
  the active key. A bounded resumable operation reencrypts rows using credential
  revision checks; replacement/deletion wins over late rotation. Report safe
  progress. Missing keys/tampered ciphertext refuse use, preserving stored state.
- Retire an old key after live migration and expiry of dependent backups, with
  restore verification. Operator recovery material stays separate from database
  backups. A compromise also requires replacing the provider's exposed key.
- Removing a connection/account blocks use synchronously and purges credentials
  under the lifecycle policy below.

Identity's inspected private TokenVault has single-key token ownership. Provider
settings must not import it privately; any shared crypto extraction needs a
named scope in the plan. Mechanism references:
[Node 24 crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptocreatecipherivalgorithm-key-iv-options),
[Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/).
These APIs do not replace host-file permissions or key-lifecycle design.

## Proposed turn lifecycle and restart recovery

Persist the user message, chosen configuration revision, submission fingerprint,
turn and dispatch intent atomically. Same account/operation/ID with identical
content recovers the original result; changed content conflicts. Revalidate
authority, configuration and deletion state immediately before provider dispatch.

A conversation-owned worker claims the intent using a fenced database lease.
Heartbeat every 5 seconds; expire after 30 seconds. Persist chunks/events before
streaming their sequence, coalescing for at most 200 ms or 4,000 UTF-8 bytes (within the current delta bound). Readers recover
the committed prefix; provider text lost before commit is not durable delivery.

After restart, an accepted unclaimed intent may run. An expired claimed intent
becomes interrupted/partial and is not automatically redispatched, even if the
provider outcome is unknown. Reject the old worker's late writes. Explicit retry
uses a new request identity and can incur another charge. Configure generation
SDK/HTTP retries to zero; exactly-once external billing is not promised.

SSE disconnect or closing the client window does not mean Stop. A persisted stop
aborts the owned provider call and finishes with the committed partial prefix.
Deletion first blocks reads/writes/dispatch, then aborts work. Origin-session
logout, origin-device revoke or connection/key deletion stops its active
generation. Reauthentication does not resurrect it. Device revoke preserves the
account history and other valid devices' access. Delivered bytes cannot be recalled.

Use only the selected topic's eligible history. No cross-topic memory, raw
agent transcript or local project upload. Refuse context overflow visibly before
dispatch; do not silently truncate or summarize it into permanent memory.

| Proposed first-slice boundary | Value |
| --- | --- |
| Saved connections | 20 per account, one supported API format |
| Message / assistant text | Existing canonical 2,000 / 16,000 character bounds |
| Model input | Complete eligible history + instructions/new message: 64 KiB UTF-8 serialized and 100 messages maximum |
| Model output | Request up to 4,096 tokens, additionally enforce assistant-text bound; cap-triggered output is partial |
| Active generations | One per topic, two per account; additional submissions refuse retryably |
| Provider deadlines | Connect 5 seconds; first/between-text inactivity 30 seconds; total 120 seconds |
| Automatic retries / fallback | Zero / zero |
| SSE | At most 100 persisted events/page; 15-second heartbeat/reauthorization; close at 1 MiB pending output |

Byte/message limits bound our request, not every model's token window. Return
typed provider context/parameter refusals for smaller model limits. Verify the
chosen trial configuration rather than inferring capability from its name.
Future larger-history handling requires a separate scoped design.

## Existing approved lifecycle, still requiring implementation

[Architecture content lifecycle defaults](../../architecture.md#content-lifecycle-defaults)
already records these human-approved 2026-10-13 policies. They are not new
retention questions. The earlier draft incorrectly described them as undecided.

| Action | Approved policy |
| --- | --- |
| Topic retention | 90 days after last user activity; explicit deletion sooner; automated work does not extend it |
| Delete | Synchronously hide/refuse with a durable marker; purge live content and derivatives within 24 hours |
| Deletion markers | Opaque IDs/deadlines only; 35 days |
| Backups | Encrypted daily backups; maximum 30 days including chains, replicas and identity backups; initial RPO/RTO 24 hours each |
| Restore | Quarantine; replay deletion/revocation evidence before traffic; failed audit blocks serving |
| Minimal audit | 90 days of opaque scope/operation/outcome metadata; exclude keys, text, bodies, email and reasoning |

Account deletion revokes sessions immediately and propagates to each owner and
the identity provider; external purge remains pending until acknowledged.
Provider-key copies follow backup/deletion rules and must not regain usability
after restoring an older snapshot.

Proposed restore prerequisite: durably record deletion/revocation receipts
outside the snapshot domain before acknowledging successful deletion. Retain
the journal's required high-water mark independently. Apply current receipts to
quarantined restores; missing/incomplete evidence blocks serving. A 35-day marker
window does not permit restoring a backup older than the 30-day maximum.

Implement and test applicable identity/account/content/credential deletion,
invalidation and quarantine restore before enabling real key/message storage.
The existing synthetic gate is not removed merely to demonstrate chat. The
deferred lifecycle command becomes green only with the named owners' evidence.
Production backup automation and measured RPO/RTO require deployment evidence;
local Docker tests do not establish them. Backend deletion cannot certify
external-provider erasure or instantly erase every immutable backup.

## Delivery and acceptance

1. Approve the technical proposals and generated-contract agreement. Build the
   existing-account path on synthetic data: encrypted connections/defaults,
   durable topics/turns, one adapter, streaming/stop/delete, tested against a
   fake provider.
2. Implement lifecycle prerequisites and owner checks on those tables. After
   lifecycle checks pass, open the real-data gate and run the bounded
   real-provider journey separately from fixture tests. The restore-receipt
   proposal above is decided at this step.
3. Add open registration through existing Keycloak, email/recovery acceptance
   and additional API formats. No invitations or second password database.

Exact files, owner operations, migrations, generation steps and RED/GREEN tests
belong in the implementation plan. Commit each completed verified task. Backend
checks run in Docker; client integration follows in its own repository.

Acceptance covers cross-account refusal, masked-key reads, tamper/rotation/
replacement/deletion, destination validation, configuration switching,
submission retry, stream replay, crash fencing, partial stop, concurrent-turn
limits and deletion during generation/after restore. Include existing auth,
relay and generated-artifact regressions. Runtime keys stay out of model context,
logs and Git; this documentation task reads no secrets and calls no provider.

Two operational choices close at their actual use point: production key/backup
provisioning before deployment, and the exact trial endpoint/model plus explicit
bounded test cost before real-provider acceptance. Neither lets real storage
start before core deletion passes.

## Self-review and handoff

Scope/order match the human's latest agreement. One format preserves multiple
connections; existing accounts keep registration out of the first chat path.
Numeric limits, rotation and recovery are reviewable proposals. Existing data
policy is cited from its owner. Personal-memory ordering follows the newer human
instruction, amended in the architecture's lifecycle table. Desktop UI and hook
relay are separate follow-on work.

After written-design review, write the backend implementation plan. This
document alone authorizes no product code, real-data gate change or deployment.
