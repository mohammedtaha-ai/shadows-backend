# Shadows Backend

Cloud coordination and NYLRA application alongside the future Rust Shadows server.

**Status (2026-10-11):** B1 identity/device backend implementation and synthetic
Linux acceptance are recorded in the [B1 evidence](docs/evidence/2026-10-11-b1-linux-acceptance.md).
No deployment, real-data retention approval or B2+ implementation is claimed.

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

## Linux development and acceptance

Use Node 24.19.0 / npm 11.9.0 and the root lockfile. Run `npm ci`,
`npm run typecheck`, `npm test`, `npm run schema:check`,
`npm run check:contracts`, `npm run check:docs` and `npm run check:secrets`.
The root suite runs synthetic B1 acceptance only; it never calls MiniMax or the
historical B0 suite. Test PostgreSQL clusters are uniquely owned/non-root and
loopback-only. Keycloak requires the managed local Docker socket and the pinned
26.8.0 image digest recorded in the evidence. Tests generate and trust their own
one-day loopback TLS certificates; TLS verification stays enabled.

Runtime configuration requires `B1_DATA_MODE=synthetic`, `DATABASE_URL`,
`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_CALLBACK_URL`,
`OIDC_LOGOUT_CALLBACK_URL`, `TOKEN_ENCRYPTION_KEY` (32-byte canonical base64),
`TOKEN_ENCRYPTION_KEY_ID` and `PORT`. Do not place secrets in the repository.
`npm run db:migrate` invokes the sole SQL history runner; `npm start` launches the
loopback application. These commands require an explicitly provisioned runtime;
acceptance tests construct their own resources instead. This is development
execution, not an approved production build/deployment procedure.

`npm run test:lifecycle` deliberately exits 2 with the B1.5 retention gate.
Identity deletion/purge, tombstone/backup restore, real identities and content
remain disabled pending reviewed retention policy and their later acceptance.
Windows browser/return/secure-storage belongs to NYLRA and later joint integration;
it does not block the Linux backend work authorized here. Authentication grants
no project authority; linking and rich J1/TS/Dart remain B2 work.
