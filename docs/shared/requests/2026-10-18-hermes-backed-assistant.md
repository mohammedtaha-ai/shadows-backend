# One backend entry point for the Hermes-backed assistant

- Status: asked
- Asked by: controller, 2026-10-18
- Owner: backend; native desktop consumes generated HTTP/SSE artifacts
- Design: [assistant owner](../../backend/specs/2026-10-18-hermes-backed-assistant-design.md)

## Human-selected route

NYLRA uses our backend for account and assistant operations. Hermes runs behind
it. Local Docker reaches installed Windows Hermes; no duplicate installation.
This settles routing/placement, not acceptance of unimplemented payloads.

## Proposed interface

All operations use existing backend bearer authentication and fresh account/device
authorization. Proposed prefix `/v1/nylra/assistant` is separate from the existing
provider `/topics` contract; do not silently change that contract's engine.

| Method and suffix | Intent |
|---|---|
| `GET /status` | Credential-free availability for the signed-in account |
| `POST /conversations` | Create one owned opaque binding with command replay |
| `GET /conversations/{id}` | Bounded backend projection and cursor |
| `POST /conversations/{id}/turns` | Command-ID-based turn admission |
| `GET /conversations/{id}/events` | Backend-positioned SSE, gap requires resnapshot |
| `POST /conversations/{id}/turns/{turnId}/stop` | Stop the account-owned run; report actual outcome |

TypeBox owns final fields, limits, errors and generated clients. Responses retain
accepted/running/terminal/unknown distinctions. A turn/session binding is not a
raw upstream selector. Never accept arbitrary URL, profile, key or RPC method.
No generic `/proxy/*` mount and no raw Hermes token in the webview.

## Open contract details and closing trigger

Final payloads/cursor storage/retention and cancel acknowledgement must be reviewed
after B-H1 captures actual installed API semantics. The current proposal does not
authorize schema rows to claim `implemented` or invent an owner's acceptance.
Close with account isolation, replay/conflict, unknown recovery, revocation during
await, SSE gaps, exact-run stop and secret-free projection tests. Existing login,
provider chat and relay acceptance must continue passing in their recorded scope.

## Backend answer

Routing preparation recorded. Detailed contract acceptance remains pending;
no other lead has been messaged or represented as having approved these shapes.
