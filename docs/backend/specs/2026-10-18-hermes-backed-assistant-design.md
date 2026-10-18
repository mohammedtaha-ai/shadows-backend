# Hermes-backed assistant behind the account backend

Date: 2026-10-18. Runtime placement/routing selected by the human. Exact assistant
wire/lifecycle design prepared here; the read-only connection probe is implemented.
No Hermes model turn or account-backed Hermes conversation is implemented yet.

## 1. Product and composition

NYLRA connects to shadows-backend for login and assistant services. Hermes is an
internal component of that backend deployment, with its own upstream process,
profile/session/run state and memory. The Node backend stays the account/device,
authorization and public API owner; it does not import a Python agent loop or
become a transparent unauthenticated Hermes proxy.

```text
NYLRA / AYLUL -> one backend HTTPS origin -> account/assistant service
                                         -> private Hermes native API

Development: backend in Docker -> installed Hermes on Windows
Deployment:  backend service   -> Hermes on the server's private network
```

The human explicitly excluded installing a second Hermes in local Docker. Reuse
`C:/Users/Mohammed/AppData/Local/hermes`. Do not mount its home, memories, config,
credentials or SQLite into containers. Deployment layout changes the internal
address/credential reference, not the client protocol or application rules.

There are multiple application cores: Shadows `AppCore`, AYLUL local composition,
this backend's `compose`, independent code intelligence, upstream Hermes runtime.
Sharing a deployable product does not merge databases, transactions or shutdown.

## 2. Actual installed transport

Installed v0.22.2 (`d923a5eb487a17c0a68801bba9ef0f56c81040a8`) differs from the
F-drive reference (`ccc6956`). Select installed native REST runs/session API,
not the reference's canonical WebSocket overrides. Source owner:
`gateway/platforms/{api_server.py,api_server_runs.py,api_server_run_idempotency.py}`.

| Native Hermes operation | Purpose |
|---|---|
| `GET /health` | Public reachability/identity, no model |
| `GET /v1/capabilities` | Bearer-protected capabilities; inspect actual idempotency durability |
| `POST /api/sessions`, `GET /api/sessions/{session_id}` and `/messages` | Explicit session binding/history |
| `POST /v1/runs` | Asynchronous turn with a retained `Idempotency-Key` |
| `GET /v1/runs/{run_id}`, `/events` | Outcome reconciliation and SSE |
| `POST /v1/runs/{run_id}/stop`, `/steer`, `/approval` | Named controls; each needs its own caller/authority check |

Hermes capabilities explicitly say tools execute on its server host
(`server_agent`, `split_runtime:false`). Accessing a Windows file locally in
development does not prove access to that laptop after deployment. Local project
context comes from AYLUL's scoped evidence bridge in a later slice.

The optional probe uses `HERMES_API_URL` and explicit network mode. Local Docker
uses `http://host.docker.internal:8642`; private server service may use
`http://hermes:8642`, or a reviewed verified-TLS origin. Plain HTTP is allowed only
for these explicit local/private modes. No credentials/query/fragment/path in the
configured origin, no redirects, bounded reads/deadlines. This target is operator
configuration, never a client-supplied provider URL.

The service key is resolved from an operator file at runtime; no key in public
schema, frontend, source or diagnostics. The desktop account bearer authorizes
our backend only. Never forward it as a Hermes bearer.

## 3. Public assistant capability

Keep auth-v1, current provider chat, relay and their stored data intact. Do not
rewrite their dated evidence or dispatch one turn through both engines.
The existing `ReplyPort` is a text model stream, not the native session/run API.
Use a dedicated account-owned assistant binding capability, initially one personal
profile, rather than adding fake run semantics to `ReplyPort`.

Proposed public prefix: `/v1/nylra/assistant`. The
[shared request](../../shared/requests/2026-10-18-hermes-backed-assistant.md)
owns its proposed external operations; TypeBox remains the executable schema owner.
Do not mark them `implemented` before their handlers and authorization tests exist.
Current `/topics` wire remains backward compatible; no engine-discriminator
change, provider credential transfer or history migration is implicit.

Backend binds `{accountId, conversationId}` to the selected internal profile and
upstream session. Each backend turn binds exact upstream run and idempotency key.
Clients use opaque backend IDs, never a raw internal host/profile/session/run.
No generic path/method/RPC proxy. Authorize again after awaits and before event
delivery; logout/revocation stops future results and controls. A personal pilot
does not certify multi-user profile/memory isolation.

## 4. Ownership, replay and failure

Hermes owns assistant history, model memory and tool execution. Backend PostgreSQL
owns account binding, command fingerprint/receipt and the minimal durable event
projection needed by its external SSE contract. No direct access to Hermes SQLite.
Do not replicate unrestricted histories or create another agent/planning engine.

Commit a prepared intent before dispatch; persist upstream run identity once
observed. Reuse the exact upstream idempotency key only within its verified scope,
durability and retention. Capability presence alone is not crash durability.
Upstream reservation storage can fall back to memory; probe and live tests must
name that limitation. Unknown is explicit; no blind replay or alternative engine.

Backend event positions belong to the backend, not an upstream SSE sequence.
Interrupted replay/expired backlog requires snapshot refresh and actual run status.
Stop requests address only the account-owned run; a stop ACK is not proof of model
termination. Approval/steer are disabled until separately specified, reviewed and
bound to explicit person intent. Assistant prose cannot answer local hook requests
or perform Core writes.

Missing/offline Hermes leaves account services healthy. Do not put model dependency
inside ordinary `/health` or make the Docker backend unstartable when Hermes is off.
Closing NYLRA detaches its view; backend/Hermes are remote owners. Stopping this
backend does not kill a pre-existing installed Hermes process.

## 5. Readiness and open gates

Implemented preparation: optional Compose host-target override plus read-only
`probe:hermes`; seven Docker tests cover target policy, capability/auth boundaries,
no redirect/secret projection, bounded bytes and timeout. No product endpoint or
dispatch handler is created by that probe. The
[handoff](../../hermes-host-handoff.md) owns its commands and actual outcomes.

**OPEN — actual installed API startup/auth.** No listener was present at the
default `8642` during the initial probe. A later API-only instance from the actual
installation passed Docker health/auth/capabilities with a disposable home/key.
This closes ephemeral reachability; persistent operator-selected profile/startup
remains open before real product dispatch.
Do not start all personal messaging platforms or edit `.env` merely to make it pass.

**OPEN — session/run lifecycle.** Closes before product dispatch with an isolated
session proving native create/run/idempotency replay, receipt-after-disconnect,
events, stop and process restart outcomes against this installed version.

**OPEN — provider/tool policy.** Closes before a paid/model turn or real project
disclosure with the selected profile/provider, scoped tool inventory and consent.
The preparation invokes no model and copies no personal data.

**OPEN — redistribution/server readiness.** Closes before deployment with pinned
Hermes version, private listener, runtime credential references, data retention,
backup and actual server lifecycle evidence. Local transport tests do not close it.
