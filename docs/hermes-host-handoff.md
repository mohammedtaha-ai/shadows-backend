# Installed Hermes from local Docker

The human selected one public backend entry point: NYLRA -> shadows-backend ->
private Hermes. For local development, use the existing Windows installation;
do not install Hermes inside Docker or mount its personal home into containers.

Installed version observed: v0.22.2, source `d923a5eb487a17c0a68801bba9ef0f56c81040a8`,
Python 3.14.7. Its native API source has `/health`, `/v1/capabilities`, sessions
and `/v1/runs`; it differs from the F-drive canonical-WebSocket reference.

## Read-only readiness command

From this repository root, while the existing Compose ingress is running:

```powershell
docker compose -f compose.yaml -f compose.hermes-host.yaml run --rm --no-deps tools npm run probe:hermes
```

Default target is `http://host.docker.internal:8642`. The optional override adds
only the tools-container target; it does not install/start Hermes, alter current
backend dispatch or replace account routes. `ready` requires authenticated native
capabilities, not just a successful TCP/health request. Non-ready returns exit 1.

For authenticated probing, supply `HERMES_API_KEY_FILE` naming a file already
available inside the container (for example an explicitly mounted Docker secret).
The existing `/local` is read-only. No actual key is provided by this document;
the probe does not read `.env`, discover personal credentials or print file content.
Never pass a key in a URL or use the client's backend bearer for Hermes.

States: `ready`, `unavailable`, `auth_required`, `unsupported`, `invalid_response`,
or `configuration_required`. Every report includes `modelCallMade:false`.
The probe reads only `/health` and `/v1/capabilities`; redirects are refused,
response bodies capped at 64 KiB and request deadlines default to three seconds.

## Observed on 2026-10-18

- Docker TypeScript check and all seven focused connection tests passed after an
  observed failing run. Tests cover auth boundaries, strict target policy,
  capability mismatch, required bearer authentication, redirects, redacted errors, size and deadlines.
- Actual installed target `8642`: no Windows listener; host and Docker checks
  reported unavailable. No actual Hermes conversation or model invocation ran.
- An owned synthetic Windows listener on loopback, port `62542`, was reached
  from Docker through `host.docker.internal`. A temporary runtime-generated key
  mounted read-only produced `ready`; the key was never printed. This proves
  network/auth plumbing only, not actual Hermes startup or model semantics.
- Then the installed Hermes `APIServerAdapter` itself ran API-only from its existing
  managed Python environment, bound to Windows loopback port `54647` with a new
  disposable home and temporary key. The Docker probe returned `ready`, exit 0,
  `modelCallMade:false`. No model/provider was configured or invoked. This proves
  actual installed-code health/auth/capabilities, not run/session completion.
- No changes to installed `.env`, config, memories, sessions or messaging platforms.
  No new Hermes installation. Existing backend stack was healthy before the probe.

The initial test listeners self-close after 90 seconds; a final actual-API retry
after the bearer-authentication guard also passed and self-closes after 30 seconds.
The real adapter disconnects and
removes its temporary key. The disposable Hermes home contains only newly created
test state; it is not the personal installation home. No Docker/network/firewall
setting was changed. The original default API remains unconfigured; these were
ephemeral acceptance listeners, not a newly installed background service.

## Next and server parity

The [session journey](evidence/2026-10-18-hermes-session-journey.md) now proves
lost-ACK recovery, an actual MiniMax-M3 reply, completed-result recovery after API
restart, conversation continuity, conflict refusal and native stop/SSE behavior.
The internal client and public account facade are implemented (`8fbb068`, `02aca92`).
The initial public client uses bounded snapshot polling, not a public SSE feed.

Opt-in reproduction uses the installed bootstrap interpreter in a separate terminal:

```powershell
& "$env:LOCALAPPDATA/hermes/tools/python-3.14.7+20260901-win32-x64/python.exe" -I docker/hermes-host-acceptance.py --source "$env:LOCALAPPDATA/hermes/hermes-agent" --home "$PWD/.local-runtime/hermes-bh1" --use-configured-minimax
```

The fixture reports its chosen loopback port. It resolves configured MiniMax
inside Hermes, then uses an isolated home and disables tools/personal context.
It never sends that provider credential to Node or Docker. Only the independently
generated service key at `/local/hermes-bh1/service-key` reaches the test client.
This explicit fixture may call the paid provider; ordinary tests do not.

For each Docker phase supply the reported `HERMES_API_URL`, runtime
`HERMES_API_KEY_FILE`, `HERMES_ACCEPT_PAID_PROBE=yes` and a test-only
`HERMES_JOURNEY_FILE` inside the existing tools test volume. Run
`npm run journey:hermes -- submit`, then `recover` in a separate container.
Stop/restart the host fixture with the same isolated home/key/port before another
`recover`; `continue` checks history, `history` checks duplicate admission,
`stop` checks the separate stop ACK/outcome and SSE, `conflict` refuses changed
input. No client retry loop or permanent background service is installed.

Write `.local-runtime/hermes-bh1/stop` to stop the owned fixture. Its service key
is retained only across explicit test restarts; remove that generated file after
final use. Session state is isolated from the personal Hermes home. Persistent
operator startup/production policy and the account-facing client remain separate.

The installed PM environment was loaded through bootstrap `site_packages`, since
its selected environment's `python.exe` launcher did not accept the stdin probe
as an ordinary interpreter. Nothing was reinstalled or repaired globally.

The same internal client may target `http://hermes:8642` with explicit
`HERMES_NETWORK=private-service` on the server, or a verified HTTPS origin.
This is a proposed deployment address, not a created service. Public clients
continue using our backend origin. Server credentials/data/backup/lifecycle and
multi-user isolation remain separate deployment acceptance.

## Normal desktop chat runtime

From the backend root in a dedicated terminal:

```powershell
pwsh -NoProfile -File scripts/start-hermes-host.ps1
```

This uses the installed bootstrap interpreter/source, configured MiniMax provider
and an isolated `.local-runtime/hermes-chat` home at loopback port 8642. Tools,
personal context/memory and background review are disabled. Only the independently
generated service key file is mounted through the existing read-only local runtime;
no provider credential is copied to Docker. Keep the terminal running.

In another terminal, start the already configured backend with its host override:

```powershell
docker compose -f compose.yaml -f compose.hermes-host.yaml up -d --no-deps backend
```

Existing database volumes/account data are retained. Normal account clients use
`/v1/nylra/assistant` for status/list/create/snapshot/send/stop/recover. The desktop
debug launcher is `../shadows/start-chat.cmd`; see its README for builds/sign-in.
Quitting the desktop leaves the backend and Hermes running. Create
`.local-runtime/hermes-chat/stop` to stop only this owned Hermes instance.

The actual UI journey used the real backend and MiniMax with a browser substitute
for native IPC, then separately verified real authenticated native HTTP. Physical
Tauri launch was rejected by automatic execution review; it is not claimed as a
passed device journey. See
[desktop evidence](../../shadows/docs/evidence/aylul/2026-10-19-normal-chat.md).

Final local checks on 2026-10-19: Docker typecheck, schema:check (12/12), docs
and secret checks passed. The first broad suite's last captured output contained
an existing enrollment fresh-process failure; its final totals were lost during
interruption. The focused enrollment file then passed 3/3 without a code change.
The broad suite is not represented as green. Desktop build/native tests/Clippy and
the shell browser retry passed; no remote CI or production acceptance is claimed.
