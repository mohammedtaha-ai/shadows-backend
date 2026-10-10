# Shadows Backend

Shared cloud backend for Shadows and NYLRA.

**Status:** Architecture agreements recorded on 2026-10-10. No application,
database, cloud deployment, or integration has been implemented here.

## Start here

| Document | Owns |
| --- | --- |
| [Architecture](docs/architecture.md) | Shared deployment, languages, responsibility boundaries, context exchange, approval delivery, and unresolved implementation prerequisites |
| [NYLRA vision](../nylra/Vision.md) | The companion's product experience and full future capability inventory |
| [Source contract template](docs/contracts/TEMPLATE.yaml) | The structure for describing an implemented source module and its evidence |
| [Agent instructions](AGENTS.md) | How to keep design, code, contracts, and verification consistent |

The backend language is TypeScript on Node.js, with PostgreSQL storage.
This is the selected long-term direction, not a temporary step before a
rewrite in Rust or Go. Framework and library choices remain subject to the
specific prerequisites in the architecture document.

Shadows' current local runtime remains in its own repository. NYLRA desktop
and mobile applications belong in `nylra`. They access this backend through
its public protocol; clients never access PostgreSQL directly.

These sibling links assume the repositories are checked out beside each
other as `shadows`, `shadows-backend`, and `nylra`.
