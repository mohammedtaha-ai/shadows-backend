# Backend stages

Where backend work is now. Hamoud keeps this file; builders read their task
here and set its status. Task shape: [`AGENTS.md`](./AGENTS.md#a-task-in-stagesmd).

## Now

**Now: account chat, step 1 (B-1 to B-11).** Account-owned text chat with
encrypted BYOK connections, backend only.
[Design](specs/2026-10-17-account-chat-and-providers-design.md),
[plan](plans/2026-10-18-account-chat-step1.md),
[accepted request](../shared/requests/2026-10-18-account-chat-and-providers.md).
Later steps: lifecycle and the real-data gate (2), open signup and more API
formats (3).

**Done: laptop relay (B-R1 to B-R8).** Below. Plan and contract approved by the
human on 2026-10-17; built inline on `codex/aylul-laptop-relay`, checked in
Docker only. Native integration, real-device acceptance and real-data
lifecycle remain separate work.

## Tasks

### Account chat, step 1

Branch `backend/account-chat`. Run checks with
`docker compose run --rm --no-deps tools <command>`; see the plan's
"How to run checks". Every task may also set its status here.

### B-1 · Generated contract for chat and connections
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-1--generated-contract-for-chat-and-connections
- Read: docs/shared/requests/2026-10-18-account-chat-and-providers.md; src/transports/http/contract.yaml
- Touch: src/transports/http/nylra-schema.ts, src/transports/http/nylra-paths.ts, src/transports/http/contract.yaml, scripts/mock-nylra.ts, scripts/export-nylra-schema.ts, api/nylra-v1.openapi.json, api/nylra-v1.d.ts, api/nylra-v1.fixtures.json, tests/integration/nylra-wire.test.ts, tests/integration/nylra-mock.test.ts
- Scope amendment (human-approved 2026-10-18): allow the exporter to convert boolean literals to OpenAPI 3.0 one-value enums for the required acknowledgement fields.
- Done when: `npm run schema:nylra` then `npm run schema:check`, `tests/integration/nylra-mock.test.ts`, typecheck, check:contracts pass

### B-2 · Credential sealing and the BYOK key ring
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-2--credential-sealing-and-the-byok-key-ring
- Read: spec "Proposed encryption and rotation"; src/app/config.ts; src/app/contract.yaml; docker/runtime.ts at `secret(`
- Touch: src/modules/provider-settings/credential-seal.ts, src/modules/provider-settings/contract.yaml, src/app/config.ts, src/app/contract.yaml, docker/runtime.ts, docker/bootstrap.mjs, tests/integration/fixtures/config.ts, tests/integration/credential-seal.test.ts, tests/integration/startup.test.ts, tests/architecture/contracts.test.ts, docs/codebase/README.md
- Scope amendment (human-approved 2026-10-18): register the new credential-sealing owner in the contract coverage check and implemented code map.
- Done when: `tests/integration/credential-seal.test.ts` and `tests/integration/startup.test.ts` pass, typecheck, check:contracts

### B-3 · Destination validation
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-3--destination-validation
- Read: spec "Provider behavior"; src/modules/provider-settings/contract.yaml
- Touch: src/modules/provider-settings/destination.ts, src/modules/provider-settings/contract.yaml, tests/integration/provider-destination.test.ts, docs/codebase/README.md
- Scope amendment (human-approved 2026-10-18): update the provider-settings code-map row to include destination validation alongside credential sealing.
- Done when: `tests/integration/provider-destination.test.ts` passes, typecheck, check:contracts

### B-4 · Provider settings owner
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-4--provider-settings-owner
- Read: src/modules/links/{index,service,store}.ts as the owner pattern; src/platform/database/contract.yaml; scripts/check-boundaries.ts
- Touch: src/modules/provider-settings/model.ts, src/modules/provider-settings/store.ts, src/modules/provider-settings/service.ts, src/modules/provider-settings/index.ts, src/modules/provider-settings/contract.yaml, migrations/009_provider_settings.sql, src/platform/database/schema.ts, src/platform/database/contract.yaml, scripts/check-boundaries.ts, tests/architecture/boundaries.test.ts, tests/architecture/contracts.test.ts, tests/integration/migrations.test.ts, tests/integration/provider-settings.test.ts, docs/codebase/README.md
- Done when: `tests/integration/provider-settings.test.ts`, `tests/integration/migrations.test.ts`, `npm run test:boundaries` pass, typecheck, check:contracts

### B-5 · OpenAI-compatible adapter and fake provider
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-5--openai-compatible-adapter-and-fake-provider
- Read: B-3 destination.ts exports; tests/integration/fixtures/tls.ts
- Touch: src/integrations/providers/openai-compatible.ts, src/integrations/providers/contract.yaml, tests/integration/fixtures/fake-provider.ts, tests/integration/provider-adapter.test.ts, package.json, package-lock.json, scripts/check-boundaries.ts, tests/architecture/boundaries.test.ts, tests/architecture/contracts.test.ts, docs/codebase/README.md
- Done when: `tests/integration/provider-adapter.test.ts`, `npm run test:boundaries` pass, typecheck, check:contracts

### B-6 · aylul-brain package
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-6--aylul-brain-package
- Read: docs/source-structure.md "AYLUL brain package"; B-5 adapter exports
- Touch: packages/aylul-brain/package.json, packages/aylul-brain/src/index.ts, packages/aylul-brain/src/instructions.ts, packages/aylul-brain/contract.yaml, package.json, package-lock.json, tsconfig.json, Dockerfile, scripts/check-boundaries.ts, tests/architecture/boundaries.test.ts, tests/architecture/contracts.test.ts, tests/integration/aylul-brain.test.ts, docs/codebase/README.md
- Done when: `tests/integration/aylul-brain.test.ts`, `npm run test:boundaries` pass, typecheck, check:contracts

### B-F1 · PostgreSQL test fixture fails in Docker
- Status: done (environmental: the dependency volume missed embedded-postgres's postinstall; repaired with `docker compose run --rm --no-deps tools npm ci --no-audit --no-fund`; no code change)
- Found: Hamoud, 2026-10-18, at `9467ec9`. `docker compose run --rm --no-deps tools node --import tsx --test tests/integration/migrations.test.ts` fails 4/4 with `postgres_fixture_setup` (tests/integration/fixtures/postgres.ts:60); startup.test.ts fails 3/9 the same way. Every PostgreSQL test is affected, so B-4 is unverified. Not yet known whether B-1 to B-6 caused it (dependency volume after the workspace install, B-6) or the environment did.
- Read: tests/integration/fixtures/postgres.ts; Dockerfile; compose.yaml `tools` service; package.json workspaces
- Touch: tests/integration/fixtures/postgres.ts, Dockerfile, compose.yaml, package.json, package-lock.json. If the cause is only environmental (no file change), fix nothing in Git, report the cause and the command that repairs it.
- Done when: `tests/integration/migrations.test.ts`, `tests/integration/startup.test.ts` and `tests/integration/provider-settings.test.ts` pass in Docker

### B-F2 · schema:check fails after the BYOK config (B-2)
- Status: done (both env builders now pass BYOK_KEY/BYOK_KEY_ID; restart also forwards BYOK_PREVIOUS_KEYS)
- Found: Hamoud, 2026-10-18. `docker compose run --rm --no-deps tools npm run schema:check` fails with `config_invalid` at src/app/config.ts:38, from scripts/export-auth-schema.ts:8, which passes no `BYOK_KEY`/`BYOK_KEY_ID`. tests/integration/fixtures/restart.ts:8 builds the same env and likely fails too.
- Read: src/app/config.ts readConfig; scripts/export-auth-schema.ts; tests/integration/fixtures/restart.ts
- Touch: scripts/export-auth-schema.ts, tests/integration/fixtures/restart.ts
- Done when: `npm run schema:check` and `npm run test:restart` pass in Docker, typecheck

### B-6b · Keep the provider failure category through the brain
- Status: done
- Found: Hamoud review, 2026-10-18. `replyStream` in packages/aylul-brain/src/index.ts reports only `{finish:'error'}`, dropping the adapter's `ProviderFailure.code`, so B-8 cannot finish a turn with `credential_rejected`/`quota`/`model_unavailable`/`network`. The adapter maps HTTP 400 to `network`; a provider context/length refusal must map to `context_too_large`.
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-6--aylul-brain-package
- Read: src/integrations/providers/contract.yaml; packages/aylul-brain/contract.yaml
- Touch: packages/aylul-brain/src/index.ts, packages/aylul-brain/contract.yaml, src/integrations/providers/openai-compatible.ts, src/integrations/providers/contract.yaml, tests/integration/aylul-brain.test.ts, tests/integration/provider-adapter.test.ts, tests/integration/fixtures/fake-provider.ts
- Done when: `tests/integration/aylul-brain.test.ts` (error finish carries the category, no key or body text) and `tests/integration/provider-adapter.test.ts` (400 context refusal → `context_too_large`) pass, typecheck, check:contracts

### B-7 · Conversations owner: topics, turns, delete
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-7--conversations-owner-topics-turns-delete
- Read: src/modules/sessions/contract.yaml and its store.ts journal; src/modules/activity/index.ts; src/modules/provider-settings/index.ts
- Touch: src/modules/conversations/model.ts, src/modules/conversations/store.ts, src/modules/conversations/service.ts, src/modules/conversations/index.ts, src/modules/conversations/contract.yaml, migrations/010_conversations.sql, src/platform/database/schema.ts, src/platform/database/contract.yaml, src/modules/activity/model.ts, src/modules/activity/contract.yaml, scripts/check-boundaries.ts, tests/architecture/boundaries.test.ts, tests/architecture/contracts.test.ts, tests/integration/migrations.test.ts, tests/integration/conversations.test.ts, docs/codebase/README.md, src/modules/activity/store.ts, src/transports/http/nylra-routes.ts, packages/aylul-brain/src/index.ts, packages/aylul-brain/contract.yaml, src/modules/provider-settings/service.ts, src/modules/provider-settings/contract.yaml, tests/integration/fixtures/activity-publisher.ts
- Scope amendment (human-approved 2026-10-18): support topic_deleted without a laptop in activity storage/account SSE and export brain instructions for the actual context budget. Additional approved scope: declare transaction-safe selectForTopic metadata selection in provider settings to avoid nested transactions. Also allow the activity-publisher test fixture to preserve the AccountChange discriminator during date serialization.
- Done when: `tests/integration/conversations.test.ts`, `tests/integration/migrations.test.ts`, `npm run test:boundaries` pass, typecheck, check:contracts

### B-8 · Dispatch worker, stop and restart fencing
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-8--dispatch-worker-stop-and-restart-fencing
- Read: src/modules/conversations/contract.yaml; IdentityService.authorizeTransaction; packages/aylul-brain contract; src/app/compose.ts and shutdown.ts
- Touch: src/modules/conversations/dispatch.ts, src/modules/conversations/reply-port.ts, src/modules/conversations/service.ts, src/modules/conversations/store.ts, src/modules/conversations/model.ts, src/modules/conversations/index.ts, src/modules/conversations/contract.yaml, src/app/compose.ts, src/app/shutdown.ts, src/app/contract.yaml, tests/integration/turn-dispatch.test.ts, tests/integration/conversations.test.ts, docs/codebase/README.md, tests/integration/fixtures/postgres.ts
- Scope amendment (human-approved 2026-10-18): update Conversations construction tests for app-supplied instructions, preserving the exact context budget while removing the domain brain import. Also update the Conversations code-map row to reflect implemented dispatch while live topic routes remain deferred to B-9. Also initialize isolated embedded PostgreSQL fixtures with UTF8 for faithful Unicode character-limit tests.
- Done when: `tests/integration/turn-dispatch.test.ts` passes, `npm run test:startup`, typecheck, check:contracts

### B-9 · Live HTTP routes and topic SSE
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-9--live-http-routes-and-topic-sse
- Read: src/transports/http/contract.yaml; nylra-routes.ts and nylra-sse.ts at the session bindings
- Touch: src/transports/http/nylra-paths.ts, src/transports/http/nylra-routes.ts, src/transports/http/nylra-sse.ts, src/transports/http/contract.yaml, src/app/compose.ts, scripts/mock-nylra.ts, api/nylra-v1.openapi.json, api/nylra-v1.d.ts, api/nylra-v1.fixtures.json, tests/integration/chat-routes.test.ts, tests/integration/nylra-live-routes.test.ts, tests/integration/nylra-mock.test.ts, docs/codebase/README.md, tests/integration/nylra-wire.test.ts, src/modules/provider-settings/service.ts, src/modules/provider-settings/contract.yaml, src/app/contract.yaml, src/modules/conversations/contract.yaml
- Scope amendment (human-approved 2026-10-18): update wire implementation assertions, add the provider-owned acknowledged connection probe, and keep provider/application/conversations contracts current with live HTTP composition.
- Done when: `tests/integration/chat-routes.test.ts`, `tests/integration/nylra-live-routes.test.ts`, `npm run schema:check` pass, typecheck, check:contracts

### B-10 · Synthetic chat journey
- Status: done
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-10--synthetic-chat-journey
- Read: tests/journeys/laptop-relay.test.ts; docker/relay-journey.ts
- Touch: tests/journeys/account-chat.test.ts, docker/chat-journey.ts, docs/evidence/2026-10-18-account-chat-acceptance.md, docs/codebase/README.md, api/laptop-link-v1.schema.json, api/laptop-link-v1.d.ts
- Scope amendment (human-approved 2026-10-18): regenerate laptop-link wire artifacts through schema:laptop-link after shared HTTP refusal codes changed, as detected by the complete test suite.
- Done when: `tests/journeys/account-chat.test.ts` passes, then the full `npm test` in Docker with zero failures

### B-11 · Manual MiniMax journey (human-run)
- Status: todo
- Plan: docs/backend/plans/2026-10-18-account-chat-step1.md#b-11--manual-minimax-journey-human-run-conditional
- Read: docs/evidence/2026-10-11-minimax-provider-probe.md
- Touch: docs/evidence/2026-10-18-account-chat-acceptance.md (Hamoud only)
- Done when: the human's run of `docker/chat-journey.ts` against MiniMax is recorded; no builder

### Laptop relay (done)

These tasks predate the task shape: their Touch is the Files block of the
linked plan task, and Done when is the plan task's checks. New tasks list exact
files and a named test.

### B-R1 · Generate the canonical relay contract
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-1-canonical-operations-and-generated-protocol-artifacts
- Read: spec generation/protocol decisions; current HTTP contract, TypeBox registry and exporters.
- Touch: exactly Task 1 Files.
- Done when: focused wire/mock tests, generated snapshot drift checks, typecheck and contracts pass.

### B-R2 · Own account event ordering
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-2-transactional-account-activity-journal
- Read: spec Activity amendment; database contract; existing architecture checks.
- Touch: exactly Task 2 Files.
- Done when: journal rollback/concurrency/floor, migration, boundary and contract tests pass.

### B-R3 · Pair laptops and fence connections
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-3-pairing-link-access-and-connection-checkpoints
- Read: accepted protocol, identity/devices contracts, Task 2 public Activity operations.
- Touch: exactly Task 3 Files.
- Done when: pairing/replay/rate/revocation/epoch tests, owner checks and typecheck pass.

### B-R4 · Commit safe session ingress before ACK
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-4-safe-session-ingestion-with-commit-before-ack
- Read: Task 3 public lease/receipt ports, Task 2 journal, accepted safe projection.
- Touch: exactly Task 4 Files.
- Done when: real SQL lost-ACK/rollback/conflict/expiry/scoping tests and owner checks pass.

### B-R5 · Bound the authenticated socket lifetime
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-5-bounded-authenticated-websocket-transport
- Read: Task 1 source schemas and Task 3/4 public service operations; existing identity authority.
- Touch: exactly Task 5 Files.
- Done when: actual-listener protocol/resource/revocation/fencing tests and typecheck pass.

### B-R6 · Serve live HTTP and durable SSE
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-6-generated-live-http-routes-and-race-free-sse
- Read: canonical registry, implemented public services, auth exporter and scoped error behavior.
- Touch: exactly Task 6 Files.
- Done when: route coverage, auth isolation, snapshot/cursor/race/revocation tests and generation checks pass.

### B-R7 · Prove the synthetic journey and hand off
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-7-end-to-end-synthetic-journey-and-handoff
- Read: complete plan/spec, actual contracts from Tasks 1–6, unresolved lifecycle/device gates.
- Touch: exactly Task 7 Files.
- Done when: synthetic journey and complete affected suites pass; fresh review and precise limits are recorded.


Tasks 1–7 verification: 84/84 Docker tests passed. Their final review's five
Important findings were fixed with reproductions. Task 8 later corrected the
code-map Minor and completed the development ingress path; its final Docker
suite passed 88/88. See docs/evidence/2026-10-17-laptop-relay-acceptance.md.
No remote CI or Native/device acceptance claimed.

### B-R8 · Complete development TLS ingress acceptance
- Status: done
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-8-verify-the-development-tls-ingress
- Read: Task 8, local auth handoff, actual Nginx configuration and relay journey.
- Touch: exactly Task 8 Files.
- Done when: actual-Nginx WSS/SSE regressions, authenticated Compose relay journey,
  typecheck and affected checks pass; local evidence and one fresh review recorded.
