# Shadows Backend

Cloud coordination and NYLRA application alongside the future Rust Shadows server.

**Status (2026-10-11):** B1 identity/device backend, stable installation enrollment
and actual local Docker/Keycloak acceptance are recorded in the
[local evidence](docs/evidence/2026-10-11-local-docker-nylra-readiness.md).
The [earlier Linux evidence](docs/evidence/2026-10-11-b1-linux-acceptance.md) remains historical.
No deployment, real-data retention approval or B2+ implementation is claimed.

[Joint native evidence](docs/evidence/2026-10-11-joint-native-auth.md) records the
NYLRA Rust consumer against local Docker and the remaining browser UI acceptance.

## Start here

| Document | Owns |
| --- | --- |
| [Architecture](docs/architecture.md) | Shared deployment, languages, responsibility boundaries, context exchange, approval delivery, and unresolved implementation prerequisites |
| [Delivery spec](docs/superpowers/specs/2026-10-10-backend-delivery-design.md) | Library experiments, joint protocol gate and backend acceptance |
| [Initial plan](docs/superpowers/plans/2026-10-10-backend-initial-plan.md) | Experiment-first tasks coordinated with NYLRA and Shadows |
| [B0 evidence](docs/evidence/2026-10-10-backend-capability-probes.md) | Executed probes, conditional component decisions and blocked acceptance |
| [Implemented code map](docs/codebase/README.md) | Actual source owners and contracts |
| [Source structure](docs/source-structure.md) | Prepared folder layout and dependency boundaries; not an implemented code map |
| [Contract convention](docs/contracts/README.md) | Applying the source template with inspected evidence |
| [NYLRA vision](../nylra/Vision.md) | The companion's product experience and full future capability inventory |
| [Source contract template](docs/contracts/TEMPLATE.yaml) | The structure for describing an implemented source module and its evidence |
| [Agent instructions](AGENTS.md) | How to keep design, code, contracts, and verification consistent |

The backend language is TypeScript on Node.js, with PostgreSQL storage.
This is the selected long-term direction, not a temporary step before a
rewrite in Rust or Go. Framework and library choices remain subject to the
specific prerequisites in the architecture document.

Shadows' local and future server runtime share Rust project rules in `shadows`.
This TypeScript application does not reimplement them or write their tables.
[Shadows §1.7](../shadows/docs/superpowers/specs/2026-09-21-architecture-design.md#17-workspace-authority-and-deployment)
owns workspace authority and synchronization. The
[sharing inventory](docs/architecture.md#what-lives-where) identifies local,
cloud-owned and explicitly shared data.

NYLRA desktop and mobile applications belong in `nylra`. They access this backend through
its public protocol; clients never access PostgreSQL directly.

These sibling links assume the repositories are checked out beside each
other as `shadows`, `shadows-backend`, and `nylra`.

## Local Docker development and NYLRA handoff

[Backend CI](.github/workflows/ci.yml) runs on pushes, pull requests and manual
dispatch using Node 24.19.0 on Ubuntu 24.04. It installs the root lockfile and
checks types, contracts, wire schemas, documentation and source secret boundaries,
then runs the full synthetic PostgreSQL/Keycloak suite. Fixtures generate their
own ephemeral credentials; no repository secrets, `.env`, MiniMax or deployment
credentials are consumed. B1.5 `test:lifecycle` remains deferred and is not a CI
acceptance claim. Windows/NYLRA and production acceptance remain separate.

Use the [local auth handoff](docs/nylra-local-auth-handoff.md) for the exact
Docker build/bootstrap/start/migrate/test commands, native sequences and
certificate trust step. Backend base is `https://127.0.0.1:8443`; issuer is
`https://127.0.0.1:8443/realms/shadows-local`. No host Node or PostgreSQL is needed.
All public URLs are reachable through the same ingress inside containers and on
Windows. Certificate trust for the current Windows user is a deliberate developer
action; it is never installed automatically or machine-wide.

[Compose](compose.yaml) pins Node 24.19.0, PostgreSQL 18.4, Nginx 1.30.0 and
Keycloak 26.8.0 images by digest; the image installs the reviewed root lockfile.
Application and identity databases have separate credentials and persistent
volumes. Migrate explicitly before starting backend. Stop with `docker compose
stop` or `docker compose down` without volume deletion. Tests use a separate Linux
test-runtime volume and owned disposable fixtures, not development data.

Auth-v1 **1.1.0** requires explicit new enrollment or proof of an existing
installation at return redemption. Sessions and enrollment credentials are
different secrets; logout preserves enrollment, device revocation invalidates it.
The [OpenAPI](api/auth-v1.openapi.json), [generated TS](api/auth-v1.d.ts) and
[synthetic fixtures](api/auth-v1.fixtures.json) are backend-owned. Keycloak
refresh-token introspection checks provider state for each protected operation;
inactive or unavailable provider state refuses authorization. This adds provider
availability/latency to authorization and does not assume disable emits logout.

`B1_DATA_MODE=synthetic` remains mandatory. No MiniMax calls or real identities,
project content, B2+ work or deployment are authorized. `test:lifecycle` still
exits 2 for unapproved B1.5 retention/deletion/restore. Local Docker/Linux evidence,
Windows browser acceptance and actual NYLRA acceptance remain separate gates.
