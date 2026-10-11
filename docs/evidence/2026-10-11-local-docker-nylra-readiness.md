# Local Docker identity acceptance and NYLRA handoff

Date: 2026-10-11, Asia/Aden. Windows checkout `E:\Globalprojects\shadows-backend`;
Docker Desktop Linux engine on this device. No substitute cloud execution.

Publication amendment: after the acceptance recorded below, the user authorized
a local commit on `work` only. Unchanged-HEAD/uncommitted statements describe the
acceptance snapshot. No push, merge or deployment was authorized.
Commit preparation added explicit LF attributes for Docker shell scripts and
generated OpenAPI/TypeScript snapshots so a Windows CRLF checkout preserves their
runtime/schema-check behavior.

## Result and boundaries

The local backend is ready for NYLRA's auth adapter integration against auth-v1
**1.1.0**, subject to the explicit certificate/native prerequisites in the
[handoff](../nylra-local-auth-handoff.md). Backend Docker/Linux acceptance passed;
actual Windows browser/native return/secure storage and the NYLRA application
were not exercised. Windows curl HTTPS was exercised separately using the
private CA and the bounded missing-CRL exception documented below.
Remote CI was not run; these are local checks only.

Development services remain running and healthy: `ingress`, `backend`, `app-db`,
`identity-db`, `keycloak`, under Compose project `shadows-backend-local`.
Backend: `https://127.0.0.1:8443`; issuer:
`https://127.0.0.1:8443/realms/shadows-local`; console:
`https://127.0.0.1:8443/admin/`. Only loopback ingress is host-published.

## Baseline, scope and ownership

Initial and final HEAD: `36936af7d83ebc6c039f2842e5db27c28ca432ce` on `work`.
Initial Git status was clean; no reset, worktree, staging, commit, push, merge,
deployment or sibling edit occurred. Existing checkout preserved. The user paused
work to download images manually, then explicitly resumed after all four pulls
completed. No existing MiniMax key or ignored provider configuration was read;
no model calls, real people/content, B2+ or retention-dependent B1.5 were used.

Devices owns enrollment proof hashing/reuse/revocation. Identity owns login,
ticket/session transactions, provider tokens, audit and local-first logout.
Migration 004 adds nullable enrollment hashes without granting legacy proof;
migration 005 adds persisted provider renewal timing. node-pg-migrate owns all
five application migrations. Keycloak owns its separate PostgreSQL database;
only OIDC and admin REST were used, never Keycloak tables.

New enrollment returns a random 256-bit credential once. Reauthentication proves
it belongs to the verified account and is active; no client device ID or hardware
fingerprint is trusted. Session logout preserves enrollment; device revoke
invalidates enrollment and attached sessions. Explicit authenticated new enrollment
is permitted after revocation, including on the same physical hardware. A stolen
enrollment credential plus successful account authentication can reuse enrollment;
OS-protected storage and TLS remain necessary. Revocation cannot permanently block
hardware, recover lost responses or recall exported credentials.

Provider state is introspected on ordinary authorization and redemption without
a positive cache. Active sessions renew provider tokens at most once per minute,
encrypted and issuer/subject/sid bound, without extending backend absolute expiry.
Revocation-only operations use persisted local bearer/account/session/device
checks and remain available during provider outage. An ambiguous provider rotation
followed by DB rollback can require fresh login; no guessed recovery is claimed.

## Environment observed

| Component | Observed version |
| --- | --- |
| Windows PowerShell | 7.6.6 (user terminal) |
| Docker Desktop | 4.72.0 (225998) |
| Docker engine/client | 29.4.2 / API 1.54 |
| Compose | 5.1.3 |
| Docker tools Node / npm | 24.19.0 / 11.17.0 |
| Tools OpenSSL | 3.0.22 |
| Linux kernel | 6.6.114.1-microsoft-standard-WSL2 |
| Application/identity PostgreSQL | 18.4, Debian 18.4-1.pgdg12+1 |
| Test PostgreSQL | embedded-postgres 18.4.0-beta.17, fixture checks server 18.4 |
| Keycloak | 26.8.0 |
| Ingress | Nginx 1.30.0 Alpine |

The reviewed root lockfile is unchanged, SHA-256
`010323b4791acf988feb0142354cd8b2deb405f7285b0d05bf981b4814feb44e`.
The Docker image's npm is 11.17.0, distinct from the prior cloud report's 11.9.0.
`npm ci` installed 135 packages. npm warned about two dependency install scripts;
the final toolchain/PG/esbuild-dependent tests passed without changing the lockfile
or adding an install-script approval. This is a local development image, not a
production release or security/audit certification.

