# Laptop relay and provider research

Date: 2026-10-17, Asia/Aden. Research and bounded, throwaway experiments only.
Backend base `65095a6`, NYLRA base `f766b56`; both checked out on the new local
`codex/aylul-laptop-relay` branch at the user's request. No product dependencies,
routes, migrations or source modules were changed. Research documents are committed
only following the user's later explicit instruction; no push or deployment.

## Repository and existing-work findings

- Backend product composition registers authentication/device operations and
  health. nylra-v1 0.2 is a TypeBox/OpenAPI contract with a synthetic mock, not an
  implemented relay/conversation/session service.
- The old B2/B3/B4 plan was superseded on 2026-10-13. The first-release order is
  local hook/session work, backend relay/session/approval/push, then the brain,
  conversation and memory, then grants and joint integration.
- The local NYLRA branch `spec/aylul-hook-laptop` at `0d086b6` contains Rust hook,
  Node sidecar, SQLite session/step/decision storage and Tauri stdio integration.
  It is not an ancestor of current `origin/main`; no PR for that branch was found
  in the live lookup. It was inspected with `git show`, not switched, merged or
  retested. Missing files on main do not mean this work must be rebuilt.
- That branch's `sidecar-sessions` contract explicitly records that shell commands
  can contain inline secrets. Its full HookEvent also carries tool input/output,
  transcript path and messages. Cloud ingress must be an explicit projection,
  never serialization of these local objects. Local SQLite IDs/sequence semantics
  must be mapped deliberately to the cloud contract.
- Lifecycle defaults are substantially approved, but `scripts/lifecycle-gate.mjs`
  still deliberately exits 2. `readConfig` still requires synthetic data mode.
  Deletion/invalidation/restore evidence remains a real-content gate. Nothing in
  this research changes that gate or reads existing local session data.

## Official-source findings

Read on 2026-10-17:

