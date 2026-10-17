# Backend foundations

Created: 2026-10-10. Consolidated: 2026-10-18 from the earlier delivery spec and
its three finished plans (initial B0/B1 plan, local identity runtime, AYLUL
steps 0-1 cleanup). Those files were removed; their full text stays in Git
history before this commit. Measured results stay in [`docs/evidence/`](../../evidence/).
Status: record of decisions in force. Newer specs in this folder amend it.

Owners this file does not replace: [architecture](../../architecture.md) for
product authority, data lifecycle and deployment; [source structure](../../source-structure.md)
for file placement; [source contracts](../../contracts/README.md) for inspected
implementation.

## Direction

Build the cloud application that lets NYLRA (AYLUL desktop and the phone app)
hold durable conversations, see live agent sessions and answer approvals, and
later explain selected Shadows projects with versioned sources and request
owner-validated actions. Mobile, voice, teams and Production stay in the
product direction as later complete slices. Rust Shadows remains the owner of
personal/team project rules and operational action authority.

Companion amendment, 2026-10-13: AYLUL is an independent companion; its first
release is chat, live agent sessions and approvals on desktop and phone
([NYLRA delivery spec](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#independent-companion)).

## Selected stack (B0 experiments, closed)

| Concern | Selected | Notes |
| --- | --- | --- |
| HTTP and schemas | Fastify + one canonical TypeBox schema per operation | Validates requests, outgoing objects and each raw stream envelope; OpenAPI, TS and fixtures are generated from it |
| Store | PostgreSQL + Kysely/pg | Real transactions and conditional revision conflicts passed |
| Migrations | node-pg-migrate | Sole owner of application SQL history |
| Jobs | pg-boss | Owns its internal schema. Domain write and enqueue share one transaction; product modules never touch queue internals |
| Model transport | AI SDK 6.0.303 + @ai-sdk/openai 3.0.125 | Real MiniMax-M3 Chat Completions: stream, injected partial fault, cancel, tool-result use, think-tag reasoning continuity passed. Default to non-reasoning. An iterator may throw after text: keep partial output and persist one truthful terminal result |
| Identity | Keycloak 26.8.0 + openid-client 6.8.8 | oidc-provider is test tooling only, never product authentication |

Library acceptance is bounded by the recorded cases. MiniMax is a tested trial
provider, not the selected primary model.

## Identity and devices (B1, implemented)

- Confidential `shadows-backend` OIDC client, `client_secret_basic`, S256
  authorization code, one exact HTTPS backend callback. Clients hold no client
  secret and never receive provider tokens.
- Native login: login attempts expire after five minutes and are claimed once
  before code exchange. Return tickets are 256-bit random, stored hashed, valid
  60 seconds, consumed once. Return URI is `127.0.0.1` loopback with an
  ephemeral port and `/oidc-return`; no wildcard or arbitrary redirect.
- Clients use opaque bearer handles, not provider JWTs or cookies. Provider
  tokens are encrypted before persistence and never leave the adapter/service
  boundary. `VerifiedIdentity` and `Principal` are only produced after full
  verification; callers never build them from request fields.
- Refresh-token introspection on each authorized operation, no positive cache.
  Local revocation is authoritative immediately even if provider logout fails.
  Back-channel logout requires RS256, exact issuer/audience, sid, bounded iat,
  no nonce and one-time jti. A lost code exchange requires a fresh login.
- Enrollment is auth-v1 1.1.0: return redemption takes `new` or `reuse` with a
  credential; only new enrollment returns `enrollmentCredential`.
- Local runtime: Docker Compose with separate application and Keycloak
  PostgreSQL databases, explicit migrations, TLS ingress. Handoff details live
  in [the NYLRA local auth handoff](../../nylra-local-auth-handoff.md).

## Application boundaries

HTTP handlers and job workers call the same service operations. Framework and
provider objects stay at the boundaries. Our modules own topics, permitted
context, source provenance, confirmation records, delivery outcomes and
notification policy; libraries own HTTP, SQL, migrations, jobs, authentication
and model transport. No custom framework or general SDK; extract a library
only when a second real consumer needs it.

## nylra-v1 client contract

Decided 2026-10-13. One contract serves the Flutter app and AYLUL desktop. Its
source is TypeBox in `src/transports/http/`; OpenAPI, TypeScript and fixtures
are generated, and Flutter generates Dart from the OpenAPI file. A mock server
replays the fixtures, SSE included. Version 0.2 grouped the first release:

| Group | Operations |
| --- | --- |
| Sign-in | auth-v1, unchanged |
| Push | Register or remove the phone's FCM/APNs token |
| Links | Pair a laptop by code, list laptops with online state, unlink |
| Chat | Topics with an account cursor; send a turn; topic SSE ending in exactly one of `done`, `error`, `cancelled`; cancel |
| Sessions | Per laptop: agent, project, state, last step; step snapshot then SSE after a cursor |
| Approvals | Pending requests; `allow`/`deny` with a `commandId`; decider is `person` or `aylul_grant`; already decided or expired refuses with 409 |
| Grant revocation | Revoke by id; no create or widen operation |
| Account SSE | Approval requested/resolved, session changed, laptop online/offline |

An unknown or expired cursor answers `resnapshot_required`. The account comes
from the session, never a body field. Steps carry tool name, file path and a
one-line summary only. The laptop relay later advanced the generated contract
to 0.3.0 ([relay design](2026-10-17-laptop-relay-design.md)).

## Later gates still open

- Real content waits for the approved lifecycle's deletion, invalidation and
  restore tests ([architecture §5](../../architecture.md#content-lifecycle-defaults)).
- Assessment/confirmation depends on real Shadows §24.6 enforcement; an
  unavailable owner leaves delivery pending.
- Voice, notification policy, mobile continuation, teams and Production
  (Shadows §17.12) are later slices.
- Windows native identity acceptance and production identity operations (key
  rotation, restore, dedicated identity database, provider terms) are not yet
  verified.

No raw provider or session values belong in prompts, logs, evidence or Git.