Pinned image digests:

```text
node:24.19.0-bookworm@sha256:4196d66a565c6f195728d9952f161f4adfe2ad753052a08b7ec7f1c5a6bda42b
postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382
nginx:1.30.0-alpine@sha256:0272e4604ed93c1792f03695a033a6e8546840f86e0de20a884bb17d2c924883
quay.io/keycloak/keycloak@sha256:27b3230fbabb8c9ff3c66c864cf09dcd8a41aca82e5100679d109ef0eeb05741
```

## Executed commands and results

All Node dependency installation, schema generation, tests and TypeScript checks
ran inside Docker. Host PowerShell was used for Git, Docker, file editing and the
explicit Windows curl probe only. Secrets travel through ignored files, stdin or
runtime process memory, never command-line values or report output.

| Command | Actual result |
| --- | --- |
| `docker version`; `docker compose version`; `git status --short`; `git branch --show-current`; `git rev-parse HEAD` | Windows checkout/daemon/baseline verified |
| `docker build -t shadows-backend-local:dev .` | PASS; `npm ci --fetch-timeout=30000 --fetch-retries=1 --no-audit --no-fund` in image; later rebuilds passed |
| `docker run --rm --user 1000:1000 --mount "type=bind,source=$PWD,target=/workspace" -w /workspace node:24.19.0-bookworm node docker/bootstrap.mjs` | PASS; generated local secrets, private CA/leaf and synthetic realm/client/user; printed no credentials |
| `docker compose up -d ingress app-db identity-db keycloak` | PASS after readiness correction; separate persistent databases, realm import completed |
| `docker compose run --rm migrate` | PASS; fresh schema and later supported upgrade to migration 005 |
| `docker compose up -d backend` | PASS; healthy, no automatic application migration |
| `docker compose run --rm tools node --import tsx --test tests/integration/enrollment.test.ts tests/integration/provider-status.test.ts tests/integration/migrations.test.ts` | RED first: 2 pass/4 fail for missing credential, duplicate device, missing upgrade column and provider-inactive acceptance; GREEN 6/6 after implementation |
| `docker compose run --rm tools node --import tsx --test tests/integration/provider-status.test.ts` | Outage/local-revocation regression RED (401 instead of 200), then GREEN 2/2 |
| `docker compose run --rm tools node --import tsx --test tests/integration/provider-renewal.test.ts` | RED: 0 renewals instead of 1; GREEN after persisted renewal implementation |
| `docker compose run --rm tools node --import tsx --test tests/integration/startup.test.ts` | Readiness regression RED (200 after DB disconnect), then GREEN 5/5 |
| `docker compose run --rm tools npm run test:keycloak` | Final PASS 1/1; real disposable HTTPS confidential provider, typed protocol refusals, restart and provider logout |
| `docker compose run --rm tools npm run typecheck` | PASS, including Docker TypeScript adapters |
| `docker compose run --rm tools npm test` | Final PASS **41/41**, zero failures/skips, **83.945 seconds** |
| `docker compose run --rm tools npm run schema:generate` | PASS; deterministic OpenAPI/TS, required enrollment, exact refusal literals, bearer annotations, validated fixtures |
| `docker compose run --rm tools npm run schema:check` | PASS; snapshots/negative samples and 4 wire tests |
| `docker compose run --rm tools npm run check:contracts` | PASS; YAML parsing/source/stable symbols/test references |
| `docker compose run --rm tools npm run check:docs` | PASS; repository links/YAML, sibling links explicitly unverified |
| `docker compose run --rm tools npm run check:secrets` | PASS; bounded heuristic scan, zero findings; excludes ignored runtime files |
| `docker compose run --rm tools npm run test:lifecycle` | DEFERRED; observed exit 2, no B1.5 acceptance |
| `docker compose exec -T ingress nginx -t`; `docker compose exec -T ingress nginx -s reload` | PASS; ingress body-limit JSON refusal correction |
| `docker compose run --rm tools node --import tsx docker/stack-journey.ts` | Final PASS; actual persistent Compose stack, detailed observations below |
| `docker compose run --rm tools node --import tsx docker/stack-journey.ts restart-before`; `docker compose restart backend`; `docker compose run --rm tools node --import tsx docker/stack-journey.ts restart-after` | PASS on final backend/migration state; session and enrollment survive process restart |
| `git -c core.safecrlf=false diff --check` | PASS after removing a changed README trailing blank line |
| `curl.exe --fail --silent --show-error --ssl-revoke-best-effort --cacert .local-runtime/tls/ca.pem https://127.0.0.1:8443/health` | PASS from Windows; `status=ok`; certificate/hostname verification enabled, missing-CRL exception limited to this invocation |
| `docker compose ps --format '{{.Service}} {{.State}} {{.Health}}'` | All five development services running/healthy |

