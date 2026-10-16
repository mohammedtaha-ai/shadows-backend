# Backend stages

Where backend work is now. Hamoud keeps this file; builders read their task
here and set its status. Task shape: [`AGENTS.md`](./AGENTS.md#a-task-in-stagesmd).

## Now

Research completed on local `codex/aylul-laptop-relay` from `65095a6`.
The user requested planning after reviewing the proposed scope. The
[implementation plan](plans/2026-10-17-laptop-relay-implementation.md) is prepared
for review with concrete protocol and Activity-ownership proposals in the
[specification](specs/2026-10-17-laptop-relay-design.md). The
[Native interface request](../shared/requests/2026-10-17-laptop-relay.md) remains
asked until those proposals are explicitly accepted. No product work has started.
The user-requested Astra/low static review of the committed specification and
related cleanup completed without confirmed actionable findings. User review and
the named Native agreement remain the implementation boundary.

## Tasks

The dated [research evidence](../evidence/2026-10-17-laptop-relay-research.md)
records eight passing synthetic transport cases and four bounded real-provider
requests; these do not establish product relay or real-data acceptance.

All tasks below are blocked on written-plan review and the accepted Native
agreement. `Touch` delegates to the exact Files block of its linked task, not to
the whole repository. Source contract and map changes travel with inspected code.

### B-R1 · Generate the canonical relay contract
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-1-canonical-operations-and-generated-protocol-artifacts
- Read: spec generation/protocol decisions; current HTTP contract, TypeBox registry and exporters.
- Touch: exactly Task 1 Files.
- Done when: focused wire/mock tests, generated snapshot drift checks, typecheck and contracts pass.

### B-R2 · Own account event ordering
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-2-transactional-account-activity-journal
- Read: spec Activity amendment; database contract; existing architecture checks.
- Touch: exactly Task 2 Files.
- Done when: journal rollback/concurrency/floor, migration, boundary and contract tests pass.

### B-R3 · Pair laptops and fence connections
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-3-pairing-link-access-and-connection-checkpoints
- Read: accepted protocol, identity/devices contracts, Task 2 public Activity operations.
- Touch: exactly Task 3 Files.
- Done when: pairing/replay/rate/revocation/epoch tests, owner checks and typecheck pass.

### B-R4 · Commit safe session ingress before ACK
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-4-safe-session-ingestion-with-commit-before-ack
- Read: Task 3 public lease/receipt ports, Task 2 journal, accepted safe projection.
- Touch: exactly Task 4 Files.
- Done when: real SQL lost-ACK/rollback/conflict/expiry/scoping tests and owner checks pass.

### B-R5 · Bound the authenticated socket lifetime
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-5-bounded-authenticated-websocket-transport
- Read: Task 1 source schemas and Task 3/4 public service operations; existing identity authority.
- Touch: exactly Task 5 Files.
- Done when: actual-listener protocol/resource/revocation/fencing tests and typecheck pass.

### B-R6 · Serve live HTTP and durable SSE
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-6-generated-live-http-routes-and-race-free-sse
- Read: canonical registry, implemented public services, auth exporter and scoped error behavior.
- Touch: exactly Task 6 Files.
- Done when: route coverage, auth isolation, snapshot/cursor/race/revocation tests and generation checks pass.

### B-R7 · Prove the synthetic journey and hand off
- Status: blocked
- Plan: docs/backend/plans/2026-10-17-laptop-relay-implementation.md#task-7-end-to-end-synthetic-journey-and-handoff
- Read: complete plan/spec, actual contracts from Tasks 1–6, unresolved lifecycle/device gates.
- Touch: exactly Task 7 Files.
- Done when: synthetic journey and complete affected suites pass; fresh review and precise limits are recorded.