1. [Fastify WebSocket](https://github.com/fastify/fastify-websocket): pre-upgrade
   hooks support authentication, but established-message processing is outside the
   HTTP lifecycle. Attach listeners before asynchronous initialization, catch
   message errors explicitly and set a WebSocket payload bound.
2. [Fastify SSE](https://github.com/fastify/sse): provides framing, heartbeat,
   connection cleanup and a Last-Event-ID replay callback. This callback does not
   provide a durable event store or implement NYLRA's `?after=`/410 semantics.
3. [MiniMax AI SDK](https://platform.minimax.io/docs/api-reference/text-ai-sdk)
   and [the provider](https://ai-sdk.dev/providers/community-providers/minimax):
   the default community provider uses the Anthropic-compatible interface; model
   configuration and provider choice remain host-owned.
4. [MiniMax Anthropic compatibility](https://platform.minimax.io/docs/api-reference/text-anthropic-api):
   M3 thinking is off when omitted on this interface and enabled by `adaptive`.
   Thinking counts toward max_tokens; keep complete thinking/tool blocks across
   rounds. This differs from the documented OpenAI-compatible M3 default.
5. [MiniMax tool continuity](https://platform.minimax.io/docs/guides/text-m3-function-call):
   preserve the complete assistant response, including reasoning data, rather than
   reconstructing only text and a tool name.
6. [AI SDK settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) and
   [loop control](https://ai-sdk.dev/docs/agents/loop-control): use explicit step,
   retry, output and cancellation limits. Client cancellation is a distinct claim
   from provider computation/billing termination.

These sources support the candidate mechanisms. The test results below establish
only the named configurations, not all versions or model providers.

## Isolated environment

Experiments live under ignored `.test-runtime/2026-10-17-relay-spike/` and ran in
throwaway Docker containers using the already available `node:24.19.0-bookworm`
image with `--pull never`. They expose no host port and mount only this scratch
directory. Dependency installation received no credential or root source mount.

| Dependency | Exact probe version |
| --- | --- |
| Fastify | 5.12.5, matching the product |
| @fastify/websocket | 11.3.4 |
| @fastify/sse | 0.6.1 |
| ws | 8.18.3, probe client |
| AI SDK | 6.0.303, retained B0 baseline |
| vercel-minimax-ai-provider | 0.0.2 |
| zod | 4.6.5 |

The current npm registry metadata was read before installation. The generated
scratch lockfile captures transitive resolution. The product package.json and
lockfile are unchanged; these are candidates for a reviewed implementation plan.
The MiniMax provider delegates to an internal Anthropic adapter and pins its own
dependency versions, so upgrading it needs the same continuity regression.

## Transport experiment: 8/8 passed

Executed without loading the provider key:

```text
docker run --rm --pull never --mount type=bind,source=<scratch>,target=/probe
  --workdir /probe node:24.19.0-bookworm node transport.mjs
```

| Observed assertion | Result |
| --- | --- |
| Missing synthetic authorization refuses the upgrade with 401 | PASS |
| First frame survives a deliberately held asynchronous initialization | PASS |
| Strict envelope refuses extra account identity and malformed JSON | PASS |
| SSE `?after=1` returns exact IDs 2 and 3 | PASS |
| Unknown cursor refuses with 410 before committing stream headers | PASS |
| Exponent syntax and unsafe integers refuse with 400 | PASS |
| 2KiB frame under a configured 1KiB WS bound closes with 1009 | PASS |
| Explicit post-upgrade authorization rejects a revoked synthetic peer with 1008 | PASS |

The identity state and event history were synthetic and in memory. This does not
prove B1 integration, transaction atomicity, durable replay, crash recovery,
distributed revocation, backpressure under load, actual mobile delivery or TLS
through the existing ingress. These belong in the implementation acceptance path.

## Real provider experiment: two scenarios passed, four requests total

The user authorized using the existing root `.env` key for experimentation. Only
the variable name API_KEY was exposed during configuration inspection; the value
was supplied to the test process through Docker `--env-file .env`. It was not
copied into source, documentation, command arguments, test artifacts or output.
The existing file's modification date predates the earlier MiniMax experiments.
No other credential source, cloud resource or real user/project content was used.

Only the fixed official endpoint
`https://api.minimax.io/anthropic/v1/messages` was permitted, requested model
`MiniMax-M3`. Limits: four requests total, retries zero, 32KiB serialized input,
768 maximum output tokens per tool request, 256 for the cancellation request,
35 seconds per request and 120 seconds overall. Redirects were refused.

- **Sequential tools:** three streamed model requests, two side-effect-free local
  tools. Runtime-random numeric values and proof were absent from the prompt;
  the second tool validated their exact use and the final answer matched its
  result. Three steps completed with `stop`.
- **Complete history:** the second and third requests were compared to the raw
  preceding streamed assistant blocks in memory. Thinking text/signature and
  tool identity/name/parsed input matched exactly. Prior thinking block counts
  were one and two respectively. A lossy follow-up would have been refused before
  another provider request.
- **Cancellation:** fourth request disabled thinking, retained one text character
  and emitted the SDK abort event after client cancellation. No conclusion about
  stopped remote computation or billing is drawn.

The SDK reported 152 output tokens and zero input tokens for the completed tool
flow. Zero input is not a credible complete usage measurement for nonempty
requests; usage mapping requires separate investigation before cost reporting.
Cancelled-call total usage is unavailable. No spending total is asserted, and the
returned model identity was not independently verified beyond the requested
official endpoint/model configuration.

Artifacts contain only counters, booleans, bounded configuration metadata and
sanitized error categories. No raw model reasoning or response text is persisted.
No old OpenAI-compatible B0 flow was rerun; this experiment uses a new
Anthropic-compatible adapter configuration, including its own cancellation check.

## Recommendation and next boundary

Use the existing Fastify application with an outbound laptop WebSocket and the
already agreed mobile HTTP/SSE contract. Keep durable event/ack/idempotency rules
in the owning PostgreSQL-backed services, rather than assigning them to transport
plugins or building a generic event bus. The current authentication owner remains
the authority for account/device validation and revocation after upgrade.

First implement a small slice: paired laptop, online/offline state, summarized
sessions and replayable session/account events. Approval dispatch, push and brain
integration follow as separate paths. This preserves the first-release order
while giving each path independently meaningful acceptance.

The draft [relay specification](../backend/specs/2026-10-17-laptop-relay-design.md)
records the proposed scope and review decisions. Its Native agreement must use
the existing hook/sidecar branch as input and be accepted before dependent code.
Real content remains blocked by lifecycle evidence. This research did not start
product implementation, change an API schema, or authorize publication.

User clarification, 2026-10-17: MiniMax is only an experiment provider and is not
the selected primary model. The current results select no production model.
Canonical technical contracts/endpoints remain code-owned and generated; the
written specification now explicitly requires route/export consistency and
provider-independent host injection. The user subsequently authorized local
commits and an Astra/low review of this specification and related artifacts.

## Requested independent review

Completed 2026-10-17 by `gpt-6-astra` with `low` reasoning effort, explicitly
requested by the user. The reviewer was read-only and inspected immutable ranges
backend `65095a6..b03550f` and NYLRA `f766b56..93d787f` after both commits existed.

No confirmed actionable finding or scope-blocking contradiction was reported.
The reviewer checked code-owned generation requirements, distinction between
declared/mock and implemented operations, provider-independent model injection,
modular ownership, explicit open Native decisions and local-to-cloud projection
limits. It also checked generated permission identifiers, equality of the two
Tauri schemas, archived HTML hash against its README, and whitespace for both diffs.

This was a static review. It did not independently rerun the eight transport
cases, four provider calls or schema generator, and did not establish Native
agreement, runtime/device behavior, CI or production acceptance. The author
separately reran development `cargo check --locked` successfully with a clean
NYLRA tree afterward, and the Docker documentation check passed 35 files.
The specification remains proposed and the shared request remains asked; static
review does not approve an unresolved protocol or begin product implementation.
