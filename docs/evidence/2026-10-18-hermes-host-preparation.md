# Installed Hermes host preparation — 2026-10-18

Scope: backend Docker-to-Windows readiness and routing preparation. No model,
provider, account conversation, personal data migration or deployment exercised.

## Environment and identities

- Installed source: `C:/Users/Mohammed/AppData/Local/hermes/hermes-agent` at
  `d923a5eb487a17c0a68801bba9ef0f56c81040a8`, v0.22.2, Python 3.14.7.
- Different F-drive reference remains `ccc695635094d7615373db267b77f894d978b1a0`;
  its canonical WS contract was not applied to the installed API.
- Backend branch: `codex/independent-runtime-docs`; Docker Node 24.19.0.
- Existing backend Compose ingress, backend, account and identity databases and
  Keycloak were running healthy before the checks. No stack restart/config/volume
  destruction, extra Hermes installation or firewall change occurred.

## Observed checks

1. `hermes --version` identified the actual installation. Source inspection found
   native API health/capabilities, sessions, runs/events/stop and durable run
   idempotency support with a possible memory fallback. No `.env`/auth.json/config
   values, personal sessions or memories were read.
2. Default `127.0.0.1:8642` had no listener. Host and tools-container health checks
   reported unavailable. The new `probe:hermes` returned unavailable, exit 1.
3. Six focused Docker tests were observed failing against an unimplemented probe,
   then passed after implementation. Docker typecheck, docs, contract, secret and
   boundary checks passed. Twelve cases passed in the combined boundary/connection
   run; no full unrelated integration suite or remote CI is implied.
   A later required-bearer regression was observed failing and then fixed; the
   final focused count is seven and the final combined boundary/connection count
   is thirteen. An unauthenticated native API no longer reports ready merely
   because the client sent a key.
4. An owned synthetic HTTP listener bound Windows loopback port 62542. A random
   key stayed in a temporary file, mounted read-only to the tools container.
   `host.docker.internal:62542` plus the runtime file reference produced
   `{"state":"ready","modelCallMade":false}`, exit 0.
5. The installed managed interpreter was resolved through its own PM metadata.
   In that existing environment, an API-only `APIServerAdapter` ran with a new
   disposable `HERMES_HOME`, generated temporary key and loopback port 54647.
   Docker reached `host.docker.internal:54647` with its runtime key-file reference
   and returned the same `ready` result, exit 0. This was actual installed Hermes
   health/auth/capabilities, not a fake Hermes reply or another installation.
   After enforcing required server-side bearer authentication, the final probe
   repeated successfully against another isolated installed-API listener at
   port 50426 (`ready`, exit 0, no model call); that listener used a 30-second lifetime.
6. Both owned listeners were scheduled to close after 90 seconds; API adapter
   disconnect removes its temporary key. The temporary probe source was passed
   directly to Node/Python and is not retained as a second product codebase.

The native API's declared tools run on its own host (`server_agent`,
`split_runtime:false`). This observation rules out guessing laptop paths on the
future server; local evidence/commands still need their scoped bridge.

## Acceptance limits

No model or native session/run was submitted, no paid provider contacted, and no
actual NYLRA account/client path used the assistant. Permanent API startup and
provider/tool policy remain to be selected. Existing API 8642 configuration and
messaging services were not changed. Hermes-backed public facade, account/run
bindings, generated desktop client, durable event/recovery/stop journey and server
deployment are planned work, not results of this readiness probe.

Commands and next tasks are in the [handoff](../hermes-host-handoff.md) and
[backend plan](../backend/plans/2026-10-18-hermes-backed-assistant.md).
