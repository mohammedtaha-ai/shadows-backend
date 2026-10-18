# Implemented backend code map

Updated: 2026-10-18. Identity/device, paired-laptop relay and BYOK credential sealing for synthetic acceptance.
Real identity data remains gated; no B2+ or production deployment exists.

| Source owner | Responsibility | Contract |
| --- | --- | --- |
| [Application](../../src/app) | Validated runtime settings, composition, owner expiry scheduling and shutdown | [contract](../../src/app/contract.yaml) |
| [Database primitives](../../src/platform/database) | Connection/transaction lifetime and migration history | [contract](../../src/platform/database/contract.yaml) |
| [Identity](../../src/modules/identity) | OIDC account binding, encrypted login/session state, native ticket and logout | [contract](../../src/modules/identity/contract.yaml) |
| [Devices](../../src/modules/devices) | Enrolled installation rows, hashed proof reuse and atomic device revoke via identity operations | [contract](../../src/modules/devices/contract.yaml) |
| [Provider settings](../../src/modules/provider-settings) | Account connections/defaults, encrypted credentials, public HTTPS destination validation and revision-scoped transactional dispatch resolution | [contract](../../src/modules/provider-settings/contract.yaml) |
| [Conversations](../../src/modules/conversations) | Account text topics, pinned connections, atomic turn admission and command replay, bounded input, fenced dispatch and committed replies, stop/restart recovery, journal and confirmed deletion through Activity; HTTP/SSE bindings are live, project context remains deferred | [contract](../../src/modules/conversations/contract.yaml) |
| [Provider adapters](../../src/integrations/providers) | OpenAI-compatible SDK model, pinned verified HTTPS, bounded deadlines, no retries or redirects and safe error categories | [contract](../../src/integrations/providers/contract.yaml) |
| [Hermes native client](../../src/integrations/hermes) | Operator-targeted native session/run HTTP translation with bounded reads and uncertain-write outcomes | [contract](../../src/integrations/hermes/contract.yaml) |
| [Assistant](../../src/modules/assistant) | Account-owned conversation bindings, durable message intents and bounded polling projections | [contract](../../src/modules/assistant/contract.yaml) |
| [AYLUL brain](../../packages/aylul-brain) | Private workspace with companion instructions, ordered text reply streaming, bounded output tokens, cancellation and terminal outcomes on a host-supplied model | [contract](../../packages/aylul-brain/contract.yaml) |
| [HTTP](../../src/transports/http) | Canonical auth-v1 and nylra-v1 schemas and transport translation | [contract](../../src/transports/http/contract.yaml) |

[Ordered migrations](../../migrations) name their identity/device/activity/links/sessions/provider-settings/conversations owners. Generated
[OpenAPI](../../api/auth-v1.openapi.json) and [TypeScript](../../api/auth-v1.d.ts)
come from the HTTP schema. Tests use newly owned PG clusters and pinned Keycloak;
fixtures are not application modules. The [source structure](../source-structure.md)
retains the future full-product boundaries without scaffolding unused domains.

The [nylra-v1 contract](../../api/nylra-v1.openapi.json), its
[types](../../api/nylra-v1.d.ts) and [fixtures](../../api/nylra-v1.fixtures.json)
come from the same HTTP owner. Runtime serves only operations marked implemented
in the canonical registry; planned approval/grant/push operations remain mock-only.

[Compose](../../compose.yaml) and [local Docker adapters](../../docker) own only
development provisioning, ingress, runtime configuration and the synthetic stack
journeys. The shared synthetic login helper is used by the auth stack journey
and the generated-type relay journey. The generic API proxy forwards WebSocket
upgrades and unbuffered SSE; an owned pinned-Nginx fixture exercises that config.
These adapters do not introduce another identity implementation. The
[NYLRA handoff](../nylra-local-auth-handoff.md) describes their exact commands.

The [account chat evidence](../evidence/2026-10-18-account-chat-acceptance.md)
records the actual HTTP/SSE journey through owned HTTPS provider fixtures and a
fresh backend process. [The shared journey driver](../../docker/chat-journey.ts)
also provides the separate human-run provider path; that manual run is not
implied by automated synthetic acceptance.

The [Hermes handoff](../hermes-host-handoff.md) owns the optional host readiness
probe: `docker/hermes-connection.ts` validates an operator target and bounded
native health/capability reads; `scripts/probe-hermes.ts` resolves an explicit
runtime key-file reference and returns only a stable state; `compose.hermes-host.yaml`
adds the Windows host target to the tools service. It is not wired into product
dispatch and implements no public assistant endpoint. Target validation now lives
in the Hermes integration owner and is re-exported by the readiness tool. Focused coverage is
`tests/integration/hermes-connection.test.ts`; the default API was unavailable,
then an ephemeral API-only instance from the installation passed Docker readiness.

`docker/hermes-host-acceptance.py` and `docker/hermes-journey.ts` own the explicit
installed-runtime acceptance path. They use a separate test home, native MiniMax
credential resolution inside Hermes, tool/context-free agents, a deliberate lost
admission ACK and a receipt file shared by separate Docker invocations. That file
is test evidence, not the future account service's persistence. The opt-in path is
not run by `npm test`; see [journey evidence](../evidence/2026-10-18-hermes-session-journey.md).

- [Laptop link](../../src/transports/laptop-link/contract.yaml): canonical frame v1 schemas, generated JSON Schema/TypeScript, authenticated bounded sockets and fenced durable acknowledgements.

- [Activity](../../src/modules/activity/contract.yaml): transaction-scoped durable account journal, expiry and replay floor; Links and Sessions publish through its public operations.

- [Links](../../src/modules/links/contract.yaml): hashed pairing codes, transactional limits, scoped laptops, fenced connection leases and commit checkpoints.

- [Sessions](../../src/modules/sessions/contract.yaml): receipt-backed ingress and server IDs, scoped snapshots/replay, tool-only summaries and source invalidation.

Laptop-link now binds the canonical upgrade in full application composition. Auth-only export uses the same auth registrar and excludes the upgrade.

NYLRA HTTP now binds only implemented code-registry rows. Its SSE adapter replays owner journals, verifies authority after snapshots and before delivery, and polls PostgreSQL so another process needs no local wakeup.
