# Backend capability probes - 2026-10-10

Probe sources and raw artifacts named here were removed from the tree on
2026-10-13; `git show db27eb5:<path>` retrieves any of them.

Later evidence: [2026-10-11 MiniMax supplement](2026-10-11-minimax-provider-probe.md)
records four real-endpoint cases. The observations below remain the original run;
its blocked provider availability is historical, not the latest combined status.

Scope: B0 only. **Partial verification; B1 remains gated.** Fifteen executable
assertions passed locally on Windows. Actual commercial-provider streaming and
Windows system-browser/deployed-identity acceptance are blocked. No application,
cloud deployment, real Shadows integration, remote CI or real-device acceptance
is claimed. No sibling repository was edited; no commit/push/PR was created.

## Starting state and provenance

- Starting HEAD: `599d49c2455d6afa822c1d0fc404ce82332fc113`, branch `main`.
- `git status --short` and `git status --porcelain=v1` were empty before edits.
- Checkout: `E:/Globalprojects/shadows-backend`; Windows 11 Pro, build 26200,
  Windows x64. Run date uses Asia/Aden, 2026-10-10.
- Read AGENTS, README, architecture, delivery spec, source structure, contract
  convention/template and initial plan before adding fixtures.
- Retained reproduction: non-product probes (`probes/b0-2026-10-10/README.md` at `db27eb5`).
  Source/setup hashes (`probes/b0-2026-10-10/artifacts/provenance.json` at `db27eb5`) tie
  the uncommitted reproduction to this baseline. Generated artifacts are fixtures,
  not public J1 schemas or product modules. No product code map was created.

## Exact environment and licenses

| Runtime/tool/library | Executed version | License / constraint |
| --- | --- | --- |
| Node.js / npm | 24.15.0 / 11.12.1 | Runtime pinned for this experiment |
| PowerShell | 7.6.5 | Windows host shell |
| Dart SDK | 3.12.2 stable, windows_x64 | Compiled native executable; no Flutter/device run |
| Docker CLI | 29.4.2, build 055a478 | Linux engine unavailable; no daemon started |
| PostgreSQL | 18.4, x86_64-windows, msvc-19.44.35226 | PostgreSQL license; actual independent server |
| embedded-postgres | 18.4.0-beta.17 | MIT; fixture launcher only, not deployment choice |
| Fastify / @fastify/swagger | 5.12.5 / 9.9.2 | MIT / MIT |
| @sinclair/typebox | 0.34.52 | MIT |
| Kysely / pg | 0.29.6 / 8.23.1 | MIT / MIT; Kysely Node >=22 |
| node-pg-migrate | 9.0.0 | MIT; Node >=20.11 |
| pg-boss | 12.37.1 | MIT; Node >=22.12 |
| ai / @ai-sdk/openai | 6.0.303 / 3.0.125 | Apache-2.0 / Apache-2.0 |
| openid-client / oidc-provider | 6.8.8 / 9.12.2 | MIT / MIT |
| openapi-typescript / openapi-fetch | 7.13.0 / 0.17.0 | MIT / MIT |
| TypeScript / tsx | 5.9.3 / 4.23.15 | Apache-2.0 / MIT |
| @apidevtools/swagger-parser | 13.1.0 | MIT; tooling requires Node >=22.19 |
| zod / yaml | 4.6.5 / 2.9.1 | MIT / ISC |
| @types/node / @types/pg | 24.19.2 / 8.23.1 | MIT / MIT |

Installed manifest (`probes/b0-2026-10-10/artifacts/versions.json` at `db27eb5`) records
package engine declarations; lockfile (`probes/b0-2026-10-10/package-lock.json` at `db27eb5`)
pins transitive versions and integrity. Absent package engines are not proof of
support on arbitrary Node versions. Only this Windows/Node 24 environment ran.
Host toolchain (`probes/b0-2026-10-10/artifacts/toolchain.json` at `db27eb5`) records
the shell, Dart build string and Docker CLI version.

Initial `ai@7.0.137` resolution returned ETARGET for provider 4.0.26 and then
provider-utils 5.0.58. A fresh exact provider query later resolved 4.0.26, so this
does not prove a permanent upstream packaging defect. Cached/fresh registry
metadata differed; another cached resolution failed on process-warning ^5.1.0.
Fresh metadata completed installation. AI 6.0.116 / OpenAI 3.0.30 initially
executed but had a low-severity provider-utils resource-consumption advisory.
They were replaced with 6.0.303 / 3.0.125 and the entire probe suite reran.
Initial audit (`probes/b0-2026-10-10/artifacts/npm-audit-initial.json` at `db27eb5`) preserves
the four affected package findings. Final audit (`probes/b0-2026-10-10/artifacts/npm-audit.json` at `db27eb5`)
reports zero vulnerabilities. Neither result guarantees absence of defects.

