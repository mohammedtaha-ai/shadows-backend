# B0 closure follow-up - handoff checkpoint

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

- [Binding probe](../../probes/b0-2026-10-10/identity-bindings.mjs) and
  [results](../../probes/b0-2026-10-10/followup-artifacts/identity-bindings-results.json).
- [Device probe](../../probes/b0-2026-10-10/identity-devices.mjs),
  [policy fixture](../../probes/b0-2026-10-10/identity-device-fixture.mjs),
  [fresh-process verifier](../../probes/b0-2026-10-10/identity-device-child.mjs), and
  [results](../../probes/b0-2026-10-10/followup-artifacts/identity-devices-results.json).
- [Unexecuted Keycloak behavioral reproduction](../../probes/b0-2026-10-10/identity-keycloak.mjs)
  and [blocked preflight](../../probes/b0-2026-10-10/followup-artifacts/identity-keycloak-results.json).
- [MiniMax source](../../probes/b0-2026-10-10/minimax-rounds.mjs),
  [corrected continuity](../../probes/b0-2026-10-10/followup-artifacts/minimax-rounds-results.json),
  [initial results including cancellation](../../probes/b0-2026-10-10/followup-artifacts/minimax-rounds-initial-results.json),
  and [initial source snapshot](../../probes/b0-2026-10-10/followup-artifacts/minimax-rounds-initial-source.txt).
- [Focused static/link/YAML/secret checks and provenance](../../probes/b0-2026-10-10/followup-artifacts/checks.json).

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
