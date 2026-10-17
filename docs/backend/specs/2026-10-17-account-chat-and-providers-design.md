# Backend account chat and provider settings - design for review

Date: 2026-10-17.
Status: awaiting human review of this written design; no implementation plan yet.
Owner: Backend. Working branch: `codex/aylul-laptop-relay`, original checkout,
no worktrees. Desktop/mobile implementation is outside this preparation task.

## Intended outcome

The person opens NYLRA, signs in, configures their own provider key and model,
then speaks to NYLRA through text and receives a real provider response. They
can create separate conversations and return to their saved history.

This is a backend slice: account-owned provider configuration, saved text topics,
generation and stream/lifecycle operations exposed through generated contracts.
The human explicitly clarified that backend preparation owns these decisions.
Connecting Claude Code/Codex hooks to the cloud and building client screens are
not prerequisites. Conversation does not authorize agent actions or read their
local history. Client experience requirements inform this backend design but
are not client implementation tasks or an alternate architecture owner.

## Decisions already made with the human

| Topic | Agreed behavior |
| --- | --- |
| First experience | Real text conversation through the person's API key. |
| History | Separate saved conversations, each retaining its own context. |
| Provider selection | Account default, overridable for each conversation. |
| Provider settings | A NYLRA settings section for provider keys, model selection and connection addresses; add supported provider integrations as the product expands. |
| Account | Email, username and password; open registration without invitations. Google/GitHub login comes later, linked to the same account. |
| Account scope | Conversations, provider configuration and keys belong to the account, usable across trusted signed-in devices. |
| Memory | Per-conversation context now; shared personal memory later. |
| Provider change | Continue the existing conversation, explaining that its prior context will be sent to the newly selected provider. |
| First input | Text only; images, files and voice are later. |
| Execution | Backend-hosted conversation for this phase; local brain execution later. |
| Delete | Permanent conversation deletion after explicit confirmation; no trash/recovery UI. |
| Work discipline | A separate commit after each completed, verified task. |

The following lifecycle/error/implementation rules are design proposals for
review, not claims that they were each separately selected or already built.

## Inspected starting point and document precedence

The backend [code map](../../codebase/README.md) records Identity/Devices and
the synthetic laptop relay at `7d99ab3`, the inspected implementation baseline.
Canonical chat operations in `src/transports/http/nylra-paths.ts` are still
`planned`; their exported fixtures/mock do not establish a live conversation
service. Provider settings and account-owned model credentials are not existing
product modules. Current runtime configuration still requires synthetic mode.

