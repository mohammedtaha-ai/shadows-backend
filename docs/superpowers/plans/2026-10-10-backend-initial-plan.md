# Backend Initial Implementation Plan

**B0 cloud amendment, 2026-10-11:** [closure report](../../evidence/2026-10-11-b0-closure-followup.md).
Keycloak server cases now pass with disposable synthetic accounts. Reuse passed
MiniMax tool/reasoning continuity and later-round client abort. Native acceptance,
production identity operations and approval of architecture policy remain open.
**2026-10-11 execution amendment:** the user authorized B1 backend implementation
and Linux acceptance in this existing checkout/current branch. Windows acceptance
belongs to NYLRA/later integration, not this implementation gate. B1.5 remains
retention-dependent and deferred; B2+ stays unstarted. No MiniMax, sibling edits,
deployment, commit or push. [Execution evidence](../../evidence/2026-10-11-b1-linux-acceptance.md).

> **For agentic workers:** Use superpowers:executing-plans for inline execution,
> or superpowers:subagent-driven-development when delegation is explicitly selected.

**Goal:** Deliver durable, scoped NYLRA conversations connected to real Shadows,
then add verified confirmation, mobile/voice, teams and Production in bounded slices.
**Architecture:** One modular Node application; Rust Shadows retains project rules.
**Tech Stack:** TypeScript/PostgreSQL; B0 supports Fastify/TypeBox/OpenAPI,
Kysely/pg, node-pg-migrate and pg-boss for component review. AI SDK Core with
MiniMax-M3 has scoped real-provider evidence; Keycloak/openid-client is the
conditional identity recommendation pending native/confidential-flow review.
**Spec:** [Backend delivery](../specs/2026-10-10-backend-delivery-design.md).
**Status:** B0 partially verified across retained local and cloud observations.
Windows native acceptance and production identity gates remain open. Retention-dependent B1.5 is deferred; every B2+ task remains UNSTARTED. B1.1–B1.4 implementation is recorded in the execution evidence. [Evidence](../../evidence/2026-10-10-backend-capability-probes.md).

## Global constraints

- Experiments come first; update this plan from their results before dependent tasks.
- Source paths below are intended destinations, not existing modules.
- No fake provider/owner result may be called real integration acceptance.
- Preserve the complete roadmap; do not scaffold its unused modules.
- Contracts describe inspected implementation, with actual test references.
- No implicit production deployment, account changes or repository publication.

## Review focus

1. A revoked link with a queued command must not dispatch (B4).
2. Snapshot/replay overlap must lose no event or duplicate an effect (B2).
3. Disconnect after a provider chunk must preserve a truthful partial result (B3).
4. A reused command identity with changed content must conflict (B4).
5. Account/workspace substitution must reveal no other source or topic (B1/B2).

## Joint checkpoints and dependencies

J0 = B0/N0 evidence and revised plans. J1 = reviewed backend wire schemas and
conformance fixtures, consumed by Windows N2 and later Dart. J2 = B3/N2 plus real
Shadows context/connector acceptance. J3 = B4/N3 plus Shadows §24.6 acceptance.
The [client plan](../../../../nylra/docs/superpowers/plans/2026-10-10-nylra-initial-plan.md)
uses these same checkpoint names. B0 and N0 may progress independently; schema
freeze, identity and owner-side behavior are actual dependencies, not mocks to skip.

### B0: Capability experiments and plan amendment

**Output files:** `docs/evidence/<run-date>-backend-capability-probes.md`; amend
`docs/architecture.md`, the delivery spec and this plan as results require.
Keep disposable scripts outside product source; record their revision/provenance.

- [x] Inspect supported Node/library versions and licenses; pin the probe environment.
- [x] Exercise Fastify validation and generated schema with TS and one Dart consumer.
- [x] Test real-provider stream completion, injected partial failure and client cancellation;
  tool-result semantics and think-tag reasoning continuity passed in the retained supplement.
- [x] Run disposable PostgreSQL migrations and concurrent revision-conflict tests.
- [x] Prove atomic enqueue rollback and worker restart with pg-boss; reconcile an
  external result already applied before the worker records completion.
- [ ] Exercise maintained OIDC login via a Windows system browser, return binding,
  logout and revocation. Record actual selected provider and deployment requirements.
- [x] Record pass/fail, exact commands/versions, alternatives and unavailable evidence.
- [x] Update dependent task paths/interfaces and test commands to match the selected
  tools; replace initial task outlines with executable steps before starting B1.

**Exit:** evidence-backed library decisions, revised plan and remaining blocked
capabilities named. Queue delivery guarantees never replace domain idempotency.

**Observed B0 state:** original 15 assertions, later synthetic bindings/device
prototype and real MiniMax cases are reused. Nine cloud Keycloak cases pass;
six typed negative-case checks were then repeated after tightening error
classification. Neither the SQL prototype nor the HTTP browser driver is product
or Windows acceptance. H2 persistence is not production PostgreSQL recovery.
The flat Dart fixture does not select a full J1 generator. B0 remains partially
verified; native and operational gates stay open.

