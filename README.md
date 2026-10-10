# Shadows Backend

Cloud coordination and NYLRA application alongside the future Rust Shadows server.

**Status:** Architecture agreements recorded on 2026-10-10. No application,
database, cloud deployment, or integration has been implemented here.

## Start here

| Document | Owns |
| --- | --- |
| [Architecture](docs/architecture.md) | Shared deployment, languages, responsibility boundaries, context exchange, approval delivery, and unresolved implementation prerequisites |
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