## Reproduction and isolation

```powershell
Set-Location E:/Globalprojects/shadows-backend/probes/b0-2026-10-10
npm ci --fetch-timeout=30000 --fetch-retries=1
npm test
npm audit --json > artifacts/npm-audit.json
node docs-check.mjs
node provenance.mjs
```

`npm ci` was also executed successfully as a clean lockfile reproduction, followed
by the full passing suite. The actual initial setup used
`npm init -y` and `npm install --save-exact --prefer-online --fetch-timeout=30000
--fetch-retries=1` with the package names/versions in package.json. The final
patch update command was `npm install --save-exact --prefer-online
--fetch-timeout=30000 --fetch-retries=1 ai@6.0.303 @ai-sdk/openai@3.0.125`.
Slow registry metadata/downloads and failed installs are not behavioral results.

`npm test` invokes `node run.mjs`, sequentially executing versions, availability,
HTTP, database, AI and OIDC fixtures and retaining per-process exit codes. All
six final processes exited zero. Focused commands are in the probe README.

All network fixtures bind 127.0.0.1: HTTP 45871, PostgreSQL 45872, model fixture
45873 and OIDC issuer 45874. Port 45875 is a registered native callback URI only;
there is no listener/native return acceptance. Database `b0_capability` belongs
to a new `.cluster` under the probe directory. The absolute cleanup target is
checked before its ephemeral launcher removes it. No existing database URL,
Docker daemon, running Shadows service or global auth configuration is used.

SQL fixtures use accounts `a`/`b`, a revisioned item and synthetic deliveries.
The cluster password is generated at runtime, uses SCRAM and is never printed.
The child worker gets connection configuration through stdin. The remote-effect
table simulates an owner using an independent client/commit in the same test
database; it is not an external Shadows service or distributed-system acceptance.
OIDC tokens, cookies and default test signing keys never enter saved evidence.
No credentials were retrieved from files, a secret store, another app or account.
Inherited supported provider/OIDC configuration presence was checked without
values; none was present. No paid resources or cloud account changes occurred.

## Experiment matrix

PASS below means the named local assertion passed, not production acceptance.

| Experiment | Expected behavior | Observed behavior | Status |
| --- | --- | --- | --- |
| Fastify request schema | Valid DTO accepted; wrong type, bound and extra field refused | 200 for valid; three 400 refusals with coercion/removal disabled | PASS |
| Fastify response schema | Private field stripped; missing required field rejected | Internal field absent; missing revision yields 500 | PASS |
| Outgoing value validation | Semantic bounds enforced explicitly | Serializer alone emits revision -1; same TypeBox schema with Value.Check refuses it with 500 | PASS with required amendment |
| HTTP streaming | Start, ordered chunks, end/error; disconnect cleanup | Seven complete events; partial failure has two chunks and error terminal; all three connections close | PASS, synthetic |
| Schema consumers | Export validates; TS and compiled Dart perform requests | OpenAPI 3.0.3 validates; strict TS compile includes negative type fixture; both consumers call real loopback HTTP; Dart rejects three invalid reply fixtures | PASS, flat DTO only |
| SQL migrations | Empty/prior schema upgrade, exclusive migration, repeat and rollback | 001 then 002; one concurrent migrator refused; repeat up, full down/up pass | PASS |
| Scoped SQL / transaction | Foreign account sees no row; rollback leaves old revision | Zero foreign rows; thrown transaction leaves revision 0 | PASS, fixture scope |
| Concurrent revision | Exactly one conditional write wins | Competing explicit transactions return row counts [0,1] | PASS |
| Atomic enqueue | Domain write and queue row commit or roll back together | Zero domain and queue rows after throw; one committed queue row | PASS |
| Worker interruption | Active lease recoverable after worker death | Child exits 73 after synthetic owner commit; new pg-boss instance fetches same job after expiry | PASS, configured timing |
| Duplicate external effect | Reconcile prior result; changed content conflicts | Two identical replays retain effects=1; different fingerprint refused; delivery marked reconciled | PASS, synthetic owner |
| Retry exhaustion | Terminal failure visible | State failed, retry_count 1 after two failed attempts | PASS |
| AI completion/usage | Complete text plus finish/usage | partial-complete, stop, totalTokens 5 | PASS, synthetic provider |
| AI partial transport failure | Preserve prior text; surface failure truthfully | partial text remains; stream iteration throws AI_APICallError on patched SDK | PASS, synthetic injected fault |
| AI explicit stop | Abort propagates and preserves prior chunk | One retained delta; abort part; provider socket closes | PASS, synthetic provider |
| AI tool calls | Valid input executes; invalid input never executes | Valid executes once/tool-result; invalid executes zero/tool-error | PASS, synthetic provider |
| Actual model provider | Real completion, stop, partial failure, tool behavior | No inherited authorized provider configuration; no external calls | BLOCKED |
| OIDC protocol | PKCE/state/nonce, replay refusal, expiry, refresh revocation and logout | Public native code flow passes; bad state and code replay refused; expired access refused; revoked refresh refused; silent login after logout returns login_required | PASS, synthetic account/HTTP redirects |
| Windows browser/deployed identity | System browser and one-time native return, persisted sessions, device revocation | Only in-app browser exposed; no authorized issuer/tenant; no native return listener | BLOCKED |
| Full Dart generator / J1 stream envelopes | Versioned rich schemas, unions/nullability/replay rules | Only flat DTO exported/compiled; stream transport fixture is not J1 | UNRESOLVED |

