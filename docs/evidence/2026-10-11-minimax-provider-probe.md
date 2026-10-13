# B0 real MiniMax provider supplement

Probe sources and raw artifacts named here were removed from the tree on
2026-10-13; `git show db27eb5:<path>` retrieves any of them.

Date: 2026-10-11, Asia/Aden. Four bounded calls were executed against the official
`https://api.minimax.io/v1` endpoint using requested model `MiniMax-M3`.
User supplied the root `.env`, identified MiniMax and authorized runtime loading.
Only synthetic prompts were sent. No project context or identity-provider data
was transmitted. No secret values, response text, request headers or raw SDK
errors are retained. Root `.env` is excluded locally via `.git/info/exclude` and
was verified untracked. No commit, push or deployment occurred.

## Reproduction and scope

Run from `probes/b0-2026-10-10`: `node ai-minimax.mjs`.
The script explicitly loads root `.env` at runtime and reads `API_KEY`; it does
not run in the ordinary synthetic suite. Maximum four calls, no automatic retries,
45-second timeout per call, 512 output-token limit each. Redirects are refused and
the outgoing origin is restricted to `https://api.minimax.io`.

Uses the already installed B0 AI SDK/OpenAI adapter, with Chat Completions selected
explicitly. A fetch adapter adds MiniMax's documented `thinking.type=disabled`
for M3. This is a narrow non-reasoning compatibility test, not acceptance of
interleaved reasoning or multiple tool rounds. Requested model identity was not
independently checked against the response model field.

Source: probe (`probes/b0-2026-10-10/ai-minimax.mjs` at `db27eb5`).
Measurements: JSON results (`probes/b0-2026-10-10/artifacts/ai-minimax-results.json` at `db27eb5`).
Configuration basis: [official MiniMax OpenAI compatibility documentation](https://platform.minimax.io/docs/api-reference/text-openai-api).

## Observations

| Case | Assertions observed | Result |
| --- | --- | --- |
| Completion | Two text deltas, five characters, explicit stop; reported 170 input/4 output tokens | PASS, 2766 ms |
| Intentional cancel | First text delta retained; client abort issued; abort event observed | PASS client behavior, 1435 ms |
| Partial transport fault | Actual response delivered one delta; local response reader then injected a fault; iteration threw and prior two characters remained recorded in memory | PASS injected fault, 1509 ms |
| Tool | Provider emitted schema-valid readFixture(count=1); local side-effect-free tool executed once and produced a tool-result; finish tool-calls | PASS one round, 1281 ms |

The tool request reported 441 input/27 output tokens. Usage was unavailable for
cancelled/faulted calls; no total spending estimate is inferred. Cancellation's
subsequent result-metadata access threw, so consumers must handle abort and rejected
terminal metadata as well as normal stream errors. No exact exception text was saved.
Completion checks nonempty output and terminal stop, not semantic prompt compliance.

## What this changes

B0 now has real MiniMax evidence for these four narrow cases rather than only a
synthetic provider. AI SDK Core with its OpenAI chat adapter is viable for this
tested M3 non-reasoning path. This does not establish all providers/models, sustained
load, semantic correctness, native reasoning preservation or a durable conversation.
The initial synthetic fault and invalid-tool tests remain separate evidence.

The fault was injected on the client into a real response, not an observed MiniMax
outage. Client cancellation does not prove server generation/billing stopped.
No follow-up request containing the tool result was sent; multi-turn continuity
must be proven before adopting a multi-round agent flow. A billing/account-specific
key compatibility result is not a recommendation for a subscription or license.

B1 remains gated by deployed identity/native Windows login and the real-content
lifecycle decisions. J1 rich schema/stream conformance and real Shadows authority
remain open at their respective gates. No subsequent task was started.