**Retained artifacts:** non-product fixture package (`probes/b0-2026-10-10/README.md` at `db27eb5`),
its exact lockfile, generated OpenAPI/TS/Dart artifacts and JSON results. The
report records baseline Git state and source/setup hashes. Do not delete the only
reproduction before reviewer inspection. No product source or code map is created.

**Executable B0 recheck commands (PowerShell):**

```powershell
Set-Location E:/Globalprojects/shadows-backend/probes/b0-2026-10-10
npm ci --fetch-timeout=30000 --fetch-retries=1
npm test
npm run check:docs
npm audit --json > artifacts/npm-audit.json
node provenance.mjs
```

The fixture package pins Fastify 5.12.5, TypeBox 0.34.52, swagger 9.9.2,
Kysely 0.29.6, pg 8.23.1, node-pg-migrate 9.0.0 and pg-boss 12.37.1.
AI SDK 6.0.303/OpenAI 3.0.125 is conditionally supported for the tested MiniMax
path; Keycloak/openid-client still requires native/confidential-flow acceptance. These are probe commands, not future
product test commands. The full versions/license table is in the evidence.

**Rulings for this B0 continuation:** preserve the requested checkout and all
retained local artifacts; no commit/push/PR/deployment. Runtime-only MiniMax
configuration may use `process.env.API_KEY` (including a Network-secret proxy
placeholder), with optional local loading only when missing. No additional
provider calls are required. No AWS or alternative credential source is authorized.
Prepare conditional B1 interfaces and steps below without creating product files.

### B1: Authenticated application and data lifecycle — Linux continuation

