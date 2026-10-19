# One backend entry point for the Hermes-backed assistant

- Status: accepted
- Asked by: controller, 2026-10-18
- Owner: backend; native desktop consumes generated HTTP/SSE artifacts
- Design: [assistant owner](../../backend/specs/2026-10-18-hermes-backed-assistant-design.md)

## Human-selected route

2026-10-18 execution approval: the human requested a usable normal conversation
from the existing desktop now, deferring MCP/Core integration. The controller
implements both sides; no separate lead approval is represented. First delivery
uses bounded authenticated snapshots with polling, not a public SSE contract.
Status/list/create/snapshot/send/stop/recover are the selected operations. Stop
and explicit recovery are idempotent operations on the addressed backend turn;
create/send carry UUID command IDs. Native authenticated HTTP is reused so no
bearer enters the renderer/sidecar. This amends the earlier credential-handoff sketch.

NYLRA uses our backend for account and assistant operations. Hermes runs behind
it. Local Docker reaches installed Windows Hermes; no duplicate installation.
This settles routing/placement, not acceptance of unimplemented payloads.

## Accepted snapshot interface

All operations use existing backend bearer authentication and fresh account/device
authorization. Prefix `/v1/nylra/assistant` is separate from the existing
provider `/topics` contract; do not silently change that contract's engine.

| Method and suffix | Intent |
|---|---|
| `GET /status` | Credential-free availability for the signed-in account |
| `GET /conversations` | List account-owned conversations |
| `POST /conversations` | Create one owned opaque binding with command replay |
| `GET /conversations/{id}` | Bounded latest backend projection |
| `POST /conversations/{id}/turns` | Command-ID-based turn admission |
| `POST /conversations/{id}/turns/{turnId}/stop` | Stop the account-owned run; report actual outcome |
| `POST /conversations/{id}/turns/{turnId}/recover` | Explicit recovery of the same unknown command within native retention |

TypeBox owns final fields, limits, errors and generated clients. Responses retain
accepted/running/terminal/unknown distinctions. A turn/session binding is not a
raw upstream selector. Never accept arbitrary URL, profile, key or RPC method.
No generic `/proxy/*` mount and no raw Hermes token in the webview.

## Implemented scope and remaining gates

Canonical TypeBox contract 0.5.0 and the seven implemented handlers are committed
at `02aca92`. Account isolation, replay/conflict, unknown recovery, fresh authority
after upstream await and exact-run stop have focused integration coverage.
Snapshot polling is the selected first transport. No public assistant events/SSE
route or cursor guarantee is implemented. Native cancellation acknowledgement is
distinct from final run cancellation and provider-side billing termination.

## Backend answer

The controller accepted and implemented this normal-chat contract under the
human's instruction while owning both changes. No independent lead approval is
represented. Backend TypeBox is authoritative; the desktop imports generated
types and maps only closed native operations. Server deployment, multi-user profile
isolation, code/context sharing and physical Tauri chat acceptance remain separate.
