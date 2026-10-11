# B1 backend implementation and Linux acceptance

Date: 2026-10-11, Asia/Aden. Environment: authorized Linux cloud checkout
`/workspace/shadows-backend`, non-root UID 1000.

Publication amendment: after this local acceptance, the user explicitly authorized
committing and pushing the reviewed changes to `work`. Statements below about
unchanged HEAD and uncommitted work describe the original acceptance snapshot.
No additional implementation scope or deployment is authorized by publication.

## Scope and baseline

Branch: `work`, tracking `origin/work`.
Baseline and unchanged HEAD: `51f4ebd283f1d8a4ecc3e4d4c98b939fc6460230`.
Initial `git status --short --branch` was clean. Existing checkout/branch preserved.
No reset, main checkout, sibling edits, MiniMax calls, B2 work, deployment,
commit or push occurred. Root dependencies contain no AI SDK, pg-boss or
synthetic authentication provider. Existing B0 probes were not executed or edited.

The user's 2026-10-11 continuation authorized backend implementation and Linux
acceptance and expressly moved Windows acceptance to NYLRA/later joint integration.
B1.1–B1.4 now have runnable identity/device source. B1.5 deletion/purge/tombstone
restore remains separate and deferred until retention policy approval. This report
is not aggregate B1 exit, native acceptance, CI evidence or deployment readiness.

## Implemented behavior

- Fail-closed runtime settings, one composition, safe diagnostics, loopback
  listener and idempotent pool/listener shutdown. Explicit `B1_DATA_MODE=synthetic`
  is required; this is an operator acceptance-data declaration, not detection of
  whether a provider account represents a real person. No real identities were used.
- Sole node-pg-migrate SQL history; identity/device-owned tables, unique
  issuer/subject mapping and composite account/device session foreign key.
- Confidential openid-client relying party, fixed HTTPS issuer/callback,
  client_secret_basic, S256/state/nonce, RS256 signature validation and bounded
  discovery/exchange. Attempt claimed before exchange; ambiguous failure requires
  fresh login, with no automatic code-exchange retry.
- One-use, 60-second native return bound to originating challenge; backend creates
  account/device/session transactionally. Bearer/state/ticket hashes only; AES-GCM
  ciphertext bound to purpose/record/current runtime key id. Native receives no
  provider tokens or identity claims in its redirect.
- Persisted account/session/device checks for every authorization, no positive
  cache, refusal on DB failure, idle/absolute expiry and fresh-process persistence.
  Devices use identity's declared transaction operations for atomic revoke/audit.
- Immediate local/current/account-session revocation; truthful pending provider
  logout. One successful browser handoff, explicit failure retry capped at three
  attempts within the ticket lifetime, and bound one-use completion callback.
  Global local logout does not claim every provider-side session was terminated.
- Signed back-channel logout with issuer/audience/event/sid/iat/jti/RS256 and no
  nonce; replay idempotency and pending-ticket refusal. Standard form input and
  JSON are bounded and validated; duplicated form fields refuse.
- Strict TypeBox wire validation, explicit outgoing validation, generated
  auth-only OpenAPI/TS artifacts and typed openapi-fetch consumer. Body limit
  8 KiB; oversized input is a safe 413. Temporary login/redemption rate buckets
  store no audit IPs and disappear with the process.

The full architecture/roadmap is retained; no unused future modules were scaffolded.

## Actual validation

Runtime: Node 24.19.0, npm 11.9.0, Linux 6.18.44 x86_64, Docker 28.4.0.
PostgreSQL fixture requires and checked 18.4 using embedded-postgres
18.4.0-beta.17; each run creates a new non-root loopback cluster/database with
runtime-generated credentials and closes only its own resources. Existing
DATABASE_URL is never read by fixtures. Restart child configuration/handles travel
through stdin, not process arguments or diagnostic output.