### Actual Compose observations

- Confidential login, correct native challenge, one-use return redemption/replay
  refusal, stable enrollment reauthentication, explicit new enrollment and
  independent sessions passed through HTTPS ingress.
- A real refresh grant extended the encrypted refresh token's expiry by one second
  in the final short observation (two seconds in an earlier run), after forcing
  its persisted renewal timestamp due. No provider token was logged. This proves
  renewal/persistence in the local provider; it is not a 30-day soak test.
- Current logout revoked its backend session while another independent provider
  session remained valid; standard RP-initiated browser redirects completed the
  recorded provider callback. Account-wide backend logout revoked all backend
  sessions; it does not claim every provider session on every device ended.
- Device revoke invalidated both sessions on that enrollment while an independent
  enrollment stayed authorized.
- Keycloak admin REST user logout delivered its signed back-channel form to the
  actual configured HTTPS endpoint. `identity_logout_events` increased, the
  targeted backend session's `revoked_at` became non-null, and access returned 401.
  This effect is established independently of introspection denial.
- Disable-only admin update returned 204. The next backend session request returned
  **401 in 18 ms** in the final run (15/21 ms in earlier runs). No additional
  back-channel event was observed during this measured disable/readback interval.
  The test restored the synthetic user and explicitly logged out afterward.
  No claim that disable automatically emits logout, or never emits it later.
- Invalid auth input and oversized ingress body returned typed JSON refusals;
  oversized body is `413 {code:request_invalid}`.

## Failed attempts and review corrections

1. Registry pulls were slow; Keycloak download returned `unexpected EOF`. A retry
   also failed. At the user's request all six owned download clients were stopped;
   the user downloaded the four pinned images, then work resumed. No cloud run.
2. PG fixture initialization on the Windows source bind mount stalled/failed.
   The owned test runner was stopped; test runtime moved to a dedicated Linux
   volume. The next red run completed in 8.506 seconds. Development volumes were
   never deleted or used as disposable test databases.
3. Initial Keycloak health probe did not establish readiness despite a working
   service. Replaced its inline request with a bounded HTTP/1.1 health script;
   provider now becomes healthy after real initialization.
4. First root suite: 34/36. Synthetic discovery lacked the newly required
   introspection endpoint, and Docker could not bind container-only fixture paths.
   Fixed synthetic metadata; disposable provider fixtures now use owned `docker
   create/cp/start` and a declared network namespace, not host-invisible mounts.
5. Additional fixture runs failed readiness with a verified `8080` port collision.
   Assigned independent HTTP, HTTPS and management ports, with local fixture cache.
   One following restart attempt returned 401; the fixture now explicitly probes
   the trusted issuer in the fresh child before session validation. Focused and
   final full-suite fresh-process journeys passed; no production root-cause or
   outage-resilience claim is inferred from that transient attempt.
6. Docker Git secret scan initially failed ownership checks and Linux line-ending
   interpretation. Added bounded per-command `safe.directory`, CRLF and file-mode
   options for the mounted checkout; no global Git configuration was changed.
7. Independent read-only review identified provider idle lifetime not renewed and
   provider outage blocking local logout. Both reproduced RED, then fixed with
   persisted encrypted renewal and explicit revocation-only authentication. The
   final full suite passed 41/41. Review was inspection; reviewer ran no tests.
8. Actual ingress oversized request returned an HTML body. A failing Compose
   journey exposed it; explicit Nginx JSON 413 handler then passed.
9. Initial Windows Schannel curl verification reported unknown revocation status
   because the private CA has no CRL. The documented per-invocation best-effort CRL
   option passed while retaining chain/hostname/expiry verification. No `-k`,
   global verification disable or trust-store modification was used.
10. Automatic review rejected the PowerShell recursive cleanup command with
    `blocked by policy`. A narrower Docker invocation mounted only the test
    directory, verified resolved paths, and removed exactly `pg-cvb5ru` and
    `pg-IFiCAE`. The separate task-owned restart credential file was removed;
    no unrelated filesystem path or development database was deleted. After
    verifying Compose ownership and no remaining container references, only
    `shadows-backend-local_test-runtime` was removed. Tools recreate this disposable
    Linux volume on the next run; development and dependency volumes remain.

