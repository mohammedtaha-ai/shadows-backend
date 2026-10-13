# B0 closure follow-up — local checkpoint and cloud continuation

Probe sources and raw artifacts named here were removed from the tree on
2026-10-13; `git show db27eb5:<path>` retrieves any of them.

## Retained local checkpoint — historical observations

Date: 2026-10-11, Asia/Aden. Starting revision:
`166cf7539a0919523b5e4425f83e41238df3509b`, branch `main`, clean worktree.
The user stopped local experiments after two interrupted image downloads and
requested a commit/push so work can continue in the cloud. This is a checkpoint,
not completed B0 closure. Retention proposals and the detailed B1 plan have not
been written. B1 and later tasks remain unstarted.

Existing evidence is reused: [original B0](2026-10-10-backend-capability-probes.md)
and [MiniMax supplement](2026-10-11-minimax-provider-probe.md). Passed HTTP, schema,
migration, queue and earlier synthetic fault/invalid-tool cases were not rerun.
No running Shadows service, existing database or sibling repository was changed.

## Environment, sources and limits

Executed Node 24.15.0, npm 11.12.1, Docker client/server 29.4.2, Docker Linux/x86_64,
and PostgreSQL 18.4 Windows/x64 via embedded-postgres 18.4.0-beta.17. The unchanged
probe lockfile pins AI SDK 6.0.303, OpenAI adapter 3.0.125, openid-client 6.8.8,
oidc-provider 9.12.2, pg 8.23.1 and zod 4.6.5; licenses/other versions are recorded
in the original evidence. jose 6.2.12 (MIT) was inspected as a possible future
verification dependency, not adopted or newly tested.

