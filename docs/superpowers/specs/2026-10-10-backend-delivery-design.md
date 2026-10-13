# Backend delivery design

Companion amendment, 2026-10-13: AYLUL is an independent companion and its
first release is chat, live agent sessions and approvals on desktop and phone
([NYLRA delivery spec](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#independent-companion)).
§4's nylra-v1 0.2 is that release's contract. Earlier amendments below remain
the record of their dates.

Joint native amendment, 2026-10-11: NYLRA consumes auth-v1 1.1.0 in Rust with
protected enrollment/session storage; [joint evidence](../../evidence/2026-10-11-joint-native-auth.md)
owns measured acceptance and browser limitations. Session infrastructure failure
is retryable HTTP 503, distinct from a genuine 401 refusal. This does not close
B1.5, production release, real identities or project authority gates.

Date: 2026-10-10; evidence amendment: 2026-10-11, Asia/Aden.
Status: B0 partially verified; B1.1–B1.4 backend implementation and Linux
acceptance authorized by the 2026-10-11 continuation. Use the [B1 evidence](../../evidence/2026-10-11-b1-linux-acceptance.md)
for actual results. B1.5 remains deferred until retention approval. Windows
acceptance belongs to NYLRA/later joint integration and does not block this work.
No MiniMax calls, B2+, sibling edits, deployment, commit or push are authorized.

The [closure follow-up](../../evidence/2026-10-11-b0-closure-followup.md)
separates retained Windows observations from cloud Keycloak 26.8.0 results.
Reuse passed HTTP/SQL/jobs, synthetic binding/device mechanics, MiniMax
non-reasoning and think-tag reasoning tool continuity, and later-round client
abort. Windows system-browser/native return and production identity operations
remain unverified. Lifecycle defaults in architecture are proposed, not approved.

## 1. Ownership and intent

This file owns backend delivery gates and library evaluation. Existing owners:
[architecture](../../architecture.md) for product authority, data lifecycle and
deployment; [source structure](../../source-structure.md) for file placement;
[source contracts](../../contracts/README.md) for inspected implementation.
Amend those owners when an experiment changes their decisions; do not copy rules.

Build the cloud application that lets Windows NYLRA explain a selected Shadows
project with versioned sources, continue durable topics and request owner-validated
actions. Preserve mobile, voice, teams and Production in later complete slices.
Windows first does not make mobile protocols an afterthought.

## 2. Experiment gate B0

Use an isolated disposable environment and synthetic data. Record exact versions,
commands, machine, results, observed limits and license information. Provider
availability must be established before a real-provider claim; a fake is useful
for fault injection but cannot close a real-provider acceptance gate.

| Candidate | Proof required | Alternative if unsuitable |
| --- | --- | --- |
| Fastify + schema-derived OpenAPI | Stream start/chunk/end/error; cancellation; request/response validation; TS and Dart consumable schema | Evaluate Hono with the same fixture; do not silently replace the architecture |
| PostgreSQL + Kysely/pg | Scoped queries, explicit transactions, concurrent revision conflict, rollback and migration from empty/previous schema | Compare direct pg or Drizzle; select one store approach and one established migration tool |
| pg-boss | Domain write and enqueue commit or roll back together; crash after remote effect recovers through idempotency; retry exhaustion visible | Evaluate managed queue plus transactional outbox only if warranted |
| AI SDK Core | Actual supported provider stream, stop, disconnect, tool-call validation, partial output and usage/error semantics | Direct SDK for unsupported provider semantics behind the same consumer boundary |
| Established OIDC provider/client | System-browser login for Windows, one-time return binding, expired/revoked session and logout; future mobile support | Compare another maintained implementation/provider; do not invent authentication |

Evaluate SQL migration support explicitly; a query builder is not proof that raw
SQL migrations, locking and rollback satisfy our needs. Record which migration
tool owns history; do not run competing migration histories for the same tables.

HTTP/API schemas are owned at the transport boundary, exported as versioned
artifacts. Generate TS consumers first and compile one Dart consumer during B0.
Stream/reconnect envelopes must be documented even when OpenAPI generation alone
cannot describe all replay semantics. Prefer standard HTTP plus an explicitly
authenticated outbound connector; choose its transport from measured behavior.

**Exit:** select/reject each candidate, pin compatible versions, close or retain
named OPENs honestly, then amend this spec and every dependent plan task. A failed
candidate blocks dependent tasks, not independent character/UI work. Do not build
the application against an unproven choice and promise a later rewrite.

### B0 evidence amendment - 2026-10-10

Retained [non-product reproduction](../../../probes/b0-2026-10-10/README.md)
pins Node 24.15.0 and the inspected dependencies. Fifteen local assertions pass;
the original actual-provider/deployed-identity blockers have later supplements.
B0 remains partially verified because Windows native and production identity
acceptance are open; see the current amendment below. B1 remains gated. The evidence report
owns observations, exact versions, decision table and review prerequisites.

- Use one canonical TypeBox wire schema for validation and OpenAPI export at the
  reviewed HTTP boundary. Fastify serialization does not enforce all constraints:
  validate outgoing objects and each raw stream envelope explicitly. Generated TS
  types alone do not validate untrusted JSON. The compiled Dart flat fixture does
  not select a general generator or prove rich J1/mobile compatibility.
- Kysely/pg passed real transactions and conditional revision conflicts.
  node-pg-migrate owns cloud SQL migration history, advisory exclusion and ordered
  upgrades; pg-boss owns its internal schema migrations. Do not create a second
  application history or let product modules access queue internals.
- Domain persistence and enqueue must share the workflow's transaction connection
  through the declared pg-boss Db adapter. Explicitly review expiry, heartbeat,
  monitor and supervise intervals: changing supervise alone does not bound recovery.
  Reconcile a remote durable outcome using stable identity/fingerprint before
  retrying an uncertain effect. This still requires real Shadows proof at B4.
- AI SDK Core 6.0.303/OpenAI adapter 3.0.125 pass synthetic tests only. An iterator
  may throw after text rather than yield an error part. Preserve partial output
  and persist one truthful complete/failed/cancelled terminal result on either path.
  Tool input validation is not project authorization. Real provider selection stays
  OPEN until actual stream, stop, faults and relevant tools are observed.
- openid-client 6.8.8/oidc-provider 9.12.2 pass synthetic public-client PKCE/state/
  nonce, expiry, replay, refresh revocation and logout cases. No hosted provider is
  selected. Native Windows return handling, persisted identity/device sessions,
  issuer configuration, production keys and immediate revocation policy require
  separate evidence. Review clock tolerance explicitly; the fixture uses zero.

No alternative HTTP/store/queue stack was needed after explicit schema validation
and recovery-timing configuration. Rejected older AI pins were patched and rerun;
unexecuted alternatives are not ranked. All library acceptance is bounded by the
report's cases, not a reduction of the full product direction.

### B0 evidence amendment — 2026-10-11 cloud continuation

- Conditionally select AI SDK 6.0.303 / @ai-sdk/openai 3.0.125 for the tested
  MiniMax-M3 Chat Completions path. Real completion, injected partial fault,
  client cancellation, semantic tool-result use and think-tag reasoning continuity
  passed. Default the first product journey to non-reasoning; any reasoning path
  must preserve the observed assistant content and tool input semantics.
  reasoning_split=true, separate reasoning fields, provider-side stopped billing,
  model identity and contractual retention are not established. No additional
  MiniMax calls were needed in this cloud continuation.
- Recommend Keycloak 26.8.0 / openid-client 6.8.8 conditionally. Cloud disposable
  server cases passed; wrong state/nonce are relying-party validations, wrong
  verifier/reused code/expired access/revoked refresh are server refusals. The
  development H2 restart proves refresh persistence for that fixture only.
  oidc-provider 9.12.2 remains synthetic test tooling, never product authentication.
- [Architecture section 5](../../architecture.md#5-accounts-instances-and-project-selection)
  owns all proposed account/session and content-lifecycle defaults. Do not copy
  the policy table into delivery or client documents. Identity deployment review,
  confidential-backend registration, native acceptance, key rotation/restore and
  user policy approval remain explicit gates.

### B1 scope and selected interfaces — 2026-10-11 Linux continuation

B1 delivers only process composition, account mapping, login return exchange,
backend session/device operations, identity deletion and minimal identity audit.
No project linking, conversation store, personal memory, queue, model adapter or
Shadows authority implementation is part of B1. Content owners adopt section 5
policy when their first runnable slice is implemented; B1 cannot prove deletion
of stores that do not exist. Keep real-content ingestion disabled until those
owners' deletion/invalidation and backup acceptance pass.

Use a confidential `shadows-backend` OIDC client with client_secret_basic,
S256 authorization code and a single exact backend HTTPS callback, with issuer
configuration fixed by operator review. Desktop/mobile have no embedded client
secret and receive no provider tokens. The proposed backend-mediated native
return differs from B0's public-client fixture and must be accepted with NYLRA.
Use openid-client discovery/buildAuthorizationUrl/authorizationCodeGrant,
tokenRevocation/buildEndSessionUrl; use jose 6.2.12 only for signed back-channel
logout verification (prospective dependency; B0 did not execute that handler).
No deprecated Keycloak Node adapter or custom JWT signature implementation.

The identity module owns these proposed TypeScript interfaces; paths/tests and
exact execution steps live in [B1 tasks](../plans/2026-10-10-backend-initial-plan.md#b1-authenticated-application-and-data-lifecycle--unstarted):

```ts
type VerifiedIdentity = { issuer: string; subject: string; providerSessionId: string };
type Principal = { accountId: string; deviceId: string; sessionId: string };
type NativeLoginRequest = {
  platform: 'windows'; returnUri: string; returnChallenge: string;
};
type LoginStart = { attemptId: string; authorizationUrl: string };
type LoginReturn = { returnUri: string; ticket: string };
type SessionGrant = { handle: string; principal: Principal; expiresAt: string };
type LogoutResult = { local: 'revoked'; provider: 'complete' | 'pending'; browserLogoutUrl?: string };
interface OidcPort {
  authorizationUrl(binding: { state: string; nonce: string; verifier: string }): Promise<string>;
  exchange(callback: URL, binding: { state: string; nonce: string; verifier: string }): Promise<{
    identity: VerifiedIdentity; providerTokens: { refreshToken: string; idToken: string };
  }>;
  revokeAndLogout(tokens: { refreshToken: string; idToken: string },
    callback: { state: string; redirectUri: string }): Promise<{ logoutUrl: string }>;
  verifyLogout(jwt: string): Promise<{ issuer: string; sid: string; jti: string; issuedAt: number }>;
}
interface IdentityService {
  beginLogin(input: NativeLoginRequest): Promise<LoginStart>;
  finishLogin(callback: URL): Promise<LoginReturn>;
  redeemReturn(input: { ticket: string; returnVerifier: string }): Promise<SessionGrant>;
  authenticate(handle: string): Promise<Principal | null>;
  logout(principal: Principal): Promise<LogoutResult>;
  logoutAll(principal: Principal): Promise<LogoutResult>;
  backchannelLogout(jwt: string): Promise<void>;
  deleteAccount(principal: Principal): Promise<{ deletionId: string; state: 'pending' }>;
}
interface DeviceService {
  list(principal: Principal): Promise<ReadonlyArray<{ id: string; revoked: boolean }>>;
  revoke(principal: Principal, deviceId: string): Promise<void>;
}
```

`providerTokens` exists only transiently at the adapter/service boundary and is
encrypted before persistence; it never becomes a transport result.
`VerifiedIdentity` is produced only after signature/issuer/audience/nonce checks;
`Principal` is produced only after persisted account/session/device validation.
Service callers never construct either from request account fields. Return tickets
are 256-bit random values, stored hashed, valid for 60 seconds and consumed with a
conditional transaction. Login attempts expire after five minutes and are claimed
once *before* code exchange. The native return challenge uses S256 and the
native-generated verifier stays on the originating client. Reject unknown platform,
foreign/fragmented/credentialed return URI, non-loopback host, wrong fixed callback
path, unknown state, expired attempt and replay. Bind only IPv4 `127.0.0.1` with
an explicit ephemeral port and `/oidc-return`; no wildcard redirect or arbitrary
URL redirect. Flutter support adds a separately reviewed platform/return scheme
later, without weakening Windows validation.

Use standard opaque bearer authorization for native backend requests, not provider
JWTs or a webview cookie. Return tickets carry no provider tokens or account claims.
Browser callback responses use no-store and no-referrer and do not log query strings.
Login errors expose stable refusal codes only. A lost/ambiguous code exchange
requires a fresh login, never replay or automatic token-exchange retries.

A workflow owns the PostgreSQL transaction and calls declared operations on
identity/devices. Devices never read identity tables. Audit writes are owned by
identity operations and invoked transactionally by device revocation, without
another generic audit service. Back-channel logout must require RS256, exact
issuer/audience, the logout event, sid, bounded iat, no nonce and one-time jti.
Local revocation is authoritative immediately even if provider logout fails.
`browserLogoutUrl` is a backend URL containing only a one-use logout ticket, never
a provider ID token hint. The backend consumes that ticket and redirects the
system browser to the standard provider end-session endpoint; completion remains
pending until provider revocation and the bound logout callback finish. The
provider hint stays in the standards-based browser redirect, never the native
webview/IPC or conversation channel.
Provider account disable is distinct from logout; do not assume disabling emits
a back-channel event. The local continuation requires confidential refresh-token
introspection before return redemption and each authorized operation, without a
positive cache. Inactive or unavailable provider state refuses authorization.
Revocation-only operations verify persisted local authority and remain available
without the provider. Active sessions renew encrypted provider tokens at most
once per minute, preserving issuer/subject/sid binding and backend absolute expiry.
Back-channel delivery independently persists session revocation. Re-enabling a
provider account is not local enrollment/session revival: persisted revocations
still refuse; sessions denied only by provider inactivity can become usable again
unless explicitly revoked. An operator needing permanent session revocation must
also request provider logout or backend revocation.

### Local runtime and enrollment continuation (2026-10-11)

The user authorizes choosing and implementing enrollment semantics and a local
Windows Docker runtime using the existing checkout. [Architecture section 5](../../architecture.md#5-accounts-instances-and-project-selection)
owns the account/installation/session distinction and explicit new/reuse proof.
Return redemption now requires `enrollment: {mode:'new'} | {mode:'reuse';credential:string}`;
new enrollment alone returns `enrollmentCredential` in SessionGrant. This is auth-v1
revision 1.1.0, replacing the unintegrated 1.0 shape. Protected operations declare
OpenAPI HTTP bearer security; safe examples and refusals are backend-owned.

[Local plan](../plans/2026-10-11-local-identity-runtime.md) owns execution steps.
[NYLRA handoff](../../nylra-local-auth-handoff.md) records exact HTTPS addresses,
current-user certificate trust prerequisites and native sequences. The Compose
runtime uses separate persistent application/Keycloak PostgreSQL databases and
credentials, explicit node-pg-migrate commands, and a separately scoped Linux
test-runtime volume. Keycloak is the only owner of its storage. No host Node,
host PostgreSQL, wildcard callbacks, hardware fingerprint or trust bypass exists.

Actual Compose acceptance must prove provider-originated back-channel delivery
and separately measure account disable. A Linux form driver remains distinct
from Windows browser/native and actual NYLRA acceptance. B1.5 remains deferred;
no retention defaults, real identity/content, B2+, deployment, commit or push is
authorized by this continuation.

**Gate matrix amendment (2026-10-11):** the user authorized backend implementation
and Linux acceptance using the existing checkout/branch. Windows NYLRA N0/N2
system-browser/secure-store/return acceptance is a later joint integration gate,
not a Linux implementation prerequisite. Retention-dependent work remains deferred;
only synthetic identity data may run in the current application. Production release additionally
requires dedicated identity PostgreSQL, TLS, key rotation, restore, provider terms
and deletion tests. Missing siblings/native access is an external prerequisite,
not permission to implement their side here. J1 rich TS/Dart and Shadows §1.7/§24.6
remain B2/B4 gates; B1 authentication never grants project authority.

## 3. Application boundaries

Use the source-structure owner's modular application. HTTP handlers and job workers
call identical service operations. Framework/provider objects stay at boundaries.
Our modules own topics, permitted context, source provenance, confirmation records,
delivery outcomes and notification policy. Existing libraries own general HTTP,
SQL access, migration mechanics, job execution, authentication and model transport.

Do not publish a custom framework or general-purpose SDK at the start. A small
internal interface is justified by an actual adapter or test consumer. Extract a
versioned library only when another real consumer needs independent reuse. Shared
wire artifacts are not shared domain implementation. Rust Shadows remains the
owner of personal/team project rules and operational action authority.

## 4. Joint protocol contract J1

Before B2/client N2, write versioned schemas plus passing/invalid examples for:

- Account/device session and project-link scope, without provider secrets.
- Topic identity and instance/workspace/project/work/thread association.
- Source reference with version, acquisition time, permission scope and freshness.
- Snapshot with replay cursor; ordered event with stable identity and sequence.
- Conversation stream with explicit terminal outcome and persisted partial output.
- Command identity, operation kind/schema version, normalized fingerprint and
  expected source basis; receipt is separate from owner acceptance/completion.
- Error/refusal, source offline, authorization revoked and resnapshot required.

Pin producer schema revision and consumer artifact versions. Test reconnect at the
snapshot boundary, duplicates, gaps, expired cursor, client revision mismatch and
cross-project substitution. A new protocol version is introduced only for a real
compatibility need. Do not assume existing Shadows SSE is this external protocol.

### nylra-v1 0.2, the first release's client contract (2026-10-13)

Decided with Mohammed on 2026-10-13. One contract serves the Flutter app and
AYLUL desktop, so both are built against it in parallel. Its source is TypeBox
in `src/transports/http/`; OpenAPI, TypeScript and the fixtures are exported
from it, and Flutter generates Dart from the OpenAPI file. A route takes its
schema from the same operation table. The 0.1.0 draft on the deleted
`ccr-189943e1-8l71wu` branch is its starting point.

| Group | Operations |
| --- | --- |
| Sign-in | auth-v1, unchanged |
| Push | Register or remove this phone's FCM/APNs token |
| Links | Pair a laptop by the code AYLUL desktop shows; list linked laptops with online state; unlink |
| Chat | Topics with an account cursor; send a turn; topic SSE ending in exactly one of `done`, `error`, `cancelled`; cancel |
| Sessions | Per laptop: agent (`claude_code`, `codex`), project, state (`running`, `waiting`, `ended`, `offline`), last step; a session's step snapshot, then SSE after a cursor |
| Approvals | Pending requests; decide with `allow` or `deny` and a `commandId`; the answer names the decider, `person` or `aylul_grant` with the grant id; a request already decided or expired refuses with 409 |
| Grant revocation | Revoke a grant by id; there is no create or widen operation |
| Account SSE | Approval requested, approval resolved, session changed, laptop online, laptop offline |

Removed until a slice needs them: file attachments and Planner reply drafts.

A step carries the tool name, file path and a one-line summary; no diff or file
content leaves the laptop until architecture §5's lifecycle closes. An unknown
or expired cursor answers `resnapshot_required`. The account comes from the
session, never a body field. A mock server in this repository replays the
fixtures, SSE included, so the Flutter app is built before the routes exist.
Real content waits for architecture §5's lifecycle defaults to be approved; the
first release's acceptance with real agent sessions needs that approval first.

## 5. Complete first journey

Sign in on Windows, link one explicitly selected project, open a topic after a
direct Planner conversation, retrieve permitted current-work evidence and receive
a streamed explanation with source links. Restart the client/backend/connector
and reopen the durable topic. Show source offline or revoked state truthfully.

An explanation can interpret sources but cannot grant a capability. Personal
preferences do not ingest private project facts into account-wide memory. Topic
retention, deletion and derived-cache invalidation must be decided in architecture
section 5/13 before real user content persists.

## 6. Later delivery gates

Assessment and confirmation depend on real Shadows §24.6 enforcement. Require a
restricted assessment context, exact trusted-client confirmation, owner revalidation
and replay of identical commands. Revocation must block queued dispatch and reads.
An unavailable owner leaves delivery pending; it does not turn cloud code into owner.

Voice adds independent STT/reasoning/TTS adapters, cancellation and text fallback.
Notification policy groups incidents and respects quiet hours, scope and urgency.
Mobile continues the same topic after Windows acceptance. Team identity is added
alongside the server Rust owner, never by reimplementing project rules here.
Production follows Shadows §17.12: observation first, then separately authorized
action and measured verification. Hosting/deployment choices remain separate from
the decision to integrate with AWS for the user's application.

## 7. Verification and unresolved decisions

Use real disposable PostgreSQL for store/transaction acceptance. Unit fakes cover
provider faults; separate real-provider evidence covers stream/cancel behavior.
Real Shadows integration and Windows acceptance are required before claiming an
end-to-end journey. Tests must prove scope isolation, replay, stale refusal,
revocation and worker interruption; source contracts cite inspected test bodies.

OPENs close at these triggers: B0 evidence and review close library selection;
native identity/operational prerequisites keep that gate open. User review and
B1 identity evidence close only their named prerequisites; later content owners
must prove approved lifecycle behavior before real ingestion; J1 closes external schema/reconnect rules; B4 closes
remote authority proof with Shadows; voice/mobile gates close on actual devices.
No raw provider/session values belong in prompts, logs, evidence or source control.

Research: [candidate record](../../../../nylra/docs/evidence/2026-10-10-coucou-and-library-research.md).
Companion: [NYLRA spec](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md).
