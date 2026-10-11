# Local identity and runtime implementation plan

**Goal:** Make the existing B1 backend reproducible on Windows Docker Desktop and hand off its auth contract to NYLRA.
**Spec:** [Architecture](../../architecture.md), section 5; [delivery owner](../specs/2026-10-10-backend-delivery-design.md).
**Execution:** Inline in existing checkout, no commits, per direct user instruction. The user authorizes choosing and implementing the smallest design; additional design approval gates and worktrees do not apply.

## Constraints

Synthetic accounts only; Node tooling in Docker; reviewed root lockfile; separate application and Keycloak PostgreSQL ownership. No provider calls, sibling edits, retention approval, B2+, deployment or publication. Never inspect ignored provider configuration. TLS verification remains enabled. Current-user certificate trust is an explicit user step.

## Design

Account is the verified issuer/subject mapping. Device is an enrolled installation, not physical hardware. A login creates a fresh session. New enrollment returns a random 256-bit installation credential once; devices stores only its SHA-256 hash. Return redemption requires an explicit `enrollment` choice: `{mode:new}` or `{mode:reuse,credential}`. Reuse finds an active enrollment belonging to the authenticated account without accepting a client device ID. Legacy devices without a credential cannot reuse; existing sessions continue until revoked/expired. Enrollment credentials do not authorize API access alone. Session logout preserves enrollment; device revocation invalidates enrollment and all its sessions. A new authenticated enrollment after revocation is allowed and creates a different row. Failed redemption rolls back the ticket, device and session together. Account locks serialize redemption and revocation.

Tradeoff: a bearer enrollment credential is smaller than asymmetric proof signing and adequate for this OS-protected client credential boundary. Theft plus a successful account login can reuse an enrollment; secure storage and TLS are mandatory. No fingerprinting or permanent hardware blocking is promised. No generic trust framework or credential recovery endpoint is introduced. Lost new-enrollment responses require explicit new enrollment; return tickets stay one-use.

Ingress, backend, Keycloak and acceptance runner share the ingress network namespace. Windows and containers use the identical `https://127.0.0.1:8443` authority; ingress routes `/v1` and `/health` to backend and Keycloak paths to the provider. Databases have separate users, databases and passwords, no host ports. Development volumes persist; test clusters remain disposable. Generated secrets/certificates live in ignored `.local-runtime`, never argv or logs.

## Tasks and verification

- [x] Enrollment: write PostgreSQL regression tests for reuse, logout distinction, invalid/foreign/revoked proof, explicit new enrollment, concurrent redemption, rollback and restart. Observe missing implementation failure, implement devices registration port/store, migration 004, identity return input and wire shapes. Generate OpenAPI/TS in Docker; protected routes declare bearer security.
- [x] Runtime: pinned Dockerfile/Compose, file-based secret bootstrap, local CA/leaf certificate, Keycloak deterministic realm/client and separate PG readiness, explicit migration service. Build and run focused tests in Docker. No host Node/PG.
- [x] Acceptance: actual Compose journey performs confidential login, replay, enrollment, restart, current/account logout, provider-admin back-channel and disable measurement. Address disable gaps explicitly. Run complete suite, schema, contract YAML, docs, secret and whitespace checks.
- [x] Handoff: publish safe fixtures and exact commands/URLs/trust steps, update owners/README/code map and dated evidence. Leave successful development stack running. Clean only task-owned disposable resources.

## Review focus

1. Revoked proof must never fall back to new enrollment.
2. Legacy rows and existing sessions survive supported migration without minting an enrollment proof.
3. Failed transaction must not consume a ticket or expose an unpersisted credential.
4. Provider disable may leave backend sessions active; test and enforce a documented fail-closed boundary.
5. Container localhost must reach the same advertised issuer as Windows, including signed logout network delivery.

## Execution ledger

- Baseline `36936af7d83ebc6c039f2842e5db27c28ca432ce`, branch `work`, clean; Windows checkout and Docker Desktop 4.72.0 / Engine 29.4.2 observed.
- Enrollment/runtime/acceptance/handoff implemented inline; exact commands, failed attempts and limits are in [local evidence](../../evidence/2026-10-11-local-docker-nylra-readiness.md).
- Independent read-only review found provider renewal and outage/local-revocation gaps; both reproduced RED and corrected. Full suite final PASS 41/41, no failures/skips, 83.945 seconds.
- Actual Compose confidential login, one-use redemption, stable enrollment, device/current/account logout, real Keycloak back-channel, disable measurement and persisted restart passed. Browser/native NYLRA gate remains open.
- Image pulls paused at user request, then resumed after user downloads. Windows-bind test PG replaced with isolated Linux test-runtime volume; immutable image digests retained.
- Migration 005 and bounded provider renewal added to maintain the existing backend lifetime, without extending absolute expiry or adding an authorization cache. Revocation-only verification surrenders authority during provider outage.
- No commit/staging/publication; retention-dependent B1.5 remains deferred, observed lifecycle exit 2.