Keycloak: 26.8.0 pinned image
`quay.io/keycloak/keycloak@sha256:27b3230fbabb8c9ff3c66c864cf09dcd8a41aca82e5100679d109ef0eeb05741`.
Unique disposable container/realm/client, 1 GiB/2 CPUs, loopback-only HTTPS mapping,
90-second readiness, 15-second HTTP deadlines. Backend and issuer use generated,
trusted one-day loopback certificates with TLS verification enabled. Keycloak uses
its disposable development database; no production identity PostgreSQL is inferred.

| Command | Observed result |
| --- | --- |
| `npm ci --fetch-timeout=30000 --fetch-retries=1 --no-audit --no-fund` | PASS; 135 packages |
| `npm run typecheck` | PASS; strict TypeScript |
| `npm test` | PASS; 32/32 tests, 0 failures/skips; 120.186 seconds |
| `npm run schema:generate` | PASS; deterministic OpenAPI/TS export |
| `npm run schema:check` | PASS; snapshot/negative samples and 3 wire tests |
| `npm run check:contracts` | PASS; YAML/source/stable symbol/test-reference checks |
| `npm run check:docs` | PASS; 18 documents/YAML files, 9 sibling links explicitly unverified |
| `npm run check:secrets` | PASS; 72 changed files, 0 findings (bounded heuristic scan) |
| `npm run test:lifecycle` | DEFERRED; observed exit 2 with retention gate, not a passing lifecycle test |
| `git diff --check` | PASS; exit 0, no whitespace errors |

Focused runs additionally passed startup (4), boundaries (2), migrations (2),
login including signed/logout/JWKS/form checks (7), sessions (8), restart (2),
back-channel authorization races (2), and real Keycloak journey (1).
The root `npm test` covers these same test bodies together; no historical provider
probe is run to satisfy this slice.

Real Keycloak journey proves HTTPS confidential login through actual backend
routes, one-use native-ticket redemption, code replay refusal, persisted
session after a fresh backend process, local logout denial, refresh revocation/
standard browser end-session and bound completion, plus typed wrong-state,
wrong-PKCE, wrong-nonce and reused-code protocol refusals. The browser is a Linux
HTTP/form driver; it is not a Windows system browser or native callback listener.

Back-channel signatures/key rotation/form delivery use a synthetic RS256 TLS JWKS
fixture and actual HTTP handlers plus PG stores. Keycloak-originated back-channel
network delivery/account disable is not established by this journey.

## Review and corrections

Test-first failures were observed for startup, migration, login/vault and
session/device behavior before implementation. Final validation also covers:

- Shutdown before Kysely initialization originally left a pg pool open; corrected
  explicit pool closure and tested idempotent shutdown.
- Pending return could issue a session after back-channel logout; regression
  observed red, then persisted sid checking under account lock passed.
- Provider retry was unavailable after failure; explicit bounded retry regression
  observed red, then passed without restoring local authorization.
- Oversized JSON was mislabeled as unavailable; red 413 test led to safe handling.
- An independent read-only reviewer reproduced standard form logout rejection
  before verification (503). Failing duplicate/form wire test was added, parser
  corrected, and signed-token form/replay/nonce-refusal coverage passed.
- Early fixture teardown races emitted PostgreSQL termination errors; fixture
  handles expected idle-pool termination only during owned teardown and refuses
  unexpected fixture pool errors with a safe code. Fastify disabled logging is
  verified by capturing stdout/stderr, not by assuming a logger level property.

The final complete root run passed 32/32 after the review fix, with no failures,
cancellations or skipped tests. The real Keycloak journey took 57.733 seconds.
Reviewer found no further Important/Critical defects. Deferred minor: generated
OpenAPI omits bearer security scheme/protected-route annotations; callers set
Authorization explicitly and the typed native consumer is tested. No merge/commit
review claim is made for this uncommitted working tree.

## Implementation rulings

- Kept the existing checkout/branch and all work uncommitted per user instruction;
  later integration must review the local tree. No remote state changed.
- Identity owns its settings consumer shape instead of importing app configuration;
  later interface evolution may require an explicit settings amendment.
