# Implemented backend code map

Date: 2026-10-11. B1 identity/device implementation for synthetic Linux acceptance.
Real identity data remains gated; no B2+, model adapter or production deployment exists.

| Source owner | Responsibility | Contract |
| --- | --- | --- |
| [Application](../../src/app) | Validated runtime settings, composition and shutdown | [contract](../../src/app/contract.yaml) |
| [Database primitives](../../src/platform/database) | Connection/transaction lifetime and migration history | [contract](../../src/platform/database/contract.yaml) |
| [Identity](../../src/modules/identity) | OIDC account binding, encrypted login/session state, native ticket and logout | [contract](../../src/modules/identity/contract.yaml) |
| [Devices](../../src/modules/devices) | Enrolled installation rows, hashed proof reuse and atomic device revoke via identity operations | [contract](../../src/modules/devices/contract.yaml) |
| [HTTP](../../src/transports/http) | Canonical auth-v1 and nylra-v1 schemas and transport translation | [contract](../../src/transports/http/contract.yaml) |

[Ordered migrations](../../migrations) name identity/device owners. Generated
[OpenAPI](../../api/auth-v1.openapi.json) and [TypeScript](../../api/auth-v1.d.ts)
come from the HTTP schema. Tests use newly owned PG clusters and pinned Keycloak;
fixtures are not application modules. The [source structure](../source-structure.md)
retains the future full-product boundaries without scaffolding unused domains.

The [nylra-v1 contract](../../api/nylra-v1.openapi.json), its
[types](../../api/nylra-v1.d.ts) and [fixtures](../../api/nylra-v1.fixtures.json)
come from the same HTTP owner; no route serves them yet.

[Compose](../../compose.yaml) and [local Docker adapters](../../docker) own only
development provisioning, ingress, runtime configuration and the synthetic stack
journey. They do not introduce another identity implementation. The
[NYLRA handoff](../nylra-local-auth-handoff.md) describes their exact commands.

- [Laptop link](../../src/transports/laptop-link/contract.yaml): canonical frame v1 schemas; generated JSON Schema and TypeScript, no runtime relay yet.
