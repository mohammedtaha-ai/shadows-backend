# NYLRA local authentication handoff

Date: 2026-10-11, Asia/Aden. Backend owns this protocol; NYLRA owns native browser,
loopback listener, credential storage and UI acceptance. Synthetic identities only.

Contract revision **auth-v1 1.1.0**: [OpenAPI](../api/auth-v1.openapi.json),
[generated TS](../api/auth-v1.d.ts), [safe fixtures](../api/auth-v1.fixtures.json).
Revision 1.1 adds required explicit enrollment intent to return redemption and
an enrollment credential on new enrollment responses. It supersedes the
unintegrated 1.0 return shape. No provider tokens or client secret belong in NYLRA.
Protected operations use the declared HTTP bearer scheme.

## Addresses and trust

| Endpoint | Exact value |
| --- | --- |
| Backend base | `https://127.0.0.1:8443` |
| Issuer | `https://127.0.0.1:8443/realms/shadows-local` |
| Client | `shadows-backend`, confidential, server-side secret |
| OIDC callback | `https://127.0.0.1:8443/v1/auth/callback` |
| Post-logout callback | `https://127.0.0.1:8443/v1/auth/logout-callback` |
| Back-channel logout | `https://127.0.0.1:8443/v1/auth/backchannel-logout` |
| Keycloak console | `https://127.0.0.1:8443/admin/` |
| Health | `https://127.0.0.1:8443/health` |

All advertised addresses are identical inside the shared ingress network namespace
and outside it on Windows. No hosts-file changes are required. The three service
containers share loopback; databases remain separate Compose network services.
Do not replace advertised URLs with `keycloak`, `backend`, `host.docker.internal`
or another issuer. Namespace sharing is local-only; recreate backend/Keycloak/tools
if ingress is recreated. Stopping ingress alone interrupts every advertised route.

Bootstrap generates a private 30-day CA and a leaf for `127.0.0.1`/`localhost` in
ignored `.local-runtime/tls`. Containers trust exactly its public CA; TLS validation
remains enabled. Windows trust is **not installed automatically**. Inspect the
certificate first, then explicitly run from this checkout:

```powershell
powershell -NoProfile -File .\docker\trust-certificate.ps1
```

This adds only that CA to `Cert:\CurrentUser\Root`, not LocalMachine. A local CA
can sign other certificates, so keep its private key private and remove trust with
the same script plus `-Remove` when finished. NYLRA's Rust HTTP stack must consume
the Windows store or explicitly configure this CA; browser trust alone does not
establish native trust. No `NODE_TLS_REJECT_UNAUTHORIZED=0`, insecure TLS flags,
certificate-error bypass or machine-wide installation is required. Regeneration
requires deliberate runtime rotation and replacement of this specific trust entry.

Windows curl uses Schannel and can report unknown revocation status for this
private development CA, which publishes no CRL. A bounded diagnostic is:

```powershell
curl.exe --fail --silent --show-error --ssl-revoke-best-effort --cacert .local-runtime/tls/ca.pem https://127.0.0.1:8443/health
```

This invocation permits missing CRL distribution points only; certificate chain,
hostname and expiry verification remain enabled. It changes no system setting.
It is Windows CLI evidence, not browser or NYLRA acceptance. Native integration
must explicitly accept/configure the development CA using its selected TLS stack;
never copy a global certificate-validation bypass into the client.

## Docker workflow

Use Docker Desktop Linux containers from the existing checkout. No host Node/PG.

```powershell
docker build -t shadows-backend-local:dev .
docker run --rm --user 1000:1000 --mount "type=bind,source=$PWD,target=/workspace" shadows-backend-local:dev node docker/bootstrap.mjs
docker compose up -d ingress app-db identity-db keycloak
docker compose run --rm migrate
docker compose up -d backend
docker compose run --rm tools npm run typecheck
docker compose run --rm tools npm test
docker compose run --rm tools npm run schema:check
docker compose run --rm tools npm run check:contracts
docker compose run --rm tools npm run check:docs
docker compose run --rm tools npm run check:secrets
docker compose run --rm tools node --import tsx docker/stack-journey.ts
```

The image installs the reviewed lockfile with `npm ci`. Tools use the image's
dependency volume and the local source mount. To reinstall tooling after a
lockfile change, run `docker compose run --rm tools npm ci --no-audit --no-fund`.
Rebuild backend after source changes. Migrations are explicit and owned solely by
node-pg-migrate; the backend does not auto-migrate. Keycloak owns identity storage.
Health dependencies order startup; HTTPS/backend health and provider discovery
are checked in acceptance. Database ports are not exposed to Windows.