Keycloak 26.8.0 is the [current official release](https://www.keycloak.org/downloads.html).
The exact image requested was `quay.io/keycloak/keycloak:26.8.0`. Neither pull
completed, so **no Keycloak runtime version or behavioral result was observed**.
First error: expected 173773755 bytes, received 47459550, unexpected EOF.
Second error: expected 87520170 bytes, received 40551640, unexpected EOF.
These are image-transfer failures, not PostgreSQL or identity-library failures.
No further pull was attempted after the user's stop request.

Official sources consulted:

- [Keycloak Docker setup](https://www.keycloak.org/getting-started/getting-started-docker),
  [OIDC endpoints](https://www.keycloak.org/securing-apps/oidc-layers),
  [session/client administration](https://www.keycloak.org/docs/latest/server_admin/index.html),
  and [database configuration](https://www.keycloak.org/server/db).
- [ZITADEL native applications](https://zitadel.com/docs/guides/manage/console/applications-overview),
  [production setup](https://zitadel.com/docs/self-hosting/manage/production), and
  [session deletion API](https://zitadel.com/docs/reference/api/session/zitadel.session.v2.SessionService.DeleteSession).
- [MiniMax OpenAI compatibility](https://platform.minimax.io/docs/api-reference/text-openai-api),
  [multi-round tool/reasoning guide](https://platform.minimax.io/docs/guides/text-m3-function-call),
  [AI SDK integration](https://platform.minimax.io/docs/api-reference/text-ai-sdk),
  and [AI SDK tool steps](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling).
- [Native OAuth RFC 8252](https://www.rfc-editor.org/info/rfc8252/),
  [Tauri opener](https://v2.tauri.app/plugin/opener/),
  [Flutter AppAuth](https://pub.dev/packages/flutter_appauth), and
  [back-channel logout](https://openid.net/specs/openid-connect-backchannel-1_0.html).

Only two identity solutions were considered: Keycloak and ZITADEL. Both document
public native authorization-code/PKCE integration and session management. The
preliminary recommendation is self-hosted Keycloak with generic openid-client,
not its deprecated Node adapter. It offers explicit realm/client/session controls
but adds Java/container operation, upgrades, TLS, identity database and recovery
work. ZITADEL offers native/Tauri/mobile configuration and session APIs, with
either managed-account dependency or its own self-hosted operational components.
No ZITADEL account/tenant was created or tested. This recommendation is **not an
adoption decision**: Keycloak server acceptance, native integration and operational
review remain open. Neither provider owns Shadows project authorization.

## Observed experiments

| Experiment | Expected | Observed | Status |
| --- | --- | --- | --- |
| Wrong state | Client refuses foreign state | OAUTH_INVALID_RESPONSE | PASS, synthetic issuer |
| Wrong PKCE verifier | Provider refuses token exchange | invalid_grant / OAUTH_RESPONSE_BODY_ERROR | PASS, synthetic issuer |
| Wrong nonce | Validated ID token with foreign nonce refused | OAUTH_JWT_CLAIM_COMPARISON_FAILED | PASS, synthetic issuer |
| Reused code | Second code exchange refused | Fresh-flow code exchange followed by refused replay | PASS, synthetic issuer |
| One-time return bookkeeping | Unknown, expired or reused return refused | All three refusals asserted | PASS, in-memory prototype only |
| Backend device/session lifecycle | Persisted state survives fresh verifier processes; revoked/expired credentials denied | Revoked device denied, other device allowed, foreign-account revoke refused, expired session denied | PASS, disposable PG prototype |
| Keycloak login/logout/expiry/restart | Real maintained server behavior | Pinned image unavailable after two incomplete pulls; preflight blocks execution | BLOCKED |
| System-browser/native return | Actual Tauri/Windows login callback | CUA inventory only in-app browser/MCP Apps; no native app surface | BLOCKED |
| Initial MiniMax tool continuity | Real tool and next round | Tool executed and result sent; initial prompt also supplied the expected value, so semantic result-use proof was too weak | Partial evidence; corrected below |
| Corrected non-reasoning continuity | Final answer uses value absent from initial prompt | Runtime-random fixture matched; one execution, two rounds, stop | PASS, real provider |
| Corrected reasoning continuity | Preserve assistant reasoning and tool result across rounds | Think-tag content preserved with reasoning_split=false; runtime-random fixture matched; two rounds, stop | PASS, real provider, this format only |
| Later-round cancellation | Retain partial text and truthful aborted outcome | Third request after initial tool round trip retained 11 characters; abort event; terminal metadata access rejected | PASS client behavior; reused initial evidence |

The issuer binding cases use maintained oidc-provider with a synthetic account,
automatic fixture consent, development keys and in-memory provider sessions.
They are not Keycloak, a real user's login or native-device acceptance. Existing
expiry/logout/token-revocation tests remain the prior synthetic evidence.
The new device prototype stores only hashed random session handles in a dedicated
database, starts fresh verifier processes and checks persisted revocation state.
This proves proposed SQL policy mechanics, **not an implemented backend service**.
Provider-token revocation is distinct from backend device/session revocation.

MiniMax used the authorized root `.env` API_KEY only at runtime, with no other
credential source. The user explicitly waived the unavailable aws-secrets-manager
skill for these B0 calls only; no AWS Secrets Manager access occurred. Only bounded
synthetic prompts went to `https://api.minimax.io/v1/chat/completions`, requested
model MiniMax-M3. No raw response text, reasoning, headers, requests or SDK errors
were saved. The returned model identity was not independently verified.

Nine new provider requests total: five in the initial attempt, then four targeted
continuity requests after fixing the semantic-proof flaw. Each request capped
output at 768 tokens, input at 32768 serialized bytes, automatic retries at zero;
each flow at 60 seconds and each invocation at 180 seconds. Initial invocation
cap was five calls; `--continuity-only` caps at four. A rerun is another bounded
invocation and spends more calls. No invalid-tool or fault calls were repeated.
Corrected non-reasoning reported 721 input/34 output tokens, 7548 ms; corrected
reasoning reported 780 input/79 output tokens, 2728 ms. Cancelled-call usage is
unavailable, so no spending total is inferred. Client abort does not prove stopped
provider computation or billing.

Content and tool-call identity/name/parsed input are checked before reasoning
follow-up; argument whitespace normalization is allowed. No separate
reasoning_content/reasoning_details fields were observed in this format. Their
preservation with reasoning_split=true remains untested. The initial strict
serialized-assistant comparison was false for non-reasoning; raw serialized
arguments can differ from the SDK's JSON-normalized arguments. The corrected
comparison checks parsed tool inputs and exact assistant content, rather than
claiming identical serialized JSON. Initial source/results are retained.

## Reproduction and artifacts

From the repository checkout:

```sh
cd probes/b0-2026-10-10
npm ci --fetch-timeout=30000 --fetch-retries=1
node identity-bindings.mjs
node identity-devices.mjs
docker pull quay.io/keycloak/keycloak:26.8.0
node identity-keycloak.mjs
# Optional real-provider continuation only with separately authorized runtime config:
node minimax-rounds.mjs --continuity-only
node followup-checks.mjs
```

No cloud runner was executed here. New cleanup guards resolve relative to this
dedicated probe directory on Windows/Linux; cross-platform execution is unverified.
Embedded PostgreSQL requires a non-root Unix process; do not enable host user
creation to work around that. Docker must exist for Keycloak. The Keycloak fixture
uses loopback 45901, Node return listener 45903, a uniquely named/labelled container,
1 GiB/2 CPU bounds and a generated synthetic realm/user under ignored runtime
files. Its intended restart test uses development H2, not production PostgreSQL.
Synthetic OIDC uses 45905, with 45906 as registered callback URI; device PostgreSQL
uses 45904 and database b0_identity_followup. Existing databases are never consumed.

- Binding probe (`probes/b0-2026-10-10/identity-bindings.mjs` at `db27eb5`) and
  results (`probes/b0-2026-10-10/followup-artifacts/identity-bindings-results.json` at `db27eb5`).
- Device probe (`probes/b0-2026-10-10/identity-devices.mjs` at `db27eb5`),
  policy fixture (`probes/b0-2026-10-10/identity-device-fixture.mjs` at `db27eb5`),
  fresh-process verifier (`probes/b0-2026-10-10/identity-device-child.mjs` at `db27eb5`), and
  results (`probes/b0-2026-10-10/followup-artifacts/identity-devices-results.json` at `db27eb5`).
- Unexecuted Keycloak behavioral reproduction (`probes/b0-2026-10-10/identity-keycloak.mjs` at `db27eb5`)
  and blocked preflight (`probes/b0-2026-10-10/followup-artifacts/identity-keycloak-results.json` at `db27eb5`).
- MiniMax source (`probes/b0-2026-10-10/minimax-rounds.mjs` at `db27eb5`),
  corrected continuity (`probes/b0-2026-10-10/followup-artifacts/minimax-rounds-results.json` at `db27eb5`),
  initial results including cancellation (`probes/b0-2026-10-10/followup-artifacts/minimax-rounds-initial-results.json` at `db27eb5`),
  and initial source snapshot (`probes/b0-2026-10-10/followup-artifacts/minimax-rounds-initial-source.txt` at `db27eb5`).
- Focused static/link/YAML/secret checks and provenance (`probes/b0-2026-10-10/followup-artifacts/checks.json` at `db27eb5`).

Executed focused checks: seven new JavaScript syntax checks, two YAML parsings,
83 local Markdown target/anchor checks, and literal comparison of 21 candidate
files against the runtime-only known key plus token-pattern checks: no matches.
`git diff --check` passed. Secret scanning is not a general security audit.
The independent binding/device tests and nine provider requests above are the
only new behavioral experiments; previous passed experiments were reused.

## Closure status and cloud handoff

Now established within observed limits: negative protocol bindings, backend-owned
device/session persistence/revocation mechanics, actual MiniMax tool-result round
trip with semantic use, think-tag reasoning continuity and later-round client abort.
The Keycloak recommendation remains conditional. B0 is not fully closed and B1
is not ready for unconditional execution.

The cloud continuation must:

1. Complete the isolated Keycloak server cases once the pinned image is available.
   Obtain actual native/system-browser access or retain its exact blocker. Do not
   infer native acceptance from the Node HTTP driver or in-app browser.
2. Finish the at-most-two-solution identity recommendation, selected issuer/client
   boundaries, persistent sessions, logout and device revocation. Keep real and
   synthetic evidence distinct; do not invent Shadows authorization in TypeScript.
3. Propose concrete conversation, scoped evidence/derived cache, personal memory,
   deletion/backup/audit and revocation defaults in architecture sections 5/13.
   Mark every policy as proposed for user review; no policy has been approved here.
4. Amend specification/initial plan from evidence and prepare exact B1 files,
   interfaces, pinned versions, migrations, tests/commands and acceptance conditions.
   Identify all tasks conditional on identity, native or retention decisions.
5. Keep NYLRA/Shadows edits as proposals, preserve reproducible source, check secrets,
   YAML and links, and report actual readiness. Do not implement B1 or deploy.

The `.env` key is ignored and must not be committed or pasted into a cloud prompt.
Real-provider calls in another environment require separately authorized runtime
configuration. Continuing identity/docs work does not require that key. User
decisions still needed: identity deployment choice/operations, lifecycle defaults
after they are drafted, and native-client acceptance availability. The user has
authorized this checkpoint's commit/push; that is not deployment authorization.

## Cloud continuation — 2026-10-11, Asia/Aden

Scope: finish B0 evidence/recommendations and prepare the conditional B1 plan.
**B0 partially verified; B1 and later tasks UNSTARTED.** The preceding checkpoint
is preserved as historical Windows evidence; its blocked Keycloak and unwritten
policy/plan statements do not describe this cloud continuation. No historical
artifact was overwritten, including the initial weak semantic-proof MiniMax
attempt and its producing source snapshot.

### Baseline, environment and isolation

- Cloud checkout: `/workspace/shadows-backend`, repository
  `mohammedtaha-ai/shadows-backend`, branch `work`.
- Verified `git rev-parse HEAD` = `1b334c5968ed9014e7f53136672f2af1c34b73a3`;
  initial `git status --short` was empty. No unrelated changes existed or were
  discarded. Initial git commands at `/workspace` reported “not a git repository”;
  corrected to the checkout before any edits. HEAD/branch were not changed.
- Read AGENTS, README, architecture, source structure, contracts/template, delivery
  design/initial plan, all three evidence reports, probe README, retained follow-up
  artifacts and their producing binding/device/Keycloak/MiniMax/check sources.
- Runtime: Node 24.19.0, npm 11.9.0, Debian 13 Linux x86_64, kernel 6.18.44,
  task UID 1000; Docker client/server 28.4.0, vfs. The explicit managed
  `/var/run/docker.sock` preflight succeeded with zero containers/images.
  No daemon restart or host-user creation was needed. Probe lockfile was unchanged;
  installed 202 packages with `npm ci --ignore-scripts` for Node-only probes/checks.
- Runtime image reports Keycloak 26.8.0, JVM 21.0.12.1 / OpenJDK
  21.0.12.1+1-LTS. Pinned pull digest:
  `sha256:27b3230fbabb8c9ff3c66c864cf09dcd8a41aca82e5100679d109ef0eeb05741`.
  Runtime/provenance artifact (`probes/b0-2026-10-10/followup-artifacts/cloud-runtime.json` at `db27eb5`)
  records versions and hashes of preserved evidence.
- Environment readiness reports current/enforced restricted HTTP policy,
  package-manager/registry access and MiniMax endpoint access, no VPN and no TCP
  grants. Read the non-secret policy snapshot and networking/Docker guidance;
  preserved configured proxy/CA trust. Official docs were read through the web tool,
  not by bypassing the executor's destination policy.
- Keycloak used uniquely named labelled containers, generated synthetic account
  `b0-user`, realm `b0-followup`, development H2 inside that container, loopback
  45901/45903, 1 GiB/2 CPU bounds, 90-second readiness, 15-second HTTP bounds and
  at most 20 redirects per authorization. Credentials/tokens/forms/cookies stayed
  runtime-only. Cleanup removed the owned containers and `.identity-runtime/`;
  the post-run label inventory was empty. The downloaded image remains reproducible.
  No existing service/database, sibling repository, external account or paid resource
  was changed/created. No deployment, commit, push or PR occurred.

### Cloud observations matrix

| Case | Expected | Observed | Status / limit |
| --- | --- | --- | --- |
| Docker preflight / pinned image | Managed daemon and image available before fixture | Local socket healthy; one cloud pull completed within its 180-second bound | PASS; local unexpected-EOF attempts remain historical |
| Valid login | Synthetic account code exchange and bound one-use return | Subject present; first Node callback 200, replay 400 | PASS, Keycloak HTTP driver, not native browser |
| Wrong state | RP refuses foreign state before code exchange | ClientError / OAUTH_INVALID_RESPONSE | PASS, typed cloud refusal |
| Wrong PKCE verifier | Keycloak token endpoint refuses exchange | ResponseBodyError / OAUTH_RESPONSE_BODY_ERROR / invalid_grant | PASS, typed cloud refusal |
| Wrong nonce | RP refuses mismatched validated ID-token nonce | ClientError / OAUTH_JWT_CLAIM_COMPARISON_FAILED | PASS, typed cloud refusal |
| Reused code | First exchange succeeds; second refused | OAUTH_RESPONSE_BODY_ERROR / invalid_grant | PASS, typed cloud refusal |
| Access-token expiry | Userinfo works before expiry; refuses after expiry | Five-second access lifetime; after 6500 ms, OAUTH_WWW_AUTHENTICATE_CHALLENGE | PASS; this is provider access expiry, not backend expiry |
| Persisted-session restart | Fresh refresh succeeds after server process restart | Refresh accepted after restart of same isolated container | PASS, H2 development persistence only |
| Refresh-token revocation | Revoked provider refresh can no longer refresh | OAUTH_RESPONSE_BODY_ERROR / invalid_grant | PASS; backend handle/device trust is separate |
| Logout | RP-initiated provider logout prevents silent login | New prompt=none returns login_required | PASS, HTTP cookie jar only |
| Windows system browser / native return | Actual Tauri app opens browser, binds return, protects credential and resumes after restart | Linux cloud container; no Windows OS, NYLRA checkout/Tauri build, browser/native control surface, Wine/PowerShell/Flutter/cargo or real-device harness available | BLOCKED; exact external prerequisite |
| Runtime API_KEY loading | Inherited value skips local .env, local fallback optional, missing/error sanitized | Three configuration-only tests pass with synthetic values and injected loader | PASS; zero provider requests |
| Content defaults / B1 plan | Concrete reviewable proposals with explicit gates | Owner section 5 amended; conditional B1.0–B1.5 files/interfaces/migrations/tests/commands prepared | PREPARED FOR REVIEW; policies unapproved, B1 UNSTARTED |

The first cloud run passed nine cases. Inspection then found that broad
`assert.rejects` allowed network/programming failures to count as negative passes.
The producing probe now compares exact expected protocol codes, and for
verifier/code/refresh rejects also requires `invalid_grant`. Only the six refusal
cases were repeated with `--refusals-only` using a fresh disposable server
and a fresh authorization flow per case. They all passed. No login/logout/restart, synthetic binding/device,
HTTP/SQL/job or MiniMax case was repeated without a changed assertion or unresolved
concern. These are nine case results plus six strengthened checks, not fifteen
independent capabilities or a product test suite.

Artifacts remain separate:

- First cloud Keycloak results (`probes/b0-2026-10-10/followup-artifacts/identity-keycloak-cloud-results.json` at `db27eb5`)
  and typed refusal results (`probes/b0-2026-10-10/followup-artifacts/identity-keycloak-cloud-refusals-results.json` at `db27eb5`),
  produced by Keycloak probe (`probes/b0-2026-10-10/identity-keycloak.mjs` at `db27eb5`).
- Local synthetic binding results (`probes/b0-2026-10-10/followup-artifacts/identity-bindings-results.json` at `db27eb5`)
  and device SQL prototype (`probes/b0-2026-10-10/followup-artifacts/identity-devices-results.json` at `db27eb5`)
  were reused unchanged. Neither is Keycloak or a product authentication service.
- Runtime loader (`probes/b0-2026-10-10/runtime-api-key.mjs` at `db27eb5`),
  configuration-only tests (`probes/b0-2026-10-10/runtime-api-key.test.mjs` at `db27eb5`) and
  cloud checks (`probes/b0-2026-10-10/followup-artifacts/cloud-checks.json` at `db27eb5`)
  retain the source and focused validation provenance.

### Cloud identity recommendation

Compare only Keycloak and ZITADEL. Recommend **self-hosted Keycloak 26.8.0 with
openid-client 6.8.8, conditional on user operations/flow review and native acceptance**.
This is evidence-backed preference, not adoption or production readiness. Its
isolated server tests now support the required flow controls and development
persistence. No ZITADEL tenant/account was created and no ZITADEL version/runtime
was tested; no invented benchmark or cost comparison ranks it.

| Concern | Keycloak | ZITADEL | Implication for this backend |
| --- | --- | --- | --- |
| Operations | Self-hosted Java/container, TLS/hostname/admin isolation, identity DB, upgrades, backup/restore and session/cache operation | Managed service reduces server-operation work but adds provider/account/region/contract dependence; self-hosted service still needs PostgreSQL, init/setup/upgrades, keys and HTTP/2-aware proxy | Accept a named operations owner and restore/key-rotation evidence; no deployment selected here |
| Windows Tauri | Standard code/S256 and explicit client policies; native browser/loopback protection belongs to NYLRA | Official native application docs explicitly include Tauri and PKCE/custom return URIs | Both fit documented standards; neither docs nor this HTTP fixture proves Windows acceptance |
| Later Flutter | Standard OIDC works with native AppAuth integration; redirect registration/OS secure store must be tested on phones | Native mobile/desktop PKCE documented; platform return registration still needed | Keep external browser and app-owned return verifier; no Flutter library version or real-device acceptance is selected by B0 |
| Node integration | Generic openid-client discovery/exchange/revoke/logout; avoid deprecated provider-specific Node adapter | Generic OIDC plus documented API introspection and Session v2 termination | Proposed Node relying party owns binding and internal account mapping; provider-specific admin APIs remain isolated |
| Session/revocation | Persistent sessions enabled by default; server revocation and RP logout tested narrowly | DeleteSession invalidates that session/token; introspection can validate provider tokens | Neither provider automatically revokes a backend-owned device/session or grants Shadows project authority |

Official sources inspected on 2026-10-11 (living/latest docs are design references,
not proof that every described feature exists in the pinned runtime):

- [Keycloak 26.8.0 release](https://www.keycloak.org/2026/10/keycloak-2680-released)
  and [OIDC endpoints](https://www.keycloak.org/securing-apps/oidc-layers):
  discovery, code, refresh, revocation and standard RP-initiated logout.
- [Keycloak administration](https://www.keycloak.org/docs/latest/server_admin/index.html):
  S256 client enforcement, client/session policies; and
  [session persistence/cache](https://www.keycloak.org/server/caching): persisted
  sessions versus deprecated volatile sessions. The fixture did not test clustering.
- [Keycloak production configuration](https://www.keycloak.org/server/configuration-production)
  and [database guide](https://www.keycloak.org/server/db): TLS/admin boundary and
  production DB requirement; development dev-file is not production storage.
- [ZITADEL application types](https://zitadel.com/docs/guides/manage/console/applications-overview):
  native Tauri/mobile code+PKCE and registered return URIs;
  [production setup](https://zitadel.com/docs/self-hosting/manage/production):
  HA/configuration, HTTP/2 proxy and PostgreSQL/event-source recovery work.
- [ZITADEL session termination](https://zitadel.com/docs/reference/api/session/zitadel.session.v2.SessionService.DeleteSession)
  and [introspection](https://zitadel.com/docs/guides/integrate/token-introspection):
  provider session/token controls, not backend device policy.
- [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html),
  [Tauri opener](https://v2.tauri.app/plugin/opener/),
  [Flutter AppAuth](https://pub.dev/packages/flutter_appauth) and
  [openid-client](https://github.com/panva/openid-client) establish integration
  building blocks, not actual NYLRA acceptance.

Decision: propose a confidential backend OIDC client with fixed HTTPS callback;
Node owns state/nonce/S256 exchange, native code opens the browser and redeems a
one-use backend ticket bound to its own challenge. Clients receive only backend
credentials, with internal `(issuer, subject)` account mapping. This avoids
provider refresh tokens in clients but makes backend login availability and
encrypted token custody operational responsibilities. Direct public-native OIDC
remains viable for either provider but would put token storage/refresh/validation
on each native client and require a different backend exchange boundary. The
chosen proposal differs from the measured public-client fixture and is explicitly
gated before B1, with exact interfaces in the amended delivery spec.

Provider refresh-token revocation, provider SSO logout, signed back-channel logout,
backend session revoke, backend device revoke and Shadows grant revoke are distinct.
Only the first two were exercised with Keycloak here; wrong state/nonce validate
the relying party. Backend revoke mechanics are retained SQL prototype evidence.
B1 must build/test its real declared operations; Shadows remains its own authority.
Keycloak back-channel signatures/key rotation and production PostgreSQL restore
remain untested. No result authorizes copying fixture consent, H2, development
keys, password-form driver or SQL prototype into product implementation.

### MiniMax evidence and secret safety in cloud

Reused the corrected runtime-random fixture results and retained later-round client
abort. **Zero additional MiniMax calls**, tokens or paid provider resources were
requested in this continuation. reasoning_split=true remains untested. The tested
format is think-tag assistant content with reasoning_split=false; no separate
reasoning metadata preservation claim is made. Client abort still does not prove
stopped provider computation or billing, and returned model identity was not verified.

Both opt-in probes now prefer `process.env.API_KEY`, accepting a Network-secret
proxy placeholder without format validation, and load the optional local root
`.env` only when it is absent. No `.env` was required, created or read in this
cloud continuation. Environment readiness exposes **MINIMAX_API_KEY** as the ready
binding, rather than the request's possible API_KEY binding; it was not aliased or
used for a call. Future calls require configured API_KEY, a concrete unresolved
requirement, synthetic prompts and explicit bounds before execution. The current
probes retain their per-request/flow/token/call bounds and zero automatic retries.
No aws-secrets-manager skill was available; the user's runtime-only B0 exemption
applies to these MiniMax probes only. No AWS or other credential source was accessed.

The loader tests use injected synthetic values, never the live credential. Secret
checks compare known inherited runtime values in memory plus bearer/JWT patterns
across tracked/untracked candidate files; output only match counts. No key,
placeholder, headers, request configuration, provider response text/reasoning or
raw provider error was printed/saved. Existing response observations contain only
safe aggregate facts and asserted protocol error codes, not raw error bodies.

### Commands, checks and unsuccessful attempts

Commands actually run in cloud (from the checkout unless noted):

```sh
git rev-parse HEAD
git status --short
git branch --show-current
node --version
npm --version
uname -sm
id -u
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock info
timeout 180 env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock pull quay.io/keycloak/keycloak:26.8.0
# In probes/b0-2026-10-10:
npm ci --fetch-timeout=30000 --fetch-retries=1 --ignore-scripts
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH node identity-keycloak.mjs --cloud
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH node identity-keycloak.mjs --cloud --refusals-only
node --test runtime-api-key.test.mjs
node cloud-provenance.mjs
node followup-checks.mjs --cloud
# Separate image version check, no network:
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock run --rm --network none quay.io/keycloak/keycloak:26.8.0 --version
# Post-run owned-resource inventory, then root diff validation:
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock ps -a --filter label=shadows.b0.followup=2026-10-11 --format '{{.Names}}'
git diff --check
```

The first web-tool query used unsupported `search_query` and returned an error;
corrected to supported direct `open`/`find` calls. Guessed ZITADEL `/login/tauri`
and `/login/mobile`, and Keycloak `/server/production` URLs were inaccessible;
used the successful official application types and production-configuration
pages above. One later documentation-edit command used the probe directory as
its working directory and failed before any write; corrected to the repository
root. Its subsequent configuration/static checks passed; no behavioral experiment
was repeated because of that path error. These access attempts are not provider/runtime failures. Unlike
Windows, the single cloud image download succeeded; there was no automatic pull
retry and no MiniMax retry/call.

Focused validation and final changed-file inventory are recorded below after
verification. Repository-local documentation links and YAML are checked; absent
NYLRA/Shadows sibling targets are reported as external prerequisites, not silently
claimed valid. No remote CI, product tests, full probe rerun or native tests ran.

### Decisions and remaining prerequisites

Closed within scope: pinned-image availability; Keycloak server login, typed
negative bindings, access expiry, refresh revocation, HTTP logout and H2 restart;
runtime API_KEY loader compatibility; concrete owner policy proposals and
conditional B1 plan preparation. Reused closed scoped MiniMax/SQL/HTTP/job evidence.

Still OPEN: Windows native/system-browser/secure-store acceptance; joint acceptance
of confidential backend/native-ticket flow; identity operational owner, dedicated
PostgreSQL/TLS/key rotation/recovery; actual B1 authorization/device service;
user policy approval; provider retention/deletion terms and physical backup purge;
later source-dependent deletion/invalidation; rich J1 TS/Dart and real Shadows
context/authority. No policy OPEN or full B0 gate was silently closed.

Precise user decisions requested for review (no implementation authorization assumed):

1. Accept self-hosted Keycloak and its operational ownership, or choose ZITADEL
   with the same isolated acceptance requirements. Accept/amend the proposed
   confidential-backend/native-return-ticket boundary and session/logout defaults.
2. Accept/amend architecture section 5's content lifecycle table, especially
   conversation/evidence/derived deadlines, opt-in personal memory, live deletion,
   backup expiry/restore and minimal audit metadata. Provider terms remain a separate
   unresolved condition; a backend policy cannot promise a vendor's deletion.
3. Provide a Windows NYLRA native acceptance environment/owner and joint review of
   the return/secure-storage flow. Review the B1 plan before separately authorizing
   its execution; this request ends with B1 UNSTARTED.

### Final cloud validation and changed files

- Keycloak full run: nine passing cases, exit zero. Changed negative-assertion
  follow-up: six passing typed refusal cases, exit zero. No automatic MiniMax
  call or rerun; all provider evidence was reused.
- `node --test runtime-api-key.test.mjs`: three tests, three pass, zero failures.
  The configuration-only tests were repeated after the final documentation review;
  no real provider/network resource was involved.
- `node cloud-provenance.mjs`: seven retained follow-up artifacts match baseline
  byte-for-byte; probe lockfile unchanged, 21 exact installed package versions
  recorded. No product package or dependencies were created.
- `node followup-checks.mjs --cloud`: seven changed/new JavaScript syntax checks
  pass; two YAML files parse; 85 repository-local Markdown targets/anchors resolve;
  zero broken repository-local links. Nine absent sibling links are separately
  enumerated in cloud-checks.json and remain unverified external dependencies.
  Literal comparison against inherited runtime credentials/placeholders plus
  token-pattern checks scanned 73 tracked/untracked files: zero matches. Only
  counts were displayed; this is not a general security audit.
- `git diff --check`: pass. Final HEAD remains the requested commit on branch
  `work`; owned-container inventory and runtime cleanup checks pass. No product
  source or B1 migration was created, and no remote CI/native acceptance ran.

Changed tracked files (10): `docs/architecture.md`, this report,
`docs/superpowers/specs/2026-10-10-backend-delivery-design.md`,
`docs/superpowers/plans/2026-10-10-backend-initial-plan.md`,
`probes/b0-2026-10-10/README.md`, `ai-minimax.mjs`, `minimax-rounds.mjs`,
`identity-keycloak.mjs`, `followup-checks.mjs` and `contract.yaml` in that probe
folder. New retained files (7): `runtime-api-key.mjs`, `runtime-api-key.test.mjs`,
`cloud-provenance.mjs`, and `followup-artifacts/cloud-runtime.json`,
`cloud-checks.json`, `identity-keycloak-cloud-results.json`,
`identity-keycloak-cloud-refusals-results.json` in that same probe folder.
The check artifact hashes final changed sources/docs and keeps historical local
results separate. The policy OPENs and B1 UNSTARTED status remain unchanged.