Machine-readable evidence: HTTP (`probes/b0-2026-10-10/artifacts/http-results.json` at `db27eb5`),
database (`probes/b0-2026-10-10/artifacts/database-results.json` at `db27eb5`),
synthetic AI (`probes/b0-2026-10-10/artifacts/ai-synthetic-results.json` at `db27eb5`),
synthetic OIDC (`probes/b0-2026-10-10/artifacts/oidc-synthetic-results.json` at `db27eb5`),
blocked availability (`probes/b0-2026-10-10/artifacts/availability.json` at `db27eb5`),
process exits (`probes/b0-2026-10-10/artifacts/run-results.json` at `db27eb5`).

## Important observations and decisions

Fastify response serialization is not full semantic validation. `Value.Check`
on the same canonical TypeBox schema establishes outgoing bounds in this fixture.
Raw streaming bypasses normal response serialization; validate each future J1
envelope explicitly. TS generated types do not validate incoming JSON, and a
number type does not encode integer/minimum constraints. The Dart fixture decoder
checks its fields at runtime; a production generator must retain equivalent rules.

The first recovery run used supervise=1 second but monitor retained its 60-second
default; no retry arrived within 15 seconds. Inspection of pg-boss's monitor pass
showed timeout handling there. Setting both intervals to 1 second with a 2-second
job lease passed automatic recovery without manually changing job state. Production
lease/heartbeat/monitor settings and resource impact still need reviewed budgets.
Enqueue uses `CompiledQuery.raw(text, values)` on the **same Kysely transaction**;
another pool query would not establish atomicity. Queue semantics do not prevent
remote duplication: the synthetic owner enforces stable identity/fingerprint and
replays its durable outcome. Real Shadows must provide its own operation and proof.

AI stream consumers must handle both error events and thrown iteration errors,
preserve prior deltas and persist a distinct terminal failure/cancelled result.
The earlier SDK threw TypeError for the same network cut; the patched SDK throws
AI_APICallError. Do not build protocol semantics around a single exception class.
HTTP disconnect cleanup and intentional model cancellation were tested separately;
this does not settle durable conversation behavior after client disconnect.
Tool schema validation does not establish project authority or human confirmation.

OIDC expiry initially accepted a 2-second token after 2.2 seconds because the
provider defaults to 15-second clock tolerance. The expiry fixture uses tolerance
zero. Review the eventual production tolerance explicitly. The synthetic provider
uses an in-memory adapter and development signing keys; these cannot become the
deployment configuration. Refresh-token revocation/logout do not prove immediate
revocation of every issued access token or a backend-owned trusted-device session.
Correct PKCE verifier and expected nonce were exercised successfully; wrong state
and code replay were refused. Wrong-verifier and wrong-nonce refusal need separate
fresh-flow tests and are not experimentally proven by this run.

| Candidate | Decision | Reason / adoption limit |
| --- | --- | --- |
| Fastify 5 + TypeBox + swagger | ADOPT for reviewed HTTP boundary | Local schema/stream and TS/Dart fixture evidence; explicit outgoing/envelope validation required; J1 remains OPEN |
| PostgreSQL + Kysely/pg | ADOPT for cloud-owned persistence | Real PostgreSQL transactions, conditional revisions and scope fixture pass; application authority stays in services |
| node-pg-migrate 9 | ADOPT as sole cloud migration history owner | Ordered SQL, previous/empty schema, advisory exclusion and rollback pass |
| pg-boss 12 | ADOPT for durable job transport | Same-transaction enqueue and recovery pass with explicit timing; domain/remote idempotency remains required |
| AI SDK Core 6.0.303 / OpenAI adapter 3.0.125 | UNRESOLVED for actual provider selection | Synthetic behavior passes and patched audit is clean; no actual provider evidence |
| openid-client 6.8.8 | UNRESOLVED pending identity selection/native flow | Maintained protocol client works locally; deployed issuer and native acceptance absent |
| oidc-provider 9.12.2 as hosted identity | UNRESOLVED | Useful established synthetic issuer, not a selected deployment; persistent adapter/key/session/operator policy not evaluated |
| Hono / direct pg / Drizzle / managed queue | Not evaluated | No residual candidate failure justified replacement after explicit validation/timing; no speculative comparison |
| AI 6.0.116 / OpenAI 3.0.30 pins | REJECT these pins | Known audit finding; patched pins reran successfully; this does not reject AI SDK Core |

