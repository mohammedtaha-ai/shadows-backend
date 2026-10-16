# Laptop relay and summarized-session ingress

- Status: accepted
- Asked by: NYLRA Native / coordinating session, 2026-10-17
- Screen: docs/backend/specs/2026-10-17-laptop-relay-design.md

## Need

Connect the existing laptop sidecar to the backend and replace mock laptop/session
reads with account-scoped projections and replayable streams. This request covers
discovery and interface review; no proposed endpoint/frame below exists yet.
Canonical operations live in TypeBox source. Runtime registration, OpenAPI, frame
schemas and clients derive from that source; this request is not a second manual
API definition. MiniMax is only the research provider, with no primary-model
selection in the relay or shared brain.

## Fields

| Call / channel | Sends | Gets back |
| --- | --- | --- |
| New authenticated pairing-code issuance, route to be accepted | Current native device principal and explicit issuance action | Short-lived one-time code and expiry; issuance/reissue semantics need agreement |
| Existing laptop-claim operation in `nylraOperations` | Its canonical phone request | Its canonical linked-laptop projection or existing refusal |
| New outbound sidecar WebSocket, protocol to be accepted | Runtime native authentication, version handshake, generation and bounded projection batches with stable replay identities | Ready/fencing state and acknowledgement only after commit |
| Existing laptop/session/account HTTP/SSE operations | Current account principal and canonical cursor | Scoped snapshot/event DTOs from nylra-v1, or existing 401/404/410/503 outcomes |

## Errors

| When | The screen / native consumer shows |
| --- | --- |
| Invalid or revoked principal/link | Stop protected delivery, expose disconnected/refused state and reauthenticate or re-pair deliberately |
| Expired/unknown replay position | Resnapshot through canonical 410 handling; do not invent a successful cursor |
| Same replay identity, different content | Refuse conflict; no second effect or silent overwrite |
| Lost link or restart | Pending reconnect and bounded retained work; no claim that an acknowledgement proves future agent execution |

## Backend answer

The proposed scope and current transport evidence are recorded in the linked
draft spec and `docs/evidence/2026-10-17-laptop-relay-research.md`. Concrete pairing,
frame, lifecycle and projection interfaces require the named Native agreement
before this request can become answered/accepted. No backend product route is
created by this document.

Planning proposal, 2026-10-17: the specification's "Proposed planning decisions"
section now pins the pairing policy, frame/resource bounds, producer/epoch/ack
semantics, safe projection and activity-journal ownership. The accompanying
implementation plan names canonical source files and generators. This request
was accepted by the human coordinating supervisor for backend execution; requesting a plan
does not itself merge the Native branch or claim device acceptance.

## Reply

Pending Native review against local `spec/aylul-hook-laptop` at `0d086b6`, including
the existing SQLite identities, step-target command risk, credential handoff and
the bounded persistent outgoing queue needed for replay. No second hook/store is
authorized by this request.

## Ruling

2026-10-17: the human coordinating supervisor instructed completion and execution
of the written plan, approving its concrete backend protocol and ownership
proposals. This accepts the generated contract for backend implementation using
synthetic fixtures. It does not claim Native integration, a merged Native branch,
real phone acceptance, real-data lifecycle approval or deployment.