## Remaining gates and retained risks

1. Developer must inspect and explicitly trust the generated CA in CurrentUser
   Root using `docker/trust-certificate.ps1`, or configure NYLRA's native TLS stack
   with that CA. This script was **not run**. Machine-wide trust was never installed.
2. Real Windows system browser, originating native listener/verifier, occupied
   ports, secure storage, native restart/logout, trusted UI and actual NYLRA app
   remain unexecuted. Form drivers and Windows curl cannot close those gates.
3. B1.5 retention, deletion/purge/restore/backup expiration; real identities/content;
   B2+ links/Shadows authority/J1/mobile; production TLS/keys/rotation/distributed
   abuse controls/provider terms/deployment remain explicitly deferred.
4. Provider checks and bounded renewal add synchronous provider latency under the
   account lock. Revocation-only operations remain local. Generic 401 can mean
   unavailable provider/DB as well as expiry/revocation, not proof of permanent
   enrollment revoke. No positive provider authorization cache exists.
5. New-enrollment response loss remains one-use: restart login and explicitly enroll
   anew rather than recovering secrets or silently retrying as a new installation.
   Initial/new enrollment rollback is covered by the original login-return SQL
   failure test; reuse rollback has its additional enrollment regression.

Only task-owned disposable fixtures/test artifacts are cleaned. Persistent
development data and dependency volume remain; unrelated containers/volumes are
untouched. No broad prune or destructive reset was performed.

## Changed files

All are local/uncommitted. The lockfile is unchanged.

```text
.gitignore
.gitattributes
.dockerignore
Dockerfile
compose.yaml
README.md
api/auth-v1.d.ts
api/auth-v1.openapi.json
api/auth-v1.fixtures.json
docker/bootstrap.mjs
docker/keycloak-health.sh
docker/keycloak-start.sh
docker/nginx.conf
docker/runtime.ts
docker/stack-journey.ts
docker/trust-certificate.ps1
docs/architecture.md
docs/codebase/README.md
docs/nylra-local-auth-handoff.md
docs/evidence/2026-10-11-local-docker-nylra-readiness.md
docs/superpowers/plans/2026-10-10-backend-initial-plan.md
docs/superpowers/plans/2026-10-11-local-identity-runtime.md
docs/superpowers/specs/2026-10-10-backend-delivery-design.md
migrations/004_device_enrollment.sql
migrations/005_identity_provider_renewal.sql
scripts/check-secrets.ts
scripts/export-auth-schema.ts
src/app/compose.ts
src/app/contract.yaml
src/modules/devices/contract.yaml
src/modules/devices/service.ts
src/modules/devices/store.ts
src/modules/identity/contract.yaml
src/modules/identity/device-registration-port.ts
src/modules/identity/index.ts
src/modules/identity/model.ts
src/modules/identity/oidc-client.ts
src/modules/identity/oidc-port.ts
src/modules/identity/service.ts
src/modules/identity/store.ts
src/platform/database/contract.yaml
src/platform/database/schema.ts
src/transports/http/auth-routes.ts
src/transports/http/auth-schema.ts
src/transports/http/authenticate.ts
src/transports/http/contract.yaml
tests/integration/auth-wire.test.ts
tests/integration/authorization-races.test.ts
tests/integration/enrollment.test.ts
tests/integration/provider-renewal.test.ts
tests/integration/provider-status.test.ts
tests/integration/fixtures/identity.ts
tests/integration/fixtures/keycloak.ts
tests/integration/fixtures/restart-child.ts
tests/integration/fixtures/restart.ts
tests/integration/login-return.test.ts
tests/integration/migrations.test.ts
tests/integration/oidc-client.test.ts
tests/integration/startup.test.ts
tests/journeys/keycloak-login.test.ts
tests/journeys/session-restart.test.ts
tsconfig.json
```

Research supporting provider semantics:
[Keycloak OIDC endpoints](https://www.keycloak.org/securing-apps/oidc-layers),
[Keycloak 26.8 session timeouts](https://www.keycloak.org/docs/26.8.0/server_admin/#_timeouts),
[Keycloak hostname configuration](https://www.keycloak.org/server/hostname).
Those documents support the protocol choices; executed local observations above
are the acceptance evidence.