ADOPT is an evidence-backed component decision for review, not permission to begin
B1 or a claim that the aggregate library OPEN is closed. AI 7 remains unevaluated
after installation-resolution problems; it is not rejected on behavioral grounds.

## Owner amendments and cross-repository implications

Architecture now records these conditional component selections and keeps actual
provider/identity, protocol, lifecycle and owner authority prerequisites OPEN.
The delivery spec requires outgoing validation, both stream failure paths, explicit
queue timing, one migration history and separate identity/device revocation proof.
The initial plan records B0 partial verification and executable reproduction;
B1 cannot have final adapter signatures or complete execution steps until the
identity/provider/lifecycle decisions close. B2-B4 gain evidence-derived requirements,
but remain unstarted. The full later roadmap is retained.

Proposed changes in other repositories only:

- **NYLRA:** pin reviewed producer/consumer schema artifacts; reject invalid runtime
  payloads; specify rich DTO and stream envelope generation before J1; distinguish
  partial/cancelled/failed output and intentional stop from network disconnection.
  Windows needs an established native OAuth flow with S256 PKCE, one-time state
  and nonce/return binding, registered redirect and logout/device revocation proof.
  Dart flat-DTO compilation is not Flutter/mobile acceptance. Coordinate N0/J0
  partial readiness; no client source/spec was changed here.
- **Shadows:** expose owner-enforced scoped operations with stable command identity,
  normalized fingerprint and outcome lookup/replay. Revalidate current source,
  grant/membership/device authority before dispatch/acceptance; queue delivery is
  not approval. Synthetic remote-effect proof does not close §24.6 or authorize
  backend table access. Context production/outbound connector remain Rust-owned.

## Checks and remaining prerequisites before B1

Actual checks: clean `npm ci` reproduction; focused HTTP, PostgreSQL, AI and OIDC
reruns during diagnosis, including stronger final database commit/completion and
advisory-lock error assertions;
final `npm test` (all 15 assertions; six subprocesses exit 0); strict TS compile
with a negative type fixture; OpenAPI parser validation; Dart analysis, native
compile and executed consumer; final `npm audit --json` (zero findings); YAML
parsing and local Markdown target/anchor validation via `node docs-check.mjs`;
`git diff --check`. Exact documentation counts are in the
documentation check artifact (`probes/b0-2026-10-10/artifacts/docs-check.json` at `db27eb5`).
No repository-wide product tests exist and no remote CI ran. External citations
were inspected as references; link checks do not claim every URL reachable.

A fresh-context read-only reviewer found no blocking findings. Its review did not
rerun mutating probes. The stale plan statement about missing probe commands was
corrected; negative PKCE/nonce rejection coverage remains a named nonblocking
follow-up with no rejection claim. The reviewer declined to judge actual-provider
behavior, deployed identity security, native return handling, rich Dart/J1
conformance and real Shadows authority; each remains gated rather than inferred.
The review record (`probes/b0-2026-10-10/artifacts/review.json` at `db27eb5`) preserves scope
and these decisions. No second review or production-readiness claim was made.

Reviewer decisions/prerequisites:

1. Accept or amend component selections and their explicit validation/timing limits.
2. Provide an authorized actual provider/model/endpoint and run completion, explicit
   stop, partial-failure handling and relevant tool behavior; retain separate evidence.
3. Select/review identity deployment, issuer/client registration, persistent sessions,
   signing/key rotation and revocation policy. Prove Windows system-browser/native
   return, one-time binding, expired/revoked device sessions, logout and restart.
4. Close real-content retention, derived-cache deletion and backup purge deadlines
   in architecture before persisting real data. No experiment closes this decision.
5. Review J1 shapes, bounded context and rich TS/Dart conformance generation jointly;
   obtain real Shadows protocol/authority proof at its own gates.
6. Amend B1 into fully executable adapter-specific steps and product check commands
   after prerequisites close. Do not copy probe-only consent, stores or generators.

## Primary references inspected

The observations above come from executed fixtures. Reference documentation informed
probe setup: [Fastify validation/serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/),
[swagger plugin](https://github.com/fastify/fastify-swagger),
[pg-boss transaction adapters](https://pgboss.io/api/adapters),
[node-pg-migrate](https://github.com/salsita/node-pg-migrate),
[embedded PostgreSQL](https://github.com/leinelissen/embedded-postgres),
[AI SDK streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text),
[openid-client](https://github.com/panva/openid-client) and
[oidc-provider](https://github.com/panva/node-oidc-provider).
