# Synthetic Linux cross-project conversation probe

This is a disposable local transport experiment, not a product route. It reads
one selected synthetic project through Shadows' loopback HTTP API, then lets
AI SDK 6.0.303 and `@ai-sdk/openai` 3.0.125 run a bounded MiniMax-M3 tool round
trip. The reply is streamed as SSE to the NYLRA Linux preview.

## Reproduce

1. Start a disposable Shadows daemon on `127.0.0.1:4318` and create a synthetic
   project using the documented `POST /api/projects`. Save its ID locally.
2. From this directory run `npm ci`, then `npm test`. Supply the MiniMax key
   only as a runtime `MINIMAX_API_KEY` environment variable. Set
   `SHADOWS_PROJECT_ID` to that one synthetic project's UUID. On managed
   proxy environments, Node 24 needs `NODE_USE_ENV_PROXY=1` and the inherited
   proxy/CA settings. Run `npm start`.
3. Start the NYLRA desktop Vite preview with `VITE_NYLRA_PROBE=1 npm run dev`
   from its `apps/desktop` directory and open `http://127.0.0.1:5173/`.
4. Ask for the selected project's name. `/chat` accepts at most 2000 message
   characters and streams `delta`, `done`, or `error` events from port 8765.

The probe binds only to loopback, accepts only the Vite preview and local Tauri
webview origins, limits
MiniMax to two requests with 256 output tokens each and 45 seconds overall,
and never persists the model answer or provider errors. It rejects foreign
project IDs before an owner request. Its owner read fetches the whole project
list and filters locally; this is deliberately inadequate for production. The
future connector must enforce selected-project grants at Shadows, return only
the permitted projection, and check revisions and authority for every action.

Do not use real account credentials or project content with this probe. Do not
expose port 8765 beyond loopback. Browser preview success is not native Linux,
mobile, production identity, or cloud connector acceptance.
