# Implemented backend code map

Date: 2026-10-11. B1 identity/device implementation for synthetic Linux acceptance.
Real identity data remains gated; no B2+, model adapter or production deployment exists.

| Source owner | Responsibility | Contract |
| --- | --- | --- |
| [Application](../../src/app) | Validated runtime settings, composition and shutdown | [contract](../../src/app/contract.yaml) |
| [Database primitives](../../src/platform/database) | Connection/transaction lifetime and migration history | [contract](../../src/platform/database/contract.yaml) |
| [Identity](../../src/modules/identity) | OIDC account binding, encrypted login/session state, native ticket and logout | [contract](../../src/modules/identity/contract.yaml) |
| [Devices](../../src/modules/devices) | Trusted device rows and atomic device revoke via identity operations | [contract](../../src/modules/devices/contract.yaml) |
| [HTTP](../../src/transports/http) | Canonical auth-v1 schema and transport translation | [contract](../../src/transports/http/contract.yaml) |

[Ordered migrations](../../migrations) name identity/device owners. Generated
[OpenAPI](../../api/auth-v1.openapi.json) and [TypeScript](../../api/auth-v1.d.ts)
come from the HTTP schema. Tests use newly owned PG clusters and pinned Keycloak;
fixtures are not application modules. The [source structure](../source-structure.md)
retains the future full-product boundaries without scaffolding unused domains.
