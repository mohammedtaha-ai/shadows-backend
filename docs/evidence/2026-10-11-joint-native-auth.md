# Joint native authentication and Docker readiness

Date: 2026-10-11, Asia/Aden. Baseline `2cf8c56`, branch `work`; clean before work.
User authorized implementation, fixes, documentation and local commits in both
repositories. Existing Docker development databases and other projects preserved.

## Correction observed and implemented

Provider outage had returned HTTP 401, conflating unavailable infrastructure with
refused identity. Added `provider_outage_is_retryable_503_without_revoking_session`:
RED 401 versus expected 503, then GREEN after changing IdentityService's catch
boundary. Genuine expiry/revocation/inactive provider stays 401; infrastructure
failure throws a sanitized unavailable outcome and HTTP returns existing
`503 {code:operation_failed}`. The same persisted session validates after provider
recovery. DB-unavailable and renewal-outage tests now assert unavailable, not a
permanent refusal. No token values or raw underlying exceptions are returned.
Revocation-only authentication still permits local surrender during provider outage.

## Executed verification

All backend Node tooling ran in Docker Desktop Linux containers on Windows.

| Command | Result |
| --- | --- |
| Docker Compose service health inventory | Five services running/healthy |
| Targeted new provider-outage regression | RED 401 vs 503, then GREEN |
| Provider-status, renewal and session-lifecycle tests | 9 pass, zero failure |
| `docker compose run --rm tools npm test` | 42/42 pass, zero skips/failures; 104.506 seconds |
| `docker compose run --rm tools npm run typecheck` | PASS |
| `docker compose run --rm tools npm run check:contracts` | PASS |
| `docker compose build backend`; `docker compose up -d backend` | PASS; rebuilt image is running |
| `docker compose run --rm tools node --import tsx docker/stack-journey.ts` | PASS against rebuilt persistent stack |

The actual Compose journey passed login/redemption/enrollment, provider renewal,
current/provider/account-wide logout, device revoke and real signed Keycloak
back-channel delivery. Disable-only next-read returned 401 in 25ms without a new
back-channel event during that interval. This is local evidence, not production/CI.

## NYLRA consumer

The sibling NYLRA Rust module consumes auth-v1 1.1.0, uses the public CA with TLS
verification, captures the real IPv4 return and protects its native session and
enrollment in DPAPI. Its opt-in synthetic form-driver journey passed login, stable
enrollment reuse, session validation from a fresh Windows child process, device
revoke, explicit new enrollment and logout through this Docker stack. Credentials
were read only in runtime memory; no provider/model calls or real user data used.
The browser form driver is not a Windows browser UI acceptance claim.
See [NYLRA evidence](../../../nylra/docs/evidence/2026-10-11-joint-native-auth.md).

With explicit user permission the current public CA was installed in CurrentUser
Root (not LocalMachine); the private key was not inspected. The documented Windows
PowerShell script invocation was refused by execution policy, so Import-Certificate
was invoked directly without changing that policy. Firefox still showed a trust
warning. Computer Use stopped because browser URL policy was unsupported for that
Firefox surface; no alternate UI automation or certificate bypass was performed
by this assistant. The user reported manually bypassing the warning. A bounded
synthetic password was copied to the user's clipboard for manual login, then the
clipboard was cleared. No completed browser login was confirmed. Full clean-browser
and app UI acceptance remains OPEN, with its trigger a real login/restart/logout
run after the browser correctly trusts the local certificate.

## Remaining gates

B1.5 retention/deletion/restore, production issuer/database/key operations, real
identities/content, conversations, links/Shadows authority and deployment remain
unapproved. Native acceptance does not grant Shadows project access. Windows browser
trust and real UI completion are tracked separately from the passing native journey.

Final documentation and protocol checks passed: 22 repository document/YAML files,
current source contracts, generated auth snapshots plus four wire tests and bounded
secret-pattern scan (11 candidate files, zero findings). The compound test reference
initially failed the contract gate and was corrected to its actual regression name.
The later requested UI retry ended when Computer Use reported physical Escape;
no further UI automation was performed. The final native app and five healthy
Docker services remain available. No push or merge was performed.
