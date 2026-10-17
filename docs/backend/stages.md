# Backend stages

Where backend work is now. Hamoud keeps this file; builders read their task
here and set its status. Task shape: [`AGENTS.md`](./AGENTS.md#a-task-in-stagesmd).

## Now

Next preparation: account-owned text chat and BYOK provider settings, per the
human's explicit backend-only planning scope. See the
[backend design for review](specs/2026-10-17-account-chat-and-providers-design.md).
Its written design awaits review and its remaining technical decisions need
closure; no chat implementation tasks or client changes are approved yet.

The human approved the plan and concrete backend contract on 2026-10-17.
Implementation completed inline on codex/aylul-laptop-relay with Docker-only checks.
Native integration, real-device acceptance and real-data lifecycle remain separate.

## Tasks

Touch is the exact Files block of each linked plan task. No sibling source edits.

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