The approved backend-first choice settles the differing execution descriptions
for this slice: [Vision section 28](../../../../nylra/Vision.md#28-cloud-hosting-and-future-deployment-options)
describes cloud-hosted conversation; the later
[independent-assistant delivery decision](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#independent-companion)
also describes a laptop/cloud brain. Preserve that longer-term direction;
this phase runs the conversational brain only in the backend.

The previous [client relay planning brief](../../../../nylra/docs/native/specs/2026-10-17-laptop-relay-planning-brief.md)
remains context for the integrated hook work. Its cloud-session consumer and
future conversation screens are separate client work, not this backend plan.

## Backend behavior required by the user journey

1. Reuse the existing identity-provider/account/device boundary. Configure and
   verify open registration through that owner; do not add a password database
   to the conversation module. Consumer login remains through existing auth.
2. Own named provider connections, supported API formats, connection addresses,
   credentials and model identifiers per account, plus an account default.
3. Accept credential submissions without returning stored keys. Subsequent reads
   expose a configured-key indicator and connection metadata. No key in URLs,
   diagnostics, events or conversation records. Client transient-form handling
   is a later consumer obligation, not a backend credential retrieval feature.
4. Test a connection only on explicit request. Return whether it succeeded, failed credentials,
   lacked model access, hit a quota/rate limit or could not reach the endpoint.
   If the test generates a paid response, disclose this before running it; no
   hidden call merely from reading settings or changing a selection.
5. Create a conversation with a simple editable title. Pin the current default
   provider/model into it. Changing the account default affects new conversations;
   existing conversations keep their selection until deliberately changed.
6. Accept text with stable submission identity; report acceptance and generation
   as separate observed states. Stream the reply and support cancellation. Retain an explicitly partial reply
   when cancellation or failure interrupts it. Never render a partial as complete.
7. Continue from saved history. Switching provider/model is allowed between
   turns. Explain the destination provider/context transfer before its first
   request; never move a running request mid-generation.
8. The consumer requires an explicit confirmation before requesting deletion. Confirmed
   deletion removes it from ordinary reads and prevents further generation/replay;
   expose failure or pending work honestly rather than inventing success.

The agreed client layout remains an input for a later NYLRA-side design. This
document prescribes no sidebar, component, Tauri command or client storage.
No automatic AI title-generation call is necessary in this backend slice.

## Responsibility boundaries

| Owner | Responsibility |
| --- | --- |
| Backend Identity / identity provider | Registration/login/account binding and trusted-session/device checks. Reuse the existing identity boundary; no second auth implementation. |
| Backend provider-settings owner (proposed) | Account-scoped connections, encrypted keys, defaults and supported model configuration; authorized use and redacted projection. |
| Backend conversation owner (proposed) | Topics, messages, turn states, chosen connection/model, bounded context and durable replay/cancellation/deletion. |
| Backend HTTP/SSE transport | Validate canonical code-owned operations and map service results/events; no domain or model authority. |
| Provider integration | Map an explicitly supported API format to the existing AI SDK direction; pass runtime configuration into the brain. |

Use the intended `aylul-brain` owner from the backend source organization for
NYLRA instructions/generation, with no project tools in this slice. Do not invent
a different local brain or duplicate an agent harness. Cloud execution alone
does not require publishing a client package before a real consumer needs it.

The exact backend module boundaries and public-operation changes require the
accepted backend design and shared API request before source changes. Clients
consume generated artifacts and cannot widen the API through private imports.
This design does not create endpoints, module contracts or a fictional source map.

## Provider and model policy

Prefer ready-made provider presets plus a custom connection for supported API
formats. A custom URL alone does not make an unknown protocol compatible.
Start with the reviewed OpenAI-compatible text path; add a provider-specific
adapter only when that format is included and tested. MiniMax can prove the first
real test path but is neither the mandated primary model nor an account default
without the person's choice. A manually entered supported model ID is sufficient;
automatic discovery is optional provider capability, not a universal requirement.

Keys are encrypted in backend persistence, bound to account and connection, and
resolved only for an authorized operation. Specify encryption-key provisioning,
rotation and deletion in the backend design. Do not reuse bearer credentials as
model keys, expose ciphertext as a substitute secret, or log request headers.
Changing a connection destination requires replacing/reconfirming its credential
so an existing key is not silently sent to a different host.

Custom cloud endpoints must use verified HTTPS and pass server-side destination
validation. Reject embedded credentials and internal/metadata/loopback addresses;
validate resolved destinations and redirects rather than only the input string.
Local providers need their later local-execution design, not a cloud SSRF bypass.

No automatic fallback to a different provider or model after a failure. Show the
reason and allow an explicit retry/change, preserving the original partial turn.
Deleting a provider connection stops future use and removes its usable secret;
conversations retain history and show that another connection must be selected.

## Turn lifecycle, context and failure behavior

Each turn pins its account, topic, connection and model. Backend authorization
checks scope for commands, snapshots and stream delivery. At most one active turn
per conversation in this first slice; another device cannot create parallel
contradictory replies. Different conversations remain independently scoped.

Persist acceptance and stable retry identity before generation. Repeating a
submission after a lost response must recover that accepted turn rather than
create another provider call. After an ambiguous provider-side failure/restart,
record an interrupted/unknown outcome; do not promise exactly-once provider
billing or silently retry generation.

Reconnect obtains a canonical snapshot plus subsequent persisted events, without
duplicating text or mixing accounts/conversations. Closing the main window or
losing the UI stream does not itself mean Stop; an accepted bounded turn may
finish in the backend. Stop/delete/logout/revocation are distinct operations:
cancel or detach protected work according to the accepted owner policy and
prevent subsequent unauthorized delivery. Already delivered bytes cannot be
recalled from a person or model provider.

Only the selected conversation's eligible messages supply context; no hidden
cross-conversation personal memory, agent transcript or local project upload.
Retain complete history in storage while bounding the model request. Context
overflow must be visible and offer a new conversation; no silent cross-topic
retrieval or model-generated permanent memory. Per-format context limits and
message/event/time budgets are pinned in the backend implementation design and
canonical code, not guessed from a model name in the UI.

## Registration and real-data prerequisites

Use existing Keycloak/OIDC-backed account ownership and auth-v1. Open signup
requires explicit realm configuration and acceptance for email/username/password,
duplicate-account handling and recovery. Email delivery/verification must work
before being presented as available. Google/GitHub linking is later and must not
merge accounts solely because an unverified provider claims the same email.

Existing runtime and tests allow synthetic content only. Real conversation text
and real stored BYOK credentials require an accepted backend lifecycle design
and verification before enabling this path; do not remove the synthetic gate
as a shortcut. Permanent deletion covers active turns, content, replay/event
payloads and derived caches. Deleted data must not reappear after restore.

Backup retention/purge bounds and quarantine-restore behavior require a concrete
backend-owner policy, plus tests for deletion/invalidation. "Permanent" is a user
operation with no recovery UI, not an unverified claim of instantaneous erasure
from every backup or external provider. Show actual data-recipient and retention
limits; transport/storage encryption is not end-to-end secrecy from the backend
or selected model provider.

## Delivery slices and evidence

Proposed implementation ordering, not approved tasks:

1. Close the backend design's owner/lifecycle decisions and generated-contract agreement.
2. Implement and verify open registration through the existing identity owner.
3. Implement account provider settings and secret/destination handling.
4. Implement durable text topics/turns, streaming/cancel/delete and the brain adapter.
5. Verify the backend HTTP/SSE/provider journey in Docker with an artifact-only
   reference consumer; record real-provider evidence separately from fixtures.

Desktop/mobile screens, native/sidecar credential handoff and actual Windows
consumer acceptance follow in separately owned NYLRA work after the backend
contract is implemented. They are not tasks in this backend implementation plan.

Each eventual task names exact files, meaningful RED/GREEN tests and a commit
after it is complete and verified. Backend checks use Docker. Source contracts/code-map rows appear with
inspected source; public API shapes/endpoints originate in backend TypeBox/code
and are generated for consumers, never handwritten in this document or copied
from a sibling source import.

Acceptance must include cross-account refusal, masked-key reads, destination
validation, per-conversation provider context switching, no automatic fallback,
lost-submission recovery, stream reconnect, partial cancellation, concurrent
turn refusal and deletion during generation/after restore. The backend verifies
account scope without claiming native credential/companion acceptance. A real paid
provider request is an explicit acceptance step with safe runtime key resolution;
never print or retrieve an ignored `.env` key into chat context.

This planning task creates no product code, runs no provider request and claims
no live registration/conversation or real-data readiness.

## Decisions to close before implementation

- Backend design: encryption/key operations, exact request/stream/context budgets,
  worker recovery and active-turn surrender rules. Closes when its written owner
  spec and shared request are accepted before source work.
- Data lifecycle: active deletion, backup purge and restore-invalidation policy.
  Closes through accepted owner policy and tests before real content/key storage.
- Generated consumer contract: canonical operations, refusal states, stream
  recovery and write-only key submission. Closes through the backend-owned
  shared API request and code-generated artifacts before consumer migration.
- First adapter acceptance: supported API format/model pair and explicit test
  cost; MiniMax remains a trial. Closes before the real-provider journey.

## Inline self-review

The scope is backend-only and matches the recorded human decisions. Proposed implementation/error
policies remain explicitly labeled for review. Backend-first execution takes
precedence for this phase without deleting the future local direction. Existing
mock contracts and historical tests are not described as implemented chat.
Account keys, cloud deletion and registration prerequisites have explicit owners
and closing triggers. No manually defined endpoint, placeholder source contract
or implementation task is introduced by this design.
