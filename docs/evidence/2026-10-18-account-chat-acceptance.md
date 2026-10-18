# Account chat - local synthetic acceptance

Date: 2026-10-18. Branch: `backend/account-chat`.
Status: focused Keycloak retest passed unchanged; sequential full-suite run in progress.
Source baseline before B-10: `50656733cf61bd320d68a8873d352e8a2f15adb2`.

## Observed journey

`tests/journeys/account-chat.test.ts` performs login, callback and one-use return
redemption through actual loopback HTTP, using a synthetic OIDC port. It uses
the generated `nylra-v1` client to save an encrypted connection, set the account
default, create a text topic and submit a turn. Topic SSE delivers the persisted
reply. A second turn streams until explicit Stop; its committed prefix remains
partial. A fresh backend child process, with a different PID and the same
isolated PostgreSQL, verifies the identical saved snapshot and deletes the
topic. Later reads return 404. The child makes zero provider calls, and the
journey removes its connection and restores any prior default.

The first and second turns each make exactly one real HTTPS request to an owned
fake provider through `aylul-brain` and the OpenAI-compatible adapter. The second
fixture streams until aborted. The provider key, identity secrets and text are
synthetic. No real provider, development database, ignored `.env`, or runtime
secret file is used by this automated journey.

The test injects a public DNS answer for its synthetic saved destination. Its
host ReplyPort explicitly routes that destination to the owned loopback HTTPS
fixture. This fixture routing bypass is local to the test host; production
destination validation is unchanged. Destination refusal and verified/pinned
HTTPS behavior have separate provider-destination/provider-adapter tests.
The journey's backend listener is loopback HTTP; its model endpoints use verified
HTTPS. It is not evidence of the running Compose ingress or a real browser/device.

## Commands and results

All Node execution used the Compose `tools` container (Node 24.19.0), root
lockfile/workspace dependencies and disposable PostgreSQL 18.4 fixtures.

| Command | Observed result |
| --- | --- |
| `docker compose run --rm --no-deps tools node --import tsx --test tests/journeys/account-chat.test.ts` with incomplete flow | RED: first HTTPS provider request count was 0, expected 1, after successful HTTP login |
| Same focused command with the implemented flow | PASS 1/1; reply, Stop, fresh process restart and deletion assertions passed |
| `docker compose run --rm --no-deps tools npm test -- --test-concurrency=4` | First run: 151/152 passed, one failure, 217.6 seconds; all suite globs included, only process concurrency bounded |
| `docker compose run --rm --no-deps tools node --import tsx --test tests/integration/laptop-link-wire.test.ts` | Reproduced the sole failure: generated schema differs from the committed laptop-link snapshot |
| `docker compose run --rm --no-deps tools npm run schema:laptop-link` | Regenerated the two frame artifacts; only eight already-canonical refusal categories were added |
| Same focused laptop-link freshness command after regeneration | PASS 1/1, including intentional-drift refusal |
| Complete suite rerun with the same command | 151/152 passed, one failure, 259.9 seconds; laptop-link freshness and account chat journey passed, Keycloak fixture missed its existing readiness deadline |
| `docker compose run --rm --no-deps tools node --import tsx --test tests/journeys/keycloak-login.test.ts` | PASS 1/1 unchanged, 102.1 seconds test time; actual owned Keycloak HTTPS/login/restart/logout assertions passed |
| `docker compose run --rm --no-deps tools npm test -- --test-concurrency=1` | In progress; every suite glob retained, sequential files to match isolated fixture readiness conditions |
| `docker compose run --rm --no-deps tools node --import tsx docker/chat-journey.ts --help` | PASS; help only, no login, key-file read or provider call |
| `docker compose run --rm --no-deps tools npm run typecheck` | PASS after frame regeneration |
| `docker compose run --rm --no-deps tools npm run check:contracts` | PASS 1/1, including YAML parsing and real symbol/test references |
| `docker compose run --rm --no-deps tools npm run check:docs` | PASS, 45 files; 14 external sibling links remain explicitly unverified |
| `docker compose run --rm --no-deps tools npm run check:secrets` | PASS, zero findings |

The first full-suite failure is generated-artifact drift. The laptop-link schema
reuses the HTTP owner's `NylraRefusal` code shape. B-1 expanded those codes, while
the committed laptop-link schema/declarations retained the earlier enum. The
wire freshness assertion correctly refused that stale snapshot. Human-approved
scope added only the two generated frame artifacts. Regeneration changed no
source implementation or test assertion. The second full run passed that check
and the chat journey, but the existing Keycloak fixture remained running without
becoming ready within its 90-second startup deadline. Its diagnostics reported
no port conflict, permission error or server-start failure. The same Keycloak
test passed in the first complete run and passed again alone without edits.
That is evidence of transient readiness sensitivity, consistent with resource
pressure during parallel fixture startup; it is not a proven production defect.
The final full run uses sequential files. No timeout or assertion has been
relaxed. A clean complete run is still required before B-10 can be marked done.

## Prior task checks

B-7 (`4e59fd3`) completed owner admission, replay, context bounds and deletion.
B-8 (`d39e951`) completed fenced dispatch, partial Stop and interruption recovery;
its final dispatch tests passed 13/13. A real row-lock regression reproduced a
late write with a captured old Date, then proved post-lock clock checks reject
it. Both isolated PostgreSQL fixture modes now use UTF8; multibyte output bounds
remain tested.
B-9 (`5065673`) completed 15 live connection/topic/turn operations and topic SSE.
Its affected tests passed 30/30; schema checks passed 12/12. A probe-expiry
regression proved that authority must be rechecked after destination resolution
before any paid host call. Paid probes, provider transfer and topic deletion
require explicit acknowledgements. The mock serves planned operations only.

## Human-run provider journey - not executed

`docker/chat-journey.ts` shares the actual generated-client flow with the test.
`--backend` is the trusted development Compose origin
`https://127.0.0.1:8443`; `--base-url` is the provider HTTPS API base,
`--model` is the provider model ID, and `--key-file` names a user-provided key
file. It preserves normal TLS verification. It prints only fixed step names and
checks, cleans up its connection/topic/enrollment and never prints keys, handles,
provider diagnostics or file contents.

After Stop it prompts the human to restart `backend` in another terminal, then
compares the saved snapshot. The script can verify history after that requested
step, but cannot independently certify that the human restarted the process.
The automated test supplies that evidence with a distinct child PID.

Illustrative future B-11 command, **not run for this evidence**:

```powershell
docker compose run --rm --no-deps tools node --import tsx docker/chat-journey.ts --backend https://127.0.0.1:8443 --base-url https://api.minimax.io/v1 --model MiniMax-M3 --key-file /path/to/provider-key
```

The lead must verify the actual offered model/pricing before B-11. The human
supplies the key and accepts the two turn calls; the script never retries a
provider call. If the second reply finishes before Stop can be applied, it fails
that assertion rather than claiming cancellation. B-11 remains human-run.

## Limits and remaining gates

- This is local synthetic acceptance, not remote CI, deployment, production,
  browser UI, Windows/Flutter device or real-provider acceptance.
- Text chat has no project context. Legacy project-bound TopicCreate requests
  explicitly return `request_invalid`; no project name or permission is invented.
- Retention, backup quarantine/restore, real personal-content approval, open
  registration, tools, shared memory and other provider formats remain outside
  this slice. Step-1 deletion removes live content; restoring an older backup
  can bring synthetic content back until the lifecycle slice is implemented.