- The OIDC logout port receives bound callback state/redirect and retries a failed
  handoff only on explicit request, at most three times within expiry. Provider
  recovery still needs joint/production acceptance; local revocation remains final.

## Remaining integration prerequisites

1. NYLRA Windows system browser, originating verifier/IPv4 return listener,
   occupied port handling, secure storage, native restart/logout and trusted UI;
   later Flutter OS return registration/secure store and generated consumer checks.
2. Provider-triggered back-channel network delivery, disabled-account propagation,
   production issuer/client/callback registration and identity PostgreSQL operations.
   TLS deployment, multi-key encrypted-token recovery and operational key rotation
   remain production acceptance. Synthetic JWKS rotation is narrower evidence.
3. User retention approval and B1.5 identity deletion/provider deletion, purge,
   tombstones, quarantined restore and physical backup expiry. No real content,
   conversation/memory/context storage or retention deadlines were implemented.
4. Actual Shadows grant/connector authority and rich J1 TS/Dart protocol belong
   to B2/later integration. A verified backend account/device grants no project access.
5. Production provider terms/retention, build, hosting, observability, distributed
   abuse controls and release checks remain unapproved deployment work.

## Changed files

6 modified tracked files and 66 new files (72 total). All changes remain local.

Modified tracked files:

```text
.gitignore
README.md
docs/architecture.md
docs/source-structure.md
docs/superpowers/plans/2026-10-10-backend-initial-plan.md
docs/superpowers/specs/2026-10-10-backend-delivery-design.md
```

New files:

```text
.node-version
api/auth-v1.d.ts
api/auth-v1.openapi.json
docs/codebase/README.md
docs/evidence/2026-10-11-b1-linux-acceptance.md
migrations/001_identity.sql
migrations/002_devices.sql
migrations/003_identity_sessions.sql
package-lock.json
package.json
scripts/check-auth-schema.ts
scripts/check-boundaries.ts
scripts/check-docs.ts
scripts/check-secrets.ts
scripts/export-auth-schema.ts
scripts/lifecycle-gate.mjs
scripts/migrate.ts
src/app/compose.ts
src/app/config.ts
src/app/contract.yaml
src/app/shutdown.ts
src/main.ts
src/modules/devices/contract.yaml
src/modules/devices/index.ts
src/modules/devices/service.ts
src/modules/devices/store.ts
src/modules/identity/contract.yaml
src/modules/identity/device-registration-port.ts
src/modules/identity/device-trust-port.ts
src/modules/identity/index.ts
src/modules/identity/model.ts
src/modules/identity/oidc-client.ts
src/modules/identity/oidc-port.ts
src/modules/identity/service.ts
src/modules/identity/store.ts
src/modules/identity/token-vault.ts
src/platform/database/contract.yaml
src/platform/database/migrate.ts
src/platform/database/pool.ts
src/platform/database/schema.ts
src/platform/database/transaction.ts
src/transports/http/auth-routes.ts
src/transports/http/auth-schema.ts
src/transports/http/authenticate.ts
src/transports/http/contract.yaml
tests/architecture/boundaries.test.ts
tests/architecture/contracts.test.ts
tests/integration/auth-wire.test.ts
tests/integration/authorization-races.test.ts
tests/integration/backchannel-logout.test.ts
tests/integration/device-revocation.test.ts
tests/integration/fixtures/config.ts
tests/integration/fixtures/identity.ts
tests/integration/fixtures/keycloak.ts
tests/integration/fixtures/postgres.ts
tests/integration/fixtures/restart-child.ts
tests/integration/fixtures/restart.ts
tests/integration/fixtures/tls.ts
tests/integration/login-return.test.ts
tests/integration/migrations.test.ts
tests/integration/oidc-client.test.ts
tests/integration/session-lifecycle.test.ts
tests/integration/startup.test.ts
tests/journeys/keycloak-login.test.ts
tests/journeys/session-restart.test.ts
tsconfig.json
```