B1.1–B1.4 paths now have an implementation; the evidence/code map owns the actual
inventory. B1.5 and later paths remain intended and uncreated. Proposed interfaces are
owned by [delivery spec B1](../specs/2026-10-10-backend-delivery-design.md#b1-scope-and-selected-interfaces--conditional-design-unstarted).
All policy values are owned by [architecture section 5](../../architecture.md#5-accounts-instances-and-project-selection);
this plan refers to them without creating a second policy copy.

**Entry gate B1.0 — historical checklist with execution amendment:**
The explicit user continuation supersedes the Windows-before-implementation gate.
Backend/Linux work proceeds; native integration, retention and production operations
remain separate prerequisites. This does not silently check those boxes.

- [ ] User reviews component pins, self-hosted Keycloak operations and the proposed
  confidential-backend/native-ticket boundary. If ZITADEL is chosen instead,
  revise the adapter registration and repeat the same isolated server cases before B1.
- [ ] NYLRA N0/N2 provides actual Windows Tauri system-browser login/return and
  native secure-storage evidence, including app restart, occupied callback port,
  forged/replayed/expired return and logout. The current checkout contains no
  sibling NYLRA repository or native build. A Linux callback cannot check this box.
- [ ] User reviews architecture section 5's identity/session and content defaults.
  Record accepted/amended values in that owner; do not turn this checklist into approval.
- [ ] Confirm exact issuer/client/callback/audience, confidentiality and RS256/key
  rotation behavior in an isolated registration. The B0 public-client fixture does
  not prove the proposed confidential relying-party and return-ticket flow.

**Pins intended for B1:** Node 24.15.0 / npm 11.12.1 (original compatibility
baseline; cloud ran Node 24.19.0 / npm 11.9.0), TypeScript 5.9.3, tsx 4.23.15,
Fastify 5.12.5, TypeBox 0.34.52, @fastify/swagger 9.9.2, Kysely 0.29.6,
pg 8.23.1, node-pg-migrate 9.0.0, openid-client 6.8.8, jose 6.2.12,
@types/node 24.19.2, @types/pg 8.23.1, yaml 2.9.1, openapi-typescript 7.13.0,
openapi-fetch 0.17.0. Use PostgreSQL 18.4 for disposable integration acceptance,
embedded-postgres 18.4.0-beta.17 only as the non-root test launcher. Keycloak
26.8.0 is pinned by the digest in the closure report. jose is prospective and
must pass signed-logout cases; it is not claimed B0-tested. AI/queue/Zod and
synthetic oidc-provider are not installed as B1 production dependencies.

#### B1.1: Runnable composition and fail-closed configuration

**Create:** `package.json`, `package-lock.json`, `tsconfig.json`, `.node-version`,
`src/main.ts` (process entry), `src/app/config.ts` (validated runtime settings),
`src/app/compose.ts` (construct dependencies), `src/app/shutdown.ts` (drain/close),
`src/platform/database/pool.ts` (pg pool), `src/platform/database/transaction.ts`
(transaction lifetime), `src/platform/database/contract.yaml`,
`src/app/contract.yaml`, `tests/integration/fixtures/postgres.ts` (owned disposable
cluster), `tests/integration/startup.test.ts`, `tests/architecture/boundaries.test.ts`,
`docs/codebase/README.md` (only inspected source owners). Modify `.gitignore` to
exclude test runtime directories; create no `.env` or secret-valued examples.

**Interfaces:** `readConfig(env: NodeJS.ProcessEnv): AppConfig` validates
DATABASE_URL, OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CALLBACK_URL, OIDC_LOGOUT_CALLBACK_URL,
TOKEN_ENCRYPTION_KEY and PORT without reporting values. `compose(config: AppConfig):
Promise<{ start(): Promise<void>; stop(): Promise<void> }>`; `withTransaction<T>(
operation: (tx: Transaction<Database>) => Promise<T>): Promise<T>`.
Connection secrets are consumed at runtime and must never be serialized into errors.

- [ ] Write `missing_config_refuses_start`, `non_https_issuer_refused`,
  `graceful_shutdown_closes_pool` and
  `transport_cannot_import_private_store`. Assert only safe error codes, closed
  pool/listener and forbidden import failure, including relative/alias bypasses.
- [ ] Add scripts listed under B1 reproducible commands; run `npm run test:startup`
  and `npm run test:boundaries` and observe failures for missing implementation.
- [ ] Implement named files; use Fastify request schemas with coercion/removal off,
  explicit TypeBox output checks and request logging disabled/redacted at composition.
  No headers, callback queries, config, provider errors or content in logs.
- [ ] Run the two focused scripts and `npm run typecheck`; expect exit zero and
  all named assertions passing. Inspect bodies and add only truthful contracts.

#### B1.2: Owned identity/device schema and migration history

**Create:** `src/modules/identity/model.ts` (spec-owned types),
`src/modules/identity/store.ts` (account/login/session/audit/deletion queries),
`src/modules/devices/model.ts`, `src/modules/devices/store.ts` (device rows only),
`src/modules/devices/index.ts` (transactional registration public surface),
`src/modules/identity/contract.yaml`, `src/modules/devices/contract.yaml`,
`src/platform/database/schema.ts` (Kysely table types),
`src/platform/database/migrate.ts` (node-pg-migrate invocation), `scripts/migrate.ts`
(runtime CLI), `migrations/001_identity.sql`, `migrations/002_devices.sql`,
`migrations/003_identity_sessions.sql`, `tests/integration/migrations.test.ts`.

**Migration responsibilities:** 001 identity owns `identity_accounts` with unique
issuer/subject and active/deleting status, `identity_login_attempts` with state
hash, encrypted verifier/nonce, approved return URI/challenge, expiry and claim,
`identity_return_tickets` with ticket hash, account, challenge, verified provider
sid/encrypted token input, expiry and consumption,
`identity_audit_events`, `identity_deletions` and `identity_logout_events` with
unique issuer/jti and sid. 002 devices owns `devices` with id, account id and
revoked_at plus unique `(account_id,id)`. 003 identity owns `identity_sessions`
with handle hash, account/device foreign key, provider sid, encrypted required
tokens, issued/last-active/absolute expiry, revoked_at and provider-logout status,
and `identity_logout_tickets` with hash, session foreign key, encrypted provider
logout input, expiry, one-time consumption and separate bound callback state.
Use composite account/device foreign keys; no plain handle/verifier/token column.
No content, project, membership, Rust-owned or pg-boss tables are created.

**Interfaces:** `runMigrations(connection: pg.ConnectionConfig, direction:
'up' | 'down'): Promise<void>`; only node-pg-migrate owns application history.
`DeviceRegistrationPort.create(tx: Transaction<Database>, accountId: string):
Promise<string>` is identity's consumer port, implemented by devices' public
`registerDevice(tx: Transaction<Database>, accountId: string): Promise<string>`
(created in B1.2 and wired in B1.3). No client-claimed id is accepted.
`IdentityStore.claimAttempt(stateHash: string, now: Date): Promise<LoginAttempt | null>`
atomically consumes the unexpired attempt; `IdentityStore.consumeTicket(tx: Transaction<Database>, ticketHash: string,
returnChallenge: string, now: Date): Promise<VerifiedReturn | null>` consumes once.
`VerifiedReturn` is a private model with accountId, providerSessionId and encrypted
token input from the already verified exchange; no caller constructs it. The workflow
calls it on its transaction, so failed session creation rolls back consumption.
Store-private types and table queries do not become another module's public API.

- [ ] Write `empty_schema_up`, `previous_schema_upgrade`, `repeat_up_no_change`,
  `concurrent_migration_lock_refused`, `down_up_reapply` and
  `foreign_account_device_fk_refused`. Verify columns/constraints and ordered history
  using a newly launched test PostgreSQL; never consume an existing DATABASE_URL.
- [ ] Run `npm run test:migrations`, observe missing-schema failures, implement
  the three SQL migrations with Up/Down sections, then expect all assertions to pass.
- [ ] Verify failed transaction leaves neither ticket consumption nor session row;
  check database dumps in memory for synthetic plain credentials without displaying
  matches. Update database contract and record actual PostgreSQL version.

#### B1.3: Validated OIDC exchange and one-use native return

**Create:** `src/modules/identity/oidc-port.ts` (spec OidcPort),
`src/modules/identity/device-registration-port.ts` (identity-owned consumer interface),
`src/modules/identity/oidc-client.ts` (openid-client/jose adapter),
`src/modules/identity/token-vault.ts` (authenticated encryption with versioned key id),
`src/modules/identity/service.ts` (IdentityService workflows),
`src/modules/identity/index.ts` (public operations/types),
`src/transports/http/auth-schema.ts`
(canonical TypeBox wire shapes), `src/transports/http/auth-routes.ts`
(validation/translation), `src/transports/http/contract.yaml`,
`tests/integration/login-return.test.ts`, `tests/integration/oidc-client.test.ts`,
`tests/journeys/keycloak-login.test.ts`, `tests/integration/fixtures/keycloak.ts`
(unique bounded disposable server, no product dev realm). Modify identity/devices
contracts, composition and existing stores from B1.2 with inspected behavior.

**Interfaces:** implement spec `beginLogin`, `finishLogin`, `redeemReturn` and
OidcPort. `TokenVault.seal(value: string, associatedData: string):
Promise<{ ciphertext: string; keyId: string }>` and
`TokenVault.open(sealed: { ciphertext: string; keyId: string }, associatedData: string):
Promise<string>`. Use Node AES-256-GCM, a random 96-bit IV per write and a packed
IV/tag/ciphertext envelope; bind purpose and record id as authenticated associated
data. Validate a 32-byte runtime key and approved key id without printing them.
Use this boundary for attempt verifier/nonce, pending return token input, session
tokens and logout input; refuse tampering, wrong purpose/record/key. Service-owned
codecs parse each payload, never a caller-controlled decrypted type assertion.
Native redemption returns no identity until OIDC binding is verified; device id is
server-generated at successful redemption and linked to the authenticated account.

**Wire operations:** `POST /v1/auth/login` takes NativeLoginRequest and returns
LoginStart; `GET /v1/auth/callback` takes only provider code/state/error query and
redirects to the approved native URI with a one-use ticket; `POST /v1/auth/return`
takes ticket/returnVerifier and returns SessionGrant. Callback errors show a safe
browser refusal; no error_description/raw token/URL query enters diagnostics.
Limit bodies to 8 KiB, begin-login to 10 requests per minute per temporary source
bucket (in-memory bucket identifiers, never audit IPs) and ticket redemption to
10 per minute per attempt; these are proposed B1 transport limits for review.

- [ ] Write `valid_login_maps_issuer_subject`, `same_email_does_not_merge`,
  `wrong_state_before_exchange`, `wrong_pkce_invalid_grant`, `wrong_nonce_refused`,
  `reused_code_refused`, `parallel_callback_one_claim`, `expired_attempt_refused`,
  `foreign_return_uri_refused`, `wrong_return_challenge_refused`,
  `parallel_ticket_one_session`, `expired_ticket_refused`, `key_tamper_refused`,
  `restart_pending_attempt_uses_recorded_binding` and `logs_contain_no_sensitive_fixture`.
  For negative OIDC cases assert typed protocol rejection, never any exception.
- [ ] Run `npm run test:login`, observe red tests, implement adapter/service/routes.
  Disable automatic exchange retries and consume attempts before network exchange.
  Treat ambiguous failure as fresh-login-required. Concurrent redemption has one winner.
- [ ] Run `npm run test:login`; expect all tests passing. Run
  `npm run test:keycloak` against the pinned confidential registration and actual
  backend HTTP routes; require login, typed refusals and one-use ticket assertions.
  B1.4 extends this same journey with expiry/logout/persistence before B1 exit.
  Unit port fakes do not replace this journey or Windows evidence.

#### B1.4: Persisted authorization, device revoke and honest logout

**Create:** `src/modules/devices/service.ts`, `src/modules/identity/device-trust-port.ts`
(identity-owned device-status consumer interface), `src/transports/http/authenticate.ts`
(bearer-to-Principal translation), `tests/integration/session-lifecycle.test.ts`,
`tests/integration/device-revocation.test.ts`, `tests/integration/backchannel-logout.test.ts`,
`tests/journeys/session-restart.test.ts`. Modify identity service/store, auth routes,
composition, devices public index and their contracts from B1.3; do not create another session owner.

**Interfaces:** complete spec `authenticate`, `logout`, `logoutAll`,
`backchannelLogout` and DeviceService. Identity exposes
`revokeDeviceSessions(tx: Transaction<Database>, accountId: string, deviceId: string):
Promise<void>` plus `recordDeviceRevocation(tx: Transaction<Database>, principal: Principal,
deviceId: string): Promise<void>`;
devices invokes these declared operations in its revoke transaction. Identity
consumes `DeviceTrustPort.isActive(tx: Transaction<Database>, accountId: string,
deviceId: string): Promise<boolean>`
supplied by devices. Neither module imports the other's store.

**Wire:** `GET /v1/auth/session` returns Principal; `POST /v1/auth/logout` and
`POST /v1/auth/logout-all` return LogoutResult; `GET /v1/devices` and
`DELETE /v1/devices/:deviceId` operate only on authenticated account devices;
`POST /v1/auth/backchannel-logout` validates the signed provider logout_token.
GET session/devices never revoke. After local revocation, LogoutResult may return
a backend `browserLogoutUrl` with a one-use opaque ticket.
`GET /v1/auth/provider-logout` consumes that ticket and sends the system browser
to the standard provider end-session URL; `GET /v1/auth/logout-callback` accepts
only its recorded one-use state and marks completion after revocation succeeds.
Register the exact HTTPS logout callback on the confidential provider client.
Neither backend URL exposes provider token hints to native IPC; provider end-session
hints appear only in the standards-based browser redirect. Ticket/callback expiry
is 60 seconds; late or failed browser completion stays pending and cannot reauthorize.

- [ ] Extend the Keycloak journey with expiry, provider logout and persisted-session
  restart. Write `database_unavailable_refuses_auth`, `expired_idle_refused`, `expired_absolute_refused`,
  `revoked_device_denies_all_its_sessions`, `other_device_survives`,
  `foreign_account_revoke_refused`, `session_survives_fresh_backend_process`,
  `revocation_survives_fresh_process`, `device_revoke_rolls_back_atomically`,
  `provider_outage_leaves_local_revoked`, `logout_all_is_account_scoped`, `logout_ticket_replay_refused`,
  `forged_logout_callback_refused`, `browser_logout_pending_until_callback`,
  `signed_logout_revokes_matching_sid`, `wrong_issuer_audience_event_nonce_refused`,
  `logout_jti_replay_no_second_effect` and `signing_key_rotation_verified`.
  Inject clock boundaries; restart uses a new process against the same owned fixture.
- [ ] Run `npm run test:sessions` and observe failures, implement workflows and
  signed logout with jose remote JWKS restricted to the configured issuer.
  Check DB status on every operation; revoked device cannot be restored by login
  using an old caller-supplied id. Provider logout retry is explicit, bounded and
  independent of local authorization; no generic durable queue is scaffolded here.
- [ ] Run `npm run test:sessions`, `npm run test:restart` and
  `npm run test:keycloak`; expect all assertions
  passing. Capture only counts/status/version/durations; no tokens or raw exceptions.

#### B1.5: Identity deletion, approved policy configuration and evidence

**Create:** `src/modules/identity/lifecycle.ts` (identity-owned purge/retry),
`scripts/purge-identity.ts` (invokes that operation),
`tests/integration/identity-deletion.test.ts`, `tests/integration/identity-restore.test.ts`,
`tests/architecture/contracts.test.ts`, `scripts/check-docs.ts` (repository links/YAML),
`scripts/check-secrets.ts` (runtime literal/token-pattern checks with counts only).
Modify identity public service/routes/store/contract, app config, code map and README.
No conversations/context/memory modules or hypothetical content contracts are created.

**Interfaces:** `deleteAccount` marks deleting, revokes all sessions and records
an idempotent deletion id in one transaction; `purgeIdentity(now: Date):
Promise<{ purged: number; pending: number }>` erases expired attempts/tickets,
required token ciphertext, expired identity audit and identity account data using
approved architecture deadlines. It refuses dependent B2+ owners unless their
declared deletion completion is present; this B1 database has none. Identity-provider
account deletion is an isolated test-only admin adapter requiring explicit runtime
admin authorization; no production admin resource is created by this task.

- [ ] After user policy review, write `delete_account_immediately_denies_sessions`,
  `deletion_retries_idempotently`, `provider_delete_pending_truthful`,
  `purge_deadline_and_audit_minimization`, `backup_restore_replays_tombstones_before_auth`,
  `restored_revoked_device_stays_denied` and `contracts_reference_real_symbols_tests`.
  Restore a newly owned disposable DB; assert deleted identity cannot authenticate
  before opening listeners. This tests application restore quarantine, not a hosting
  service's physical backup expiration or absent content owners.
- [ ] Run `npm run test:lifecycle` and observe failures, implement only identity
  lifecycle and reviewed configuration. Keep ingestion of real content disabled;
  later owners must consume policy revision, source dependencies and their own purge.
- [ ] Run focused lifecycle, migration, login, session/restart, type/schema/contract,
  docs/YAML and secret checks below. Inspect actual test bodies before updating contracts.
- [ ] Record dated B1 evidence only when B1 is authorized/executed. Acceptance
  requires real Windows NYLRA login/logout/restart plus disposable confidential
  Keycloak and PG journeys. Review gaps and stop if any gate is unresolved.
  No commit or publication is implied by the current B0 request.

#### B1 reproducible commands — future scripts, NOT executed in B0

B1.1 must define these exact root scripts. Use Node's test runner with tsx,
not a second test framework. The PostgreSQL fixture launches PostgreSQL 18.4
under the existing non-root user in a unique ignored test directory on loopback,
with generated credentials and a unique database; refuses root/existing URL,
passes configuration to restart children through stdin and cleans only resources
it owns. Keycloak fixtures pin 26.8.0/digest, use unique names/labels, 1 GiB/2 CPU,
loopback-only ports, 90-second readiness and 15-second HTTP deadlines, and clean up
on failure. Do not run the full historical probe suite just to execute B1.

```sh
npm ci --fetch-timeout=30000 --fetch-retries=1
npm run typecheck
npm run test:startup
npm run test:boundaries
npm run test:migrations
npm run test:login
npm run test:keycloak
npm run test:sessions
npm run test:restart
npm run test:lifecycle
npm run schema:generate
npm run schema:check
npm run check:contracts
npm run check:docs
npm run check:secrets
git diff --check
```

`typecheck` = `tsc --noEmit` with strict TS; `test:startup` =
`node --import tsx --test tests/integration/startup.test.ts`; `test:boundaries` =
`node --import tsx --test tests/architecture/boundaries.test.ts`;
`test:migrations` = `node --import tsx --test tests/integration/migrations.test.ts`;
`test:login` = `node --import tsx --test tests/integration/login-return.test.ts tests/integration/oidc-client.test.ts`;
`test:keycloak` = `node --import tsx --test tests/journeys/keycloak-login.test.ts`;
`test:sessions` = `node --import tsx --test tests/integration/session-lifecycle.test.ts tests/integration/device-revocation.test.ts tests/integration/backchannel-logout.test.ts`;
`test:restart` = `node --import tsx --test tests/journeys/session-restart.test.ts`;
`test:lifecycle` = `node --import tsx --test tests/integration/identity-deletion.test.ts tests/integration/identity-restore.test.ts`.
`check:contracts` = `node --import tsx --test tests/architecture/contracts.test.ts`;
`check:docs` / `check:secrets` invoke the named scripts with tsx.

B1.3 also creates `scripts/export-auth-schema.ts` (export Fastify auth schemas,
explicitly validate examples), `scripts/check-auth-schema.ts` (compare generated
output and assert invalid samples rejected), `api/auth-v1.openapi.json`,
`api/auth-v1.d.ts`, `tests/integration/auth-wire.test.ts`.
`schema:generate` = `node --import tsx scripts/export-auth-schema.ts` followed by
`openapi-typescript api/auth-v1.openapi.json -o api/auth-v1.d.ts`;
`schema:check` = `node --import tsx scripts/check-auth-schema.ts` followed by
`node --import tsx --test tests/integration/auth-wire.test.ts`.
The export script writes only deterministic schemas; check generates in an ignored
temporary directory and compares against committed snapshots. Acceptance includes
extra-field/bounds rejection and an openapi-fetch native consumer; auth-only v1 is
not the rich J1 topic/stream artifact and does not certify Flutter compatibility.
`db:migrate` = `node --import tsx scripts/migrate.ts up`; production invocation
requires separately authorized runtime DATABASE_URL, never in documentation.
Migration acceptance calls the same migration runner on the disposable fixture.

**Dependencies / acceptance boundaries:** NYLRA owns Windows Rust system-browser,
loopback listener, originating return verifier, secure store, independent trusted
UI and logout/restart evidence. Later Flutter owns AppAuth/system browser plus
OS-registered mobile return and secure store; version selection waits for N5
native evidence, with auth-v1 fixtures ready for joint conformance. Shadows owns
§1.7 grants and §24.6 confirmation authority. B1 sends it no commands and creates
no links; B2/B4 require its real protocol and authorization. This checkout lacks
both sibling repositories; proposals do not imply edits or verified sibling APIs.

**B1 exit:** fresh/upgrade migrations pass; typed identity binding and one-use
redemption pass; authenticated principal comes only from persisted verified
identity; account substitution, expiry/device revocation and restart pass;
provider versus local logout is truthful; signed logout/key rotation, identity
purge/restore, safe diagnostics, current contracts and auth schema pass. User
policy approval and Windows/confidential-flow evidence must be recorded. Production
TLS/identity DB/backup deadlines/provider terms remain deployment gates. B1 cannot
close content deletion, real Shadows authority, rich J1 or later device journeys.

> **Superseded 2026-10-13: B2, B3, B4 and the B5/B6 rows below.** They assumed the
> Shadows daemon owns the cloud link and the backend reads Shadows. Since AYLUL
> became an independent companion, AYLUL desktop owns the link and reads Shadows,
> and the work follows the NYLRA delivery spec's first-release order instead.
> Their folder names are replaced; [source structure](../../source-structure.md)
> owns the new ones. Do not execute these sections. They stay as the record of
> what was planned.
>
> | Old slice | Old folders | Replaced by |
> | --- | --- | --- |
> | B2 links and J1 | `links`, `context`, `topics`, `integrations/shadows`, `transports/connector` | Step 2(b): `links` (paired laptops), `sessions`, `transports/laptop-link`; no `integrations/shadows` |
> | B3 conversation | `conversations`, `integrations/providers`, `transports/jobs` | Step 2(c): `packages/aylul-brain`, `conversations`, `memory` |
> | B4 confirmation and handoff | `confirmations`, `delivery` | Step 2(b): `approvals` for agent requests; Step 2(d): grants on the laptop; `delivery` later |
> | B5/B6 rows | `notifications`, `memory` | Step 2(b) push in `notifications`; step 2(c) `memory` |

### B2: Selected links, bounded sources and J1

**Intended files:** `src/modules/links/`, `src/modules/context/`,
`src/modules/topics/`, `src/integrations/shadows/`, `src/transports/connector/`,
`api/`, `tests/integration/scoped-context.test.ts`,
`tests/journeys/connector-replay.test.ts`.
**Consumes:** B1 principal/device and actual Shadows grant boundary.
**Produces:** J1 schema artifact, examples and current topic/source projections.

**B0 amendment:** begin J1 review with TypeBox JSON schema and schema-derived
OpenAPI/TS artifacts; require explicit outgoing/envelope validation and runtime
consumer checks. Review a full Dart generator against rich J1 shapes before
calling TS/Dart conformance complete. Existing flat fixture names are not J1 DTOs.

- [ ] Specify J1 fields from spec section 4, normalized command hashing and schema
  ownership; choose exact DTO names once and generate consumer artifacts.
- [ ] Write failures for cross-project access, revoked links, inconsistent source
  versions, cursor gap/expiry, reconnect overlap and incompatible client schema.
- [ ] Implement initial snapshot plus replay boundary, selected-source filtering
  and resnapshot responses. Bound retained context and source sizes explicitly.
- [ ] Coordinate the Shadows dependency: daemon-owned outbound connector and
  bounded context production. Its implementation belongs in Shadows and its own plan.
- [ ] Run a real direct-Planner-conversation -> retrieved-context journey; fake
  connector tests prove protocol handling only. Mark J1/J2 readiness separately.
- [ ] Validate generated consumers and contracts, record evidence and commit.

### B3: Durable streamed conversation

**Intended files:** `src/modules/conversations/`, `src/integrations/providers/`,
`src/transports/http/`, `src/transports/jobs/`,
`tests/integration/conversation-stream.test.ts`, `tests/journeys/topic-restart.test.ts`.
**Consumes:** J1 topic/source projection. **Produces:** persisted conversation
entries, stream events and explicit terminal outcome under J1.

**B0 amendment:** use the scoped tested MiniMax non-reasoning path only after
provider configuration/terms review; reasoning_split=true remains untested. Add cases for thrown
stream iteration errors as well as error parts, retained deltas, usage and terminal
outcome. Distinguish HTTP disconnection from deliberate cancellation in persisted
service behavior. The synthetic provider cannot close J2.

- [ ] Test disconnect mid-output, explicit stop, provider failure, repeated send,
  out-of-order delivery, backend restart and source revocation during retrieval.
- [ ] Implement scoped orchestration and durable conversation lifecycle; separate
  client disconnection from intentional cancellation in the reviewed protocol.
- [ ] Prove source citations point to the actual versions used in the response.
- [ ] Run J2 jointly with Windows N2 using real provider and real Shadows sources.
- [ ] Record complete versus partial behavior, verify contracts and commit.

### B4: Assessment, exact confirmation and reliable handoff

**Intended files:** `src/modules/confirmations/`, `src/modules/delivery/`,
`tests/integration/confirmation-scope.test.ts`, `tests/journeys/owner-handoff.test.ts`.
**Consumes:** J1 and real Shadows §24.6 enforcement. **Produces:** owner-attributed
assessment/command outcomes without cloud substitution for runtime acceptance.

**B0 amendment:** use the declared same-transaction pg-boss Db operation for
enqueue; review lease/heartbeat/monitor/supervise budgets together. Require real
owner outcome replay/lookup after an ambiguous effect, refusal of changed command
fingerprints, and failed/retry-exhausted delivery visibility. Synthetic remote
tables and queue completion cannot substitute for §24.6 acceptance.

- [ ] Confirm Shadows dependency before enabling writes; unavailable enforcement
  results in an unavailable capability, not a prompt-only restriction.
- [ ] Test stale proposal, changed fingerprint, revoked device/link, duplicate
  delivery, two-device confirmation, worker crash and ambiguous owner timeout.
- [ ] Implement trusted confirmation binding and atomic durable delivery requests.
- [ ] Prove assessment cannot mutate project state; prove identical retry returns
  the original authorized result without another effect.
- [ ] Run J3 with Windows N3, inspect actual owner records, then commit with evidence.

## Later slices retained in the full plan

These are delivery outlines, expanded into executable tasks after prerequisite
evidence. Do not invent signatures or tests for components not yet designed.

| Slice | Dependencies | Intended owner/path | Acceptance exit |
| --- | --- | --- | --- |
| B5 Voice and notifications | B3, real client capture/playback proof | `integrations/providers/`, `modules/notifications/` | Interrupted audio, text fallback, quiet hours, duplicate alert grouping |
| B6 Personal memory and mobile continuity | B1/B3, retention decisions, N5 | `modules/memory/`, existing topics | Preference correction/deletion, scoped derived data, same topic on desktop/phone |
| B7 Team integration | Complete local release and Rust team server | `modules/membership/`, Shadows client adapter | Two users, role revocation, isolated workspaces, conflicting changes |
| B8 Production observation | Shadows §17.12 design and scoped collector | Context/topics/notifications, named provider adapter | Sourced incident while collector runs, explicit stale/offline behavior |
| B9 Production action/cloud portability | Real owner authority and worker design | Delivery plus Rust owner integration | Confirmed action, duplicate reconciliation, measured improvement or honest failure |

Advanced integrations, enterprise hosting, managed billing and broader channels
remain in Vision. Each gets a first-consumer design; no generic framework is reserved.

## Verification and change discipline

B0 must write exact reproducible commands for the selected package manager/test
runner, schema generation, migration and PostgreSQL fixture setup. These commands
exist for the non-product probes above. B1.1–B1.4 root scripts now ran under
the authorized Linux continuation; B1.5 and later slices retain their separate
policy/integration prerequisites. Each subsequent task starts with a failing behavioral test,
implements the smallest complete path, runs focused and required gates, updates
contracts and ends with one scoped commit. Documentation checks do not require
running the unrelated Shadows full suite. Runtime changes follow their own gates.

If a probe fails: record the failure, evaluate the named alternative against the
same cases, amend the owner decision and both affected plans, then restart dependent
work. Never preserve a rejected dependency just because its scaffold already exists.

## 2026-10-11 execution ledger

Baseline: `51f4ebd283f1d8a4ecc3e4d4c98b939fc6460230`, branch `work`, clean checkout.
The user's existing-checkout/no-commit/no-push instructions take precedence over
worktree creation, commits and later-slice publication steps in this plan.

- B1.1: configuration and shutdown tests observed red against stubs, then passed.
- B1.2: schema/lock tests observed red against stubs, then passed against PG 18.4.
- B1.3: login/ticket/vault tests observed red, then passed; confidential Keycloak
  HTTPS flow and typed state/PKCE/nonce/replay refusals passed.
- B1.4: session/device/logout tests observed red, then passed. Fresh-process
  session/revocation/pending-login journeys added; exact final commands/results
  belong to the evidence report. Back-channel pending-ticket resurrection test
  observed red, then passed after persisted logout checking.
- B1.5: deferred by the user's unapproved-retention restriction. The lifecycle
  command exits 2; no deletion/purge/restore acceptance is claimed.
- Ruling: operate inline in the existing `work` checkout without commits, worktree
  changes or publication, per user authorization. Cost if wrong: uncommitted work
  needs later review/integration; no remote repository state changed.
- Ruling: identity owns an `IdentitySettings` consumer shape rather than importing
  app configuration, preserving dependency direction. Cost if wrong: later adapter
  evolution may require an explicit settings amendment.
- Ruling: pass bound logout state/redirect to the OIDC port and permit at most
  three explicit attempts within the ticket lifetime after failed provider work;
  a successful redirect remains one-use. Cost if wrong: provider-specific logout
  recovery still needs joint/production acceptance; local revocation stays final.
- Final review fix: standard back-channel form input originally refused before
  verification. Reproduced with a failing wire test, added bounded parser and
  duplicate-field refusal plus signed-token wire coverage.

The full-product roadmap and every later delivery slice remain intact.
- Final minor (deferred): generated OpenAPI omits bearer security-scheme/route
  annotations. Callers currently set Authorization explicitly; wire enforcement
  and typed consumer are tested. Add those annotations in a later protocol change.

- Final validation: `npm test` PASS 32/32, 0 failures/skips (120.186 seconds);
  typecheck, auth schema/consumer, contracts/YAML, documentation, secret scan and
  whitespace checks passed. Lifecycle remains DEFERRED, observed exit 2.

## Local-runtime continuation (2026-10-11)

The [local identity/runtime plan](2026-10-11-local-identity-runtime.md) supersedes
the original create-a-device-per-login return shape and the deferred bearer
annotation minor above. Architecture owns the enrollment semantics; the
[handoff](../../nylra-local-auth-handoff.md) owns exact local operational steps.
Existing-checkout/no-commit/no-publication and retention gates remain unchanged.