Development app/identity volumes persist across `docker compose down` and `up`.
Stop with `docker compose stop`; resume with `docker compose start`. Never add
`-v`, prune, or reset to ordinary stop commands. Disposable test PG clusters and
Keycloak fixtures have their own random names and ownership checks; test teardown
removes only those. `.test-runtime` is test-only, never the development DB.
The Compose tools mount `.test-runtime` as a dedicated Linux volume because
PostgreSQL init/fsync on the Windows bind mount is unsuitable. Node 24.19.0's
pinned image currently contains npm 11.17.0; the dependency lockfile is unchanged.

Explicit restart acceptance:

```powershell
docker compose run --rm tools node --import tsx docker/stack-journey.ts restart-before
docker compose restart backend
docker compose run --rm tools node --import tsx docker/stack-journey.ts restart-after
```

Bootstrap provisions only `synthetic-user` in `shadows-local` and `local-admin`
in `master`. Random passwords, client secret, database credentials and token key
are written to ignored runtime files and never printed. Bootstrap preserves an
already initialized runtime. Realm import occurs only for a missing realm;
it does not overwrite existing users/configuration on restart. For manual login,
the developer can load `user-password` into their clipboard locally, paste it
only into the Keycloak system-browser password field, then clear the clipboard.
Do not send credentials to chat, reports, screenshots or terminal output.
Never use real people or real project data in this runtime.

Ordinary session validation/device listing and return redemption check provider
refresh-token activity without a positive cache. Active sessions periodically
renew provider tokens (at most once per minute), stored encrypted and bound to
the same issuer/subject/provider sid. Renewal preserves backend absolute expiry.
Provider failure refuses ordinary access; explicit local logout/device revoke
can still surrender authority using a locally valid bearer. Provider disable
alone is not claimed to emit logout or permanently revoke a backend session.
Permanent revocation needs an explicit logout/revoke. A refresh-token rotation
followed by failed DB persistence can require fresh login; no guessed retry or
restoration of revoked authority occurs.

## Native sequences

1. Bind an application-controlled IPv4 listener on an available port >=1024,
   fixed path `/oidc-return`. Generate a 32-byte random base64url return verifier;
   send its SHA-256/base64url challenge and the exact listener URI to
   `POST /v1/auth/login`. Keep verifier in native memory. Open `authorizationUrl`
   in the system browser, not the webview.
2. Accept only the expected listener return. Provider redirects through the
   exact backend callback; native receives a 60-second one-use `ticket`. POST
   `/v1/auth/return` with ticket, verifier, and `enrollment:{mode:'new'}` for an
   explicit first/new enrollment. New enrollment returns `enrollmentCredential`
   once, plus `handle`, principal and expiry. Store the enrollment credential and
   session handle independently in OS-protected storage; expose neither to React.
3. Reauthentication repeats browser login and redemption using
   `enrollment:{mode:'reuse',credential:<stored credential>}`. It preserves
   deviceId and produces a fresh sessionId/handle. It does not return another
   enrollment credential. Preserve the existing credential. No client deviceId
   is submitted. `return_refused` is intentionally indistinguishable for bad,
   foreign, legacy or revoked proof; never automatically retry as new enrollment.
4. Use `Authorization: Bearer <handle>` for GET `/v1/auth/session`, GET
   `/v1/devices`, DELETE `/v1/devices/:deviceId`, POST `/v1/auth/logout` and POST
   `/v1/auth/logout-all` (logout bodies `{}`). Persisted account/session/device
   checks run on every operation. A restart reuses the session only after session
   validation; a refused session requires login, not trust in cached account IDs.
   `401 unauthorized` is generic and may mean expiry, revocation or unavailable
   database/provider state; it does not prove permanent enrollment revocation.
   Preserve enrollment proof unless the user explicitly clears/replaces it.
5. Session logout preserves enrollment for future login. Device revoke invalidates
   its enrollment and every attached session. Show explicit new enrollment as a
   separate action after authentication; revocation does not block physical hardware.
   Lost enrollment proof requires explicit new enrollment. Lost return responses
   require fresh login because ticket replay always refuses.
6. Logout returns `local:'revoked',provider:'pending'` and possibly a bounded
   backend `browserLogoutUrl`. Clear the session handle locally. Open this URL in
   the system browser to complete provider logout; only a verified one-use callback
   records completion. A failed handoff allows at most three explicit attempts
   within 60 seconds; expiration requires fresh authentication. Local credentials
   cleared, backend revoked, and provider pending are distinct UI states. Account
   logout revokes all backend sessions; it does not claim every provider session
   on every device ended. Do not call back-channel logout from the client.

## Remaining gates

Read the dated local acceptance report before treating any checks as passed.
Windows certificate trust, system-browser/native return, occupied-port handling,
secure storage/restart/logout and the actual NYLRA app remain independent gates.
This handoff does not implement NYLRA's adapter. B1.5 retention/deletion/restore,
real identities/content, B2+ authority/linking and production deployment remain
deferred under their owner specifications.
