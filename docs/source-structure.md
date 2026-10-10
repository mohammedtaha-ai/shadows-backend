# Backend source organization

Date: 2026-10-10. Status: prepared design for review; no source is scaffolded.
This file owns source placement and dependency boundaries for this repository.
[Architecture](architecture.md) owns product rules and deployment decisions.
The paths below are intended destinations when a runnable feature needs them,
not an inventory of existing modules or an instruction to create empty folders.

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
    membership/                  team access policy
    devices/                     device trust lifecycle
    links/                       selected Shadows access
    topics/                      intervention lifecycle
    confirmations/               trusted confirmation records
    delivery/                    durable handoff lifecycle
    conversations/               NYLRA dialogue orchestration
    memory/                      personal preference lifecycle
    context/                     permitted evidence assembly
    notifications/               interruption policy
  transports/
    http/                        request/response translation
    connector/                   scoped daemon message translation
    jobs/                        durable job invocation
  integrations/
    shadows/                     remote Rust runtime protocol client
    providers/                   model and speech API adapters
  platform/
    database/                    pool and transaction primitives
    telemetry/                   diagnostic instrumentation
    clock/                       time source, only when needed
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

## Contracts and first delivery

Use the [shared source-contract convention](contracts/README.md). A contract is
created with inspected implementation, not for each prospective folder above.
Generated wire schemas, source contracts and architectural specs have different jobs.

The first text journey creates only the domains it exercises: authenticated device,
selected project link, bounded evidence and topic conversation. Wire the real
provider/connector path with cancellation and reconnect before generalizing it.
Add confirmation and delivery capabilities with their own runnable path under the
architecture's delivery order. Real identity/protocol/data-lifecycle prerequisites
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
Checked 2026-10-10. No framework, ORM or queue library is selected by this document.
