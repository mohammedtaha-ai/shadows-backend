# Linux cross-project conversation probe

Date: 2026-10-12. Scope: a disposable synthetic project in the three sibling
checkouts. This is an integration experiment, not B2 implementation or authority
approval. The user authorized MiniMax calls, Linux setup, test branches, commits
and pushes; no merge.

## Question

Can a Linux NYLRA preview request a cloud-side MiniMax conversation which reads
one selected synthetic Shadows project, while a separate Shadows Planner turn
runs MiniMax through its pinned ACP adapter? Which protocol and SDK boundaries
are actually exercised, and which future security/continuity guarantees remain
unproven?

## Tasks

1. On `shadows`'s probe branch, pass only explicitly named provider settings to
   the ACP child, prove the filtering in a Rust test, launch the daemon against a
   disposable SQLite database, create one synthetic project, and attempt one
   bounded MiniMax Planner turn. Record safe, redacted evidence.
2. On `shadows-backend`'s probe branch, retain a standalone Node integration
   probe using the pinned AI SDK/OpenAI adapter and a fixed Shadows project ID.
   Stream a two-step tool result from MiniMax to a local client. Exercise a
   successful selected-project read, a foreign-project refusal, and owner-offline
   failure. Persist only statuses, timings, counts, and synthetic fixture names.
3. On `nylra`'s probe branch, show the approved AYLUL idle asset in a Linux
   preview and connect it to the probe endpoint. Run the preview in headless
   Chromium. Attempt the native Linux Tauri build if dependencies permit; report
   separately whether a native Linux window actually ran.
4. Document observed behavior and the recommended production protocol in each
   repository, commit each completed task separately, push probe branches, and
   do not merge.

## Limits

- No real account, project content, persistent conversation, or production
  authority is used. No login or Windows certificate acceptance is attempted.
- The local HTTP path demonstrates data flow only. Production cloud-to-Shadows
  access still requires an authenticated outbound connector, selected-project
  grant, revisions, scope checks and owner-side authorization.
- Never log or commit MiniMax keys, raw prompts, model reasoning, response text,
  provider headers or unchecked remote data. Cap prompts, output, time and calls.
- A browser preview does not prove a Linux Tauri release or mobile acceptance.
