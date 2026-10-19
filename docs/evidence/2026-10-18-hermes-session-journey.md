# Installed Hermes session and recovery journey — 2026-10-18

## Scope and environment

The human authorized the first internal backend message/recovery slice, identified
configured MiniMax and required English messages/tests. No public account facade
or desktop UI is delivered by this slice. The route stays NYLRA -> our account
backend -> internal Hermes; the current executable consumer is an opt-in backend
Docker journey, not a direct desktop connection.

Installed Hermes source: `d923a5eb487a17c0a68801bba9ef0f56c81040a8`, v0.22.2,
bootstrap Python 3.14.7; actual selected provider/model observed through native
resolution: `minimax` / `MiniMax-M3`. Docker backend client ran on Node 24.19.0.
Source root remains `C:/Users/Mohammed/AppData/Local/hermes/hermes-agent`;
no installation, upstream code modification or personal gateway activation.

`docker/hermes-host-acceptance.py` resolved configured provider credentials only
inside the native process, then isolated API state at `.local-runtime/hermes-bh1`.
The agent retained the real upstream implementation/provider client; no model reply
was mocked. The process-only agent subclass forced zero toolsets, skipped context
files, personal memory/background review and soul identity, disabled fallback and
limited output to 512 tokens/one iteration. Only synthetic English text was sent.
The provider key was never returned to Node, Docker, evidence or tool output.

An independently generated private API service key was shared via the existing
read-only local-runtime mount. This is distinct from the provider credential and
desktop account bearer. Loopback API port was 50149, reached by Docker as
`host.docker.internal`. The fixture was explicitly restarted with the same
isolated state/key/port to test durable status recovery.

## Observed native protocol results

| Check | Observed result |
|---|---|
| Capabilities | Authenticated native API reported durable run idempotency; advertised retention is 86400 seconds (not a 24-hour soak test) |
| Explicit session | Created `shadows_probe_a553098ffbfd474e8ae4e1a6d3eae1b0` |
| First English input | `Reply with exactly HERMES_BRIDGE_OK.` |
| Lost admission ACK | Test-owned proxy forwarded exactly one input, captured native acceptance and closed its client response. Internal client returned `outcome_unknown` without retry |
| Explicit identical replay | After durable-capability check, same body/key returned the same `run_635091de145541be988130c832fc624d`, `replayed:true` |
| Separate Docker process | `recover` read the persisted receipt and actual completed output `HERMES_BRIDGE_OK`, with no new submission |
| Actual API-process restart | Same completed run/result recovered after native API stopped and restarted, still without another submission |
| Conversation continuity | Second input asked which marker the previous turn returned. Actual MiniMax replied `HERMES_BRIDGE_OK` in the same stored session |
| Duplicate check | Native session messages showed two user messages and two assistant messages before the stop probe; original input appeared exactly once |
| Changed payload | Same original idempotency key with a different English input refused with conflict; no new accepted run |
| Native stop | Separate stop-probe request returned ACK `stopping`; subsequent owner status confirmed `cancelled` |
| Native SSE | Cancelled run produced a replayable `run.cancelled` event with a monotonic ID; reading after its last ID produced no duplicate IDs |

The persisted [synthetic journey receipt](2026-10-18-hermes-session-journey.json)
contains only test IDs, fixed English inputs/replies and observed stop/conflict
fields. Its file is acceptance evidence, not product account persistence. Future
account commands/bindings belong in the backend PostgreSQL assistant owner.

## Failures found and corrected

- The selected PM environment's `python.exe` launcher treated the stdin command
  differently from an ordinary interpreter. The installed bootstrap interpreter
  plus the existing selected `site_packages` loaded the environment without
  reinstalling dependencies or changing global configuration.
- Native new admission uses **`started`**, while a replay/poll may use `queued`,
  `running` or a terminal state. Initial client validation wrongly shared that
  enum. The continuation was accepted upstream but client decode failed. A new
  regression failed, then passed after keeping `started` as an admission state.
  The cancellation probe subsequently exercised that corrected new-admission path.
- The first continuation driver had not persisted its follow-up command before
  dispatch; its failed local decode therefore left no usable follow-up receipt.
  It was not blindly resent. Continuity was verified through the native session
  messages endpoint instead. The reusable driver now saves follow-up intent before
  dispatch and its admission afterward; this is still test-driver state, not a
  substitute for the future transactional account-intent owner.
- The history endpoint uses the standard **`data`** list envelope, not a
  `messages` member. Correcting that observation produced the successful duplicate
  and continuity check without another model request.

These initial failures remain recorded here; the final result does not treat
them as earlier successful client behavior.

## Verification and limits

- Eight native-client regression tests passed after observed RED, including the
  actual `started` mismatch regression. Seven existing readiness tests passed.
- Docker TypeScript, source-contract coverage, architecture-boundary and secret
  checks passed. Python fixture syntax was parsed without invoking the provider.
- Public HTTP schema/registry did not change; no client API was falsely marked
  implemented. Core/desktop sources were not changed by this backend slice.
- Messages and tests are English. Only the explicit acceptance fixture can use
  configured MiniMax; regular test suites remain owned HTTP fixtures.

Two actual completed provider replies were observed. A separate native stop
request was accepted/cancelled; no claim is made about how many provider network
requests it reached, billing or termination of an already streaming provider call.
The SSE check covered the retained cancellation event and cursor replay, not a
general streamed-token parser, backlog expiry or SSE recovery after API restart.
Completed-result persistence was proved; arbitrary in-flight restart semantics
remain untested. No production service, remote CI, public account isolation,
desktop login-to-reply journey or project-code disclosure is claimed.

The owned fixture is stopped after acceptance and its generated service key is
removed. Test database/metadata may remain in the ignored isolated directory;
personal configuration, original memory/history and installed code remain intact.
Next is [B-H2's account-scoped facade](../backend/plans/2026-10-18-hermes-backed-assistant.md#b-h2--account-scoped-backend-facade).
