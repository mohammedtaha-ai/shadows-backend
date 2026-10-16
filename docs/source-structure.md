# Backend source organization

Date: 2026-10-10; implementation amendment: 2026-10-11; AYLUL amendment: 2026-10-13.
Status: full-product placement design; implemented B1 owners are listed in the
[actual code map](codebase/README.md). Unused capability folders remain uncreated.
This file owns source placement and dependency boundaries for this repository.
[Architecture](architecture.md) owns product rules and deployment decisions.
The paths below are intended destinations when a runnable feature needs them,
not an inventory of existing modules or an instruction to create empty folders.

[Delivery spec](superpowers/specs/2026-10-10-backend-delivery-design.md) and
[initial plan](superpowers/plans/2026-10-10-backend-initial-plan.md) define
experiment-first selection and joint client gates. Library names in those files
are candidates until measured; this file remains the source-placement owner.

## Selected approach

Use one modular TypeScript application organized by capability. HTTP and durable
workers invoke the same application services. Start with one package; a separate
process for delivery does not require a second implementation or a microservice.
Extract packages only for a demonstrated independent consumer or release boundary.

A global controllers/services/repositories split scatters one feature across the
tree. A microservice per domain adds deployment and cross-service failure handling
before there is a running integration. Capability folders preserve ownership
without those costs. This is our design judgment, not a framework requirement.

## Intended layout

```text
src/
  main.ts                        process entry
  app/                           composition and lifecycle, split by named job
    compose.ts                   constructs application dependencies
    config.ts                    validates startup configuration
    shutdown.ts                  coordinates graceful shutdown
  modules/
    identity/                    account identity
    devices/                     device trust lifecycle
    links/                       paired laptops and their online state
    sessions/                    agent sessions and their summarized steps
    activity/                    durable per-account event ordering (proposed 2026-10-17)
    approvals/                   agent approval requests, decisions, grant revocation
    conversations/               topics, turns and the cloud brain's replies
    memory/                      the person's preferences and project descriptions
    notifications/               push tokens and interruption policy
    membership/                  team access policy (later)
    delivery/                    durable handoff lifecycle (later)
    context/                     permitted evidence assembly (later)
  transports/
    http/                        request/response and SSE translation
    laptop-link/                 AYLUL desktop's outbound WebSocket
    jobs/                        durable job invocation
  integrations/
    providers/                   model and speech API adapters
  platform/
    database/                    pool and transaction primitives
    telemetry/                   diagnostic instrumentation
    clock/                       time source, only when needed
packages/
  aylul-brain/                   AYLUL's agent loop, run here and on the laptop
migrations/                      ordered SQL migrations with named module owner
api/                             generated public protocol snapshots
tests/
  integration/                   service/store behavior against PostgreSQL
  journeys/                      complete application paths
  architecture/                  dependency and ownership checks
docs/
  codebase/README.md             actual code map, created with first source
  contracts/                    contract convention and canonical template
  evidence/                     dated observations
```

The modules follow the nylra-v1 0.2 operation groups in the
[delivery spec](superpowers/specs/2026-10-10-backend-delivery-design.md):
Links, Sessions, Approvals with grant revocation, Chat and Push each have one
owner. The account SSE stream is an HTTP translation of what those modules
record. Planning amendment 2026-10-17: the proposed relay plan introduces
`activity` as the single owner of its transactional per-account counter/journal,
shared by the actual links and session publishers. This is subject to plan review;
it creates no generic event bus and no source module before the path is built.
The HTTP SSE adapter still owns framing only. `links` changed meaning on 2026-10-13: it
was selected Shadows access, and is now the person's paired laptops, because
AYLUL desktop, not this application, reads Shadows. There is no
`integrations/shadows`. Grants are stored and enforced on the laptop; this
application records a revocation and relays it, and never creates or widens one.

Each module exposes a small `index.ts` public surface. Within it, start with the
files the feature actually needs: `service.ts` for operations, `model.ts` for pure
domain shapes, `store.ts` for its queries, and `contract.yaml` for inspected module
behavior. Split a store or service by a named responsibility as it grows. Interfaces
for external dependencies live with their consumer; composition supplies adapters.
Do not create a base repository, universal service, event bus or generic workflow
engine merely to make every folder look alike.

## Dependencies and storage

