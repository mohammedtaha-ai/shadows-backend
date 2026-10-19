# Hermes assistant pre-PR verification

Recorded 2026-10-19, Asia/Aden. Base: `e4d178a`; reviewed implementation:
`9e534a8`, followed by review fixes `54d16e0`. Documentation is committed separately.

## Whole-branch review

One reviewer inspected the complete backend diff against `origin/main`, including
account binding/replay, native controls, bounded projections, configuration,
routes, migration and generated schema boundaries. Two concrete authorization
races were reproduced with failing tests and fixed in `54d16e0`:

- Reauthorize after capabilities and before creating a missing native session.
- Reauthorize status delivery even when upstream capabilities fail.

The assistant contract changed with the service. Docker focused assistant/native
client/readiness tests passed 22/22, contracts 1/1 and TypeScript passed. The
controller verified the commit/diff and reported results; it did not repeat the
review. No remaining concrete Critical/Important issue was reported within scope.

## Full test coverage

The initial combined run at concurrency 3 returned 171/172. Its single failure
was the disposable Keycloak fixture's 90-second readiness deadline. This is a
recorded failed run, not a successful gate.

The complete test set was then rerun after the review fixes in two groups, keeping
all assertions and deadlines unchanged:

```text
docker compose run --rm --no-deps tools node --import tsx --test --test-concurrency=3 tests/architecture/*.test.ts tests/integration/*.test.ts
docker compose run --rm --no-deps tools node --import tsx --test --test-concurrency=1 tests/journeys/*.test.ts
```

Architecture/integration: 165/165 passed, zero failures. Serialized journeys:
9/9 passed, zero failures, including the actual synthetic Keycloak HTTPS login,
restart and logout. Total complete coverage: **174/174 passed** across the two
groups (218.0 seconds and 140.9 seconds respectively).

Other Docker gates passed: typecheck, check:contracts, schema:check (12/12),
schema:check:laptop-link, check:docs and check:secrets. Schema checks consumed
canonical generated artifacts; no API artifact was hand-edited for this gate.

## Bounds

These final gates use synthetic PostgreSQL/Keycloak/network fixtures and make no
paid provider calls. Earlier installed-Hermes/MiniMax observations remain in
their dated evidence. A successful local gate is not remote CI or production
acceptance. Physical desktop completion, provider-side cancellation billing,
multi-user memory isolation, public assistant SSE, Core/MCP and server deployment
remain separate. The PR contains backend work only; the desktop UI is in Shadows.
