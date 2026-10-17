# Implemented backend code map

Updated: 2026-10-18. Identity/device, paired-laptop relay and BYOK credential sealing for synthetic acceptance.
Real identity data remains gated; no B2+, model adapter or production deployment exists.

| Source owner | Responsibility | Contract |
| --- | --- | --- |
| [Application](../../src/app) | Validated runtime settings, composition, owner expiry scheduling and shutdown | [contract](../../src/app/contract.yaml) |
| [Database primitives](../../src/platform/database) | Connection/transaction lifetime and migration history | [contract](../../src/platform/database/contract.yaml) |
| [Identity](../../src/modules/identity) | OIDC account binding, encrypted login/session state, native ticket and logout | [contract](../../src/modules/identity/contract.yaml) |
| [Devices](../../src/modules/devices) | Enrolled installation rows, hashed proof reuse and atomic device revoke via identity operations | [contract](../../src/modules/devices/contract.yaml) |
| [Provider settings](../../src/modules/provider-settings) | Account connections/defaults, encrypted credentials, public HTTPS destination validation and revision-scoped transactional dispatch resolution | [contract](../../src/modules/provider-settings/contract.yaml) |
| [HTTP](../../src/transports/http) | Canonical auth-v1 and nylra-v1 schemas and transport translation | [contract](../../src/transports/http/contract.yaml) |

[Ordered migrations](../../migrations) name their identity/device/activity/links/sessions/provider-settings owners. Generated
[OpenAPI](../../api/auth-v1.openapi.json) and [TypeScript](../../api/auth-v1.d.ts)
come from the HTTP schema. Tests use newly owned PG clusters and pinned Keycloak;
fixtures are not application modules. The [source structure](../source-structure.md)
retains the future full-product boundaries without scaffolding unused domains.

The [nylra-v1 contract](../../api/nylra-v1.openapi.json), its
[types](../../api/nylra-v1.d.ts) and [fixtures](../../api/nylra-v1.fixtures.json)
come from the same HTTP owner. Runtime serves only operations marked implemented
in the canonical registry; planned chat/approval/push operations remain mock-only.

[Compose](../../compose.yaml) and [local Docker adapters](../../docker) own only
development provisioning, ingress, runtime configuration and the synthetic stack
journeys. The shared synthetic login helper is used by the auth stack journey
and the generated-type relay journey. The generic API proxy forwards WebSocket
upgrades and unbuffered SSE; an owned pinned-Nginx fixture exercises that config.
These adapters do not introduce another identity implementation. The
[NYLRA handoff](../nylra-local-auth-handoff.md) describes their exact commands.

- [Laptop link](../../src/transports/laptop-link/contract.yaml): canonical frame v1 schemas, generated JSON Schema/TypeScript, authenticated bounded sockets and fenced durable acknowledgements.

- [Activity](../../src/modules/activity/contract.yaml): transaction-scoped durable account journal, expiry and replay floor; Links and Sessions publish through its public operations.

- [Links](../../src/modules/links/contract.yaml): hashed pairing codes, transactional limits, scoped laptops, fenced connection leases and commit checkpoints.

- [Sessions](../../src/modules/sessions/contract.yaml): receipt-backed ingress and server IDs, scoped snapshots/replay, tool-only summaries and source invalidation.

Laptop-link now binds the canonical upgrade in full application composition. Auth-only export uses the same auth registrar and excludes the upgrade.

NYLRA HTTP now binds only implemented code-registry rows. Its SSE adapter replays owner journals, verifies authority after snapshots and before delivery, and polls PostgreSQL so another process needs no local wakeup.
