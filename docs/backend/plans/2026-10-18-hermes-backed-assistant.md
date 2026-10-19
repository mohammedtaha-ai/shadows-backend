# Hermes-backed assistant delivery plan

> **For agentic workers:** Execute approved slices inline with
> `superpowers:executing-plans`; no worktrees or unrequested delegation.

**Goal:** Keep NYLRA on one authenticated backend while reusing installed Hermes
locally and the same private API contract on the server.

**Architecture:** Backend account/assistant capability owns public routing and
bindings; a native Hermes client owns protocol translation. Hermes remains a
separate internal process. Desktop local core retains hook/context/approval work.

**Tech stack:** Existing Fastify/TypeBox/Kysely/PostgreSQL, Node HTTP/SSE client,
installed Hermes v0.22.2 native `/v1/runs` API. Docker-only backend verification.

**Spec:** [assistant owner](../specs/2026-10-18-hermes-backed-assistant-design.md).

## B-H0 — Connection preparation

- Status: local preparation complete, including ephemeral actual-Hermes readiness.
- Files: `docker/hermes-connection.ts`, `scripts/probe-hermes.ts`,
  `compose.hermes-host.yaml`, `tests/integration/hermes-connection.test.ts`.
- Observed RED: six focused tests failed against an unimplemented probe.
- Observed GREEN: the same six passed in Docker; TypeScript check passed.
- A further required-bearer regression was observed failing, then fixed; the
  final seven focused tests passed. A key supplied by the client is not alone
  proof that the server requires authentication.
- Docker successfully reached an authenticated synthetic Windows loopback listener
  through `host.docker.internal`. No model call or personal key was used.
- Initial default API was unavailable. An API-only instance from the actual
  installed runtime later returned `ready` to Docker with a disposable home/key;
  no model/provider call. This is not persistent service or run/session acceptance.
- Run commands/results are in [the handoff](../../hermes-host-handoff.md).

## B-H1 — Prove installed Hermes with an isolated session

Checkpoint: core installed-runtime journey passed with configured MiniMax-M3;
see [evidence](../../evidence/2026-10-18-hermes-session-journey.md). Persistent
operator service setup is not installed. This slice implements the internal client,
not the account facade. The human explicitly authorized the message/recovery
journey and identified configured MiniMax; all messages/tests are English.

- [x] Select API-only startup/profile without altering personal gateway services,
  tools, memories or configuration. Record installed code hash and interpreter.
- [x] Run the Docker probe against actual health + authenticated capabilities.
  Secrets resolve at runtime and never enter tool output, generated code or evidence.
- [x] Record exact native request/result/event shapes and runtime idempotency
  durability/retention. Do not use the different fork's WS schema by assumption.
- [x] Prove explicit session continuity, run receipt, identical-key replay/conflict,
  disconnection, SSE gap/recovery and stop behavior. Use synthetic content; model
  acceptance is separate from no-model connection checks.
- [x] Write dated evidence and amend spec. Temporary services stop after the
  journey; the reusable opt-in acceptance drivers remain tests, not spike product code.

Execution ruling: add the first internal transport consumer and native client in
B-H1 rather than postponing that proven adapter to B-H2. Reuse target validation
in one integration owner. Account bindings, PostgreSQL intents and public SSE
translation stay B-H2. SSE restart/backlog expiry and cancellation of an actually
in-flight provider request are not proved by the narrow completed-run/control tests.

## B-H2 — Account-scoped backend facade

**Implemented normal-chat amendment (2026-10-19):** `02aca92` implements the
assistant module, migration 011, runtime Hermes composition, seven fixed public
routes and generated TypeBox contract 0.5.0. The human selected normal UI chat
first. Bounded snapshot polling replaces the first public SSE/Activity projection;
no assistant event route is claimed. Focused SQL/HTTP tests cover account isolation,
replay/conflict, unknown recovery, authority after awaits and owned-run stop.
The checklist below retains the broader design; unchecked SSE remains deferred.

**Proposed source owners:** `src/integrations/hermes/{client.ts,contract.yaml}` for
the native API; `src/modules/assistant/{service.ts,model.ts,store.ts,index.ts,contract.yaml}`
for account bindings and receipts; the existing Activity journal for backend SSE.
Create these only when the first real operation consumes them; no provider framework.

- [x] Accept the [public request](../../shared/requests/2026-10-18-hermes-backed-assistant.md).
  Add strict TypeBox shapes and registry rows; regenerate canonical OpenAPI/TS,
  fixtures and mocks. Keep planned rows unbound until implemented.
- [ ] RED: `assistant_requires_backend_account`, `other_account_binding_refused`,
  `client_cannot_select_hermes_target`, `hermes_key_never_reaches_public_output`.
- [ ] RED: `same_command_recovers_changed_payload_conflicts`,
  `unknown_run_is_not_redispatched`, `revocation_after_await_blocks_delivery`,
  `hermes_offline_keeps_login_healthy`, `stop_targets_exact_owned_run`.
- [x] Add minimal binding/receipt persistence through named migrations; no access
  to another module's private tables or direct Hermes SQLite. Native session/run
  identity is internal; account authority stays backend-owned.
- [x] Compose the selected operator-owned Hermes client in `src/app/compose.ts`.
  Route prepared intents to one brain. Keep text-only provider chat unchanged.
- [x] Serve only allowlisted assistant operations; do not proxy arbitrary URLs,
  profiles, control verbs or model tool requests. Initially refuse steer/approval.
- [ ] Add bounded event projection through Activity with backend-owned positions,
  explicit snapshots and fresh authority checks. Preserve upstream gap/outcome limits.
- [ ] Run Docker focused tests, typecheck, schema/contract checks. Update actual
  code map/contracts in the same commit, with exact-path staging.

## B-H3 — Local Docker to Windows, then same service boundary on server

- [x] Wire operator `HERMES_API_URL` and secret-file reference into runtime config
  only when B-H2 consumes them. Probe-only override does not configure dispatch.
- [x] Local: reuse Windows Hermes over the proven host route. Do not add a Hermes
  container or mount its entire home. Keep raw API private and existing stack healthy.
- [ ] Generate desktop HTTP/SSE client from our backend contract; native account
  credential handoff needs its own accepted local boundary and revocation tests.
- [ ] Exercise actual account login -> owned assistant conversation -> Hermes run
  -> backend event -> desktop reply. Separate fixtures, actual runtime and provider
  calls. No real-code disclosure until its sharing/bridge gate is implemented.
- [ ] Server: change private target/reference to its internal Hermes deployment;
  verify pinned runtime/lifecycle before publishing. Client-facing routes stay the same.
- [ ] Run one final branch gate appropriate to changed scopes; no repeated full
  suite after each task. Commit completed slices locally; no push/deploy implied.

The normal-chat B-H2 implementation and local B-H3 routing are delivered. Native
account HTTP remains in Tauri rather than introducing a sidecar bearer handoff.
Real backend/MiniMax browser acceptance and separate native HTTP checks do not
close physical GUI or server deployment gates. Mobile, multi-user memory isolation,
privileged approvals, Core mutation and the local code-evidence bridge are later
separately reviewed capabilities.