```text
main -> app composition -> transports -> module public operations
                                      -> integrations implementing consumer ports
module service -> pure model + own store/consumer ports
own store -> database primitives
```

- Domain models import no HTTP framework, provider SDK or database client.
- A transport validates wire shape and maps outcomes; services enforce rules.
- Modules import other modules only through public operations. Their graph must
  remain acyclic. A cycle is resolved by locating the workflow's actual owner,
  not by adding a miscellaneous shared module.
- Only a module's store accesses its tables. The migration directory is centrally
  ordered for the SQL migration tool, but each migration names its table owner.
- Cross-module atomic work uses declared transactional operations with transaction
  lifetime owned by the calling workflow. No caller obtains another store's raw
  tables or query helpers. Remote Rust acceptance is never a local DB transaction.
- Delivery owns retries and durable delivery state; a job adapter owns neither.
  Provider adapters do not decide whether a proposal is human-approved.
- `api/` contains generated wire artifacts, not domain models shared by import.
  Each public operation has one canonical wire-schema owner; generation exports
  it. The schema/generator choice closes with the protocol implementation review.
- Cross-repository consumers use versioned schema artifacts, not imports into
  sibling source trees. Node `exports` can restrict a future package's supported
  entry points, but does not enforce module privacy inside the same package.

Use import restrictions for static TS boundaries; test alias and relative-path
bypasses. Code review still checks semantic ownership. TypeScript type safety
does not validate untrusted wire data or enforce database authorization.

## AYLUL brain package

`packages/aylul-brain` is the one package this repository publishes for another
consumer: the backend application runs it as the cloud brain, and AYLUL desktop's
Node sidecar runs it as the laptop brain. It holds the agent loop on the AI SDK,
AYLUL's instructions and the declared tools. It owns no storage, transport or
provider choice.

- **Each tool is a port the brain declares; each host supplies its adapters.**
  The cloud host supplies memory from the `memory` module and notifications. The
  laptop host supplies the Shadows projection, agent sessions and memory through
  this backend's HTTP API. A tool with no adapter in a host is absent there, so
  the same loop knows what it can reach in each place.
- **The provider is configuration** handed in by the host. The package never
  reads environment variables, keys or files.
- **It imports nothing from `src/`.** `src/` reaches it only through its package
  entry point, and the architecture check enforces this.
- Created with step 2(c) of the
  [first release](../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#first-release-and-who-builds-it),
  not before.

> **OPEN: how AYLUL desktop gets the package.** The candidates are a version tag
> in this repository that the sidecar installs, or a registry package.
> Cross-repository consumers use versioned artifacts, never sibling source, so a
> relative path is not a candidate. Closes when step 2(c) first runs the brain in
> the sidecar.

## Contracts and first delivery

Use the [shared source-contract convention](contracts/README.md). A contract is
created with inspected implementation, not for each prospective folder above.
Generated wire schemas, source contracts and architectural specs have different jobs.

The first release creates folders in the order its steps need them: step 2(b)
adds `links`, `sessions`, `approvals`, `notifications` and `transports/laptop-link`;
step 2(c) adds `packages/aylul-brain`, `memory` and `conversations`. Wire the real
provider and laptop-link path, with cancellation and reconnect, before
generalizing it. Folders marked "later" wait for a runnable path of their own.
Real identity/protocol/data-lifecycle prerequisites
must be closed first; fake dependencies cannot establish production readiness.

Before treating this structure as enforced, verify: forbidden imports fail; a
service cannot read another store directly; contract source/test references resolve;
generated protocol changes are detected; scoped retrieval and replay work across
transports. These are future checks, not tests that currently exist.

## Research basis

The folder names and domain split are project-specific design choices.
[Node package exports](https://nodejs.org/api/packages.html#package-entry-points)
supports explicit published entry points but is not a security boundary.
[ESLint import restrictions](https://eslint.org/docs/latest/rules/no-restricted-imports)
provides path/pattern restrictions suitable for enforcing static dependency rules.
Checked 2026-10-10. Component selection is owned by
[architecture section 2](architecture.md#2-languages-and-technology-direction),
with [partial B0 evidence](evidence/2026-10-10-backend-capability-probes.md).
Non-product experiments are deleted once their evidence file is written; the
B0 probes are at `db27eb5` and the J1 Linux probe at `7fc59a7`. They are not product
modules, the implemented code map, or permission to scaffold the layout above.
