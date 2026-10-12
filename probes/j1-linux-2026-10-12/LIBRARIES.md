# Library decisions from this probe — 2026-10-12

These choices separate exercised behavior from documentation review. Version
numbers below were inspected in installed package manifests or npm metadata;
they are not instructions to adopt every latest package together.

| Library | Role and evidence | Decision |
| --- | --- | --- |
| `ai` 6.0.303 + `@ai-sdk/openai` 3.0.125 | Real MiniMax Chat Completions, two-step tool use and text streaming completed. AI SDK emits `tool-error` separately from `error`; ignoring it previously allowed false completion. | Keep provider orchestration in the backend and explicitly map all terminal/error states. Use a pinned adapter and cap retries, calls and output. |
| `eventsource-parser` 4.1.2 (MIT) | Installed in NYLRA. The previous hand parser failed a CRLF + multiline-data test; the library passed that test and split-frame, terminal-error, incomplete-stream and memory-bound tests. | Adopted for the current custom SSE probe. Keep terminal meaning in our protocol rather than treating EOF as success. |
| `@ai-sdk/react` 3.0.307 (Apache-2.0) | Registry metadata pairs it with `ai` 6.0.304 and permits the current React version. Its `useChat`/transport approach can replace manual message state when using AI SDK UI message streams. No runtime acceptance in this probe. | Candidate for the product conversation UI after choosing the wire contract. The current custom `delta/done/error` stream is not automatically its UI protocol; upgrade the backend/client versions together if adopted. |
| `@openrouter/ai-sdk-provider` 2.10.0 (Apache-2.0) | Inspected registry peer dependencies accept `ai` 6 and Zod 4. Latest 3.1.0 requires `ai` 7. Provider access remains blocked by this environment's network policy. | Candidate for OpenRouter-specific routing after network access works. Pin the compatible 2.x series for this AI SDK 6 probe; installing latest 3.x would require a deliberate SDK upgrade. |
| `@microsoft/fetch-event-source` 2.0.1 (MIT) | Official README supports POST/body/headers and controlled retry. By default it closes hidden-page streams and reconnects when visible. No runtime acceptance in this probe. | Candidate for a resumable custom SSE client. Disable automatic retry of a provider-producing POST until turn IDs and idempotency exist; visibility behavior must be tested for tray/minimized desktop use. |
| `ws` 8.22.0 (MIT) | Official README provides Node WebSocket server/client and ping/pong heartbeat examples; browser clients use native WebSocket. No connector runtime acceptance in this probe. | Candidate for a Shadows-initiated outbound connector. Compare it with authenticated long polling under reconnect, duplicate delivery and delayed replies before selecting the transport. |
| `openapi-fetch` 0.17.0 + `openapi-typescript` 7.13.0 | Already pinned in backend package.json for generated wire consumers. Product conversation schema is absent. | Reuse schema generation for versioned conversation and connector contracts; do not duplicate DTOs across repos by hand. |
| Pinned ACP adapter and Rust ACP client in Shadows | Real Claude Code/ACP turn completed through MiniMax's Anthropic-compatible endpoint. | Keep ACP for the local coding harness. A NYLRA chat and a Shadows Planner session need explicit session/authority mapping before they can be treated as one conversation. |

## Sources inspected

- Installed `ai`, `@ai-sdk/openai`, and `eventsource-parser` READMEs/manifests;
  [AI SDK docs](https://ai-sdk.dev/docs) and
  [eventsource-parser](https://github.com/rexxars/eventsource-parser).
- Registry metadata for `@ai-sdk/react` 3.0.307 (`ai` dependency 6.0.304).
- Official [fetch-event-source README](https://github.com/Azure/fetch-event-source)
  and [ws README](https://github.com/websockets/ws), fetched during this probe.

The next production slice should define a stable turn ID, ordered event IDs,
terminal outcomes, cancellation, scoped owner requests and reconnect semantics.
Libraries implement parsing and transport; they cannot supply project authority
or prove that a retried action is safe.
