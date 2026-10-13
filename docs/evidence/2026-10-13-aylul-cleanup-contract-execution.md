# AYLUL cleanup and nylra-v1 contract execution (2026-10-13)

Scope: Tasks 1, 2, 3, 5, 6 and 7 of the
[plan](../superpowers/plans/2026-10-13-aylul-steps-0-1-cleanup-and-contract.md).
Mohammed authorized commits and HTTP/1.1 pushes, excluded Tasks 4 and 8,
required branches from latest `origin/main`, and requested plan corrections
with their reasons. No PR, merge, deployment, provider call or real content
was part of this execution.

## Branches and commits

All three repositories were clean on `main`; `git fetch origin --tags`
succeeded in each. The probe tag resolved to the commits named in the plan.

| Task | Repository / branch | Base | Task commit |
| --- | --- | --- | --- |
| 1 | shadows / chore/fold-probes | d1f7e0a | 36294aa |
| 2 | shadows-backend / chore/fold-probes | 7d73f4f | 7ffaadf |
| 3 | nylra / chore/fold-probes | fa4e948 | 1ca2aa6 |
| 5 | shadows-backend / feat/nylra-v1-contract | 7d73f4f | 44ddad1 |
| 6 | shadows-backend / feat/nylra-v1-contract | 44ddad1 | e861e56 |
| 7 | shadows-backend / feat/nylra-v1-contract | e861e56 | bd7f842 |

The backend contract branch started from freshly fetched `origin/main`
after its cleanup branch was pushed. It intentionally does not inherit
`7ffaadf`; the B0 sources disappear there when the cleanup is integrated.

Each cleanup branch was pushed with
`git -c http.version=HTTP/1.1 push -u origin chore/fold-probes` successfully.
`git status --short --branch` and
`git rev-list --left-right --count 'HEAD...@{upstream}'` confirmed clean trees
and `0 0` divergence after fixing the generated NYLRA files' line endings.
The contract branch's final publication is reported in the session result.

## Commands and observed results

Commands below ran locally. Windows used Node 24.15.0; Linux checks used
the existing `shadows-backend-local:dev` image with Node 24.19.0.

### Task 1

- `git fetch origin --tags`: success; tag `60b9edc`.
- `git show probe/2026-10-12-linux-integration:docs/evidence/2026-10-12-minimax-linux-acp-cross-project.md`:
  read successfully; copied via the temporary `fold-probe-evidence.py` tool.
- `cargo fmt --all --check`: exit 0, with
  `CARGO_TARGET_DIR=C:/Users/Mohammed/.cargo/task-targets/aylul-shadows`.
- Direct 100-column and Markdown-link audit: pass; all 53 lines fit and
  the file contains no Markdown links.
- `git diff --check`: exit 0. Only the evidence file was committed.

### Task 2

- `git show` for tagged J1 `RESULTS.md`, `OPENROUTER.md`, `LIBRARIES.md`:
  read successfully. The copied record adjusts headings and historical links.
- `python ../rewrite-probe-links.py probes/b0-2026-10-10 db27eb5`:
  rewrote five Markdown files; evidence files received the removal notice.
- `git rm -r -q probes/b0-2026-10-10`: removed 61 tracked files.
- `git grep -n '](.*probes/b0-2026-10-10' -- '*.md'`:
  only the plan's fenced example matches; no actual link remains.
- `npm ci --no-audit --no-fund`: success, 135 packages.
- `npm run check:docs`: pass, 24 files on Windows. Its Windows path
  classification leaves local links unverified, so a separate Git-tree audit
  checked the cleanup branch: seven Markdown files, 33 links, 45 historical
  targets, all valid.
- `git diff --check`: exit 0.

### Task 3

- Tagged Linux probe README: read successfully; copied with historical links.
- `python ../rewrite-probe-links.py docs/evidence/probes/2026-10-10-n0 41b8e84`:
  rewrote six Markdown files, including the additional approved-expression
  evidence file found by the script.
- `git rm -r -q docs/evidence/probes`: removed 234 tracked files.
- `git grep -n 'evidence/probes/' -- ':!docs/evidence/2026-10-12-linux-probe.md'`:
  remaining documentation references are historical paths or reproduction
  commands; nine asset-manifest provenance references remain by instruction.
- In `apps/desktop`, `npm ci --no-audit --no-fund`: success, 24 packages.
- `npm run build`: pass; rerun after the deletion succeeded.
- `CARGO_TARGET_DIR=C:/Users/Mohammed/.cargo/task-targets/aylul-nylra`
  with `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`:
  17 passed, one ignored, zero failed. No repository target directory was used.
- Relative-link and historical-target audit: seven Markdown files, 13 links,
  89 historical targets, all valid. `git diff --check`: exit 0.

### Task 5

- `node --import tsx --test tests/integration/nylra-wire.test.ts`:
  first failed because `nylra-schema.js` was absent; passed 1/1 after
  adding schemas and fixtures. The multiline-summary fixture then failed
  before the schema correction; passed after it.
- `npm run typecheck`: pass.
- `npm run check:contracts` on Windows: failed on the existing slash-based
  source-coverage comparison; the Linux owner check subsequently passed.
- HTTP source contract updated with the schema, in the same commit.

### Task 6

- Wire tests first failed because `nylra-paths.js` was absent.
- `npm run schema:nylra`: pass; generated OpenAPI 3.0.3 and TypeScript.
- Windows wire tests: 3/4 passed; snapshot failed only at the known
  `openapi-typescript` spawn (`ENOENT`). That test was not changed.
- Linux wire tests: 4/4 passed, including generated snapshot equality.
- `npm run typecheck`, `npm run check:contracts`, `npm run check:docs`
  in Linux: pass. The contract check parses YAML and resolves symbols/tests.

### Task 7

- `node --import tsx --test tests/integration/nylra-mock.test.ts`:
  first failed because `mock-nylra.js` was absent; original four tests passed
  after implementation. Numeric-message and malformed-JSON tests failed
  before their fixes. Before final review, seven tests passed on Windows
  and Linux. Two review regressions bring the mock suite to nine tests.
- `npm run typecheck`, `npm run check:docs`: pass.
- `npm run mock:nylra`: listened on `127.0.0.1:4410`.
- `curl.exe -s -H 'Authorization: Bearer synthetic' http://127.0.0.1:4410/v1/nylra/approvals`:
  returned the pending synthetic `npm test` approval.
- `curl.exe -s -N -H 'Authorization: Bearer synthetic' 'http://127.0.0.1:4410/v1/nylra/topics/00000000-0000-4000-8000-000000000030/events?after=4'`:
  returned SSE ids 5, 6, 7 and 8. The mock was stopped afterward.

### Backend regression checks before final review

Linux runs mount the checkout at `/workspace`, use the existing named
dependency/test-runtime volumes and run tests as uid 1000, gid 0. The full
suite also mounts the Docker socket and sets
`B1_FIXTURE_NETWORK_CONTAINER=aylul-contract-suite` so its disposable
Keycloak fixture shares the test container's loopback network. Development
databases and credentials were not read or used.

- `npm test`: 53/53 passed, zero skipped, including embedded PostgreSQL,
  disposable Keycloak, restart, existing identity tests and new wire/mock tests.
- `npm run schema:check`: snapshots pass, eight tests pass.
- `npm run check:contracts`: 1/1 pass, YAML parsing included.
- `npm run check:docs`: pass, 24 files before this evidence file was added.
- `npm run check:secrets`: pass, zero findings; the clean-tree run checks source
  logging/literals but does not rescan already committed artifact content.
- Contract branch Git-tree documentation audit: three changed Markdown files,
  25 relative links, all valid before this evidence file was added.

## Corrections and reasons

The plan's execution-corrections section records these changes in place.

- Replaced the removed branch and stale push prohibition with Mohammed's
  explicit branch/push workflow. Cleanup and contract remain independent.
- Enforced the specified single-line step summary. A length bound alone did
  not reject line breaks. Added file-content rejection coverage as well.
- Updated the HTTP source contract in Task 5 rather than postponing it,
  satisfying the repository's same-change ownership rule.
- Kept JSON request types strict; only query strings are converted. The
  original conversion accepted `message: 123` as a valid string.
- Mapped malformed JSON to the shared refusal shape; framework diagnostics
  previously escaped that contract. Added schema-valid SSE-frame coverage
  for topic, session and account streams.
- The same-model final reviewer reproduced three further plan defects;
  author tests reproduced each failure before its fix. Nullable `$ref`
  wrappers lacked a same-schema `type` and retained non-null constraints.
  The exporter now inlines nullable uses and permits null in each union
  branch, with a real Fastify validator proving null and valid objects work
  while malformed objects still refuse. This follows the
  [OpenAPI 3.0.3 nullable rule](https://spec.openapis.org/oas/v3.0.3.html#schema-object).
- Cursor conversion truncated fractions and exponent spellings. Decimal
  safe-integer parsing replaces conversion; `Seq` has the same safe-integer
  bound so producers cannot silently round a stream position. The unsafe
  sequence fixture also failed before the canonical bound was added.
- Denial returned an allowed fixture. The mock now selects distinct
  allow/deny fixtures without storing decisions or enforcing domain rules.
  The handoff describes that limitation.
- The reviewer also identified missing 409-status assertions. Since the
  plan explicitly required 409, Mohammed's instruction to correct plan
  defects warranted adding both status and full-response assertions.
  Existing behavior passed; no artificial failing production test was needed.
- Documented the existing Windows path/spawn limitations and used Linux
  plus direct link/provenance audits. No acceptance claim relies on those
  Windows checks for behavior they did not verify.
- Corrected operational mistakes: the first NYLRA removal command ran from
  the desktop directory and failed without deleting anything; it was then
  run at the repository root before validation. The first account SSE test
  expectation used the wrong fixture range; inspection corrected it to 13–18.
- The first Linux dependency install failed with `EACCES` on the existing
  root-owned volume. Installation as root and restoring dependency ownership
  resolved it; tests still ran as a non-root user. No package versions changed.

## Final verification after the review fixes

- The three important review regressions failed before their fixes and passed
  afterward. The unsafe-sequence fixture likewise failed before its bound.
- Windows mock tests: 9/9 pass; targeted exported-nullable validation and
  fixture tests: 2/2 pass; generation and typecheck pass.
- Linux `npm test`: 56/56 pass, zero failures or skips.
- Linux `npm run typecheck`: pass.
- Linux `npm run schema:check`: both snapshots pass; 9/9 tests pass
  (five NYLRA wire tests and four existing authentication wire tests).
- Linux `npm run check:contracts`: 1/1 pass, YAML parsing included.
- Linux `npm run check:docs`: pass, 25 files.
- Linux `npm run check:secrets`: pass, 12 changed files, zero findings.
- No additional review round was dispatched. The author verified the fixes
  with failing regressions and the complete suite. No review findings remain.

## Remaining boundaries

- Tasks 4 and 8 are skipped by instruction. The final change review does not
  perform Task 4's general authentication structure review.
- Native `auth::acceptance::native_compose_login_reauthentication_revocation_and_logout`
  remains ignored; it requires the authorized local Docker synthetic runtime.
  No new Windows browser, real-phone or production acceptance is claimed.
- Source references remain in `assets/aylul/states/v1/manifest.json:7–9`
  and `assets/aylul/candidates/2026-10-11/manifest.json:15,21,27,33,39,45`
  in NYLRA, as Task 3 explicitly requires. Their originals are at `41b8e84`.
- A local untracked `consumer.exe` and ignored B0 dependencies were preserved
  at `E:/Globalprojects/.aylul-cleanup-local/backend-b0` outside the checkout.
  Temporary task tools and exported execution logs are local artifacts.
- The mock is a stateless synthetic replay server, with no real authentication,
  authority, persistence, model/provider execution or long-lived SSE connection.
- Remote CI results are not claimed by these local runs.

The reviewer set aside Task 4/8, absent product services, Dart/device runtime
acceptance, the intentionally preserved manifest provenance and historical
probe statements. These boundaries remain appropriate because this slice
adds only wire artifacts and a development replay tool; integration and real
authority are separate required delivery work. No review finding was dropped.

## Task 4: structure review, run later on 2026-10-13

Task 4 was skipped above and ran afterwards as its own review of the kept
authentication code, by a Claude reviewer, stopped early at the controller's
request. Merged as shadows-backend#6 and nylra#7.

### Commits

| Repository | Commit | Change |
| --- | --- | --- |
| shadows-backend | `12e70bb` | Remove `withTransaction` (`platform/database/transaction.ts`, no callers), `SessionRow`, `DeviceStore`'s unread `db` argument and four unused identity re-exports; correct `app`, `identity` and `database` contract notes |
| shadows-backend | `a44ad18` | Optional `B1_TEST_PG_ADMIN` test database, below |
| nylra | `baeb24a` | Split `native_login/mod.rs` (420 lines, three jobs) into `loopback.rs` 217, `protected_store.rs` 158, `browser.rs` 50, `random.rs` 21 and `mod.rs` 9; code moved unchanged |
| nylra | `7d1bf1e` | `commands::cancel_login` calls `AuthController::cancel()` instead of writing its public field |
| nylra | `6092c80` | Drop the unused `Win32_System_Memory` windows-sys feature |
| nylra | `0dd0bfc` | Remove references to deleted probes |

### Found and left, with the reason

- `src/modules/devices/store.ts:7,13` hashes inline instead of reusing
  identity's `hash`: reuse would make devices depend on an identity runtime value.
- `src/app/config.ts:14` and `src/modules/identity/token-vault.ts:5` check the
  same key-id pattern: intentional defence in depth.
- `src/modules/identity/store.ts` `revoke()` uses `returningAll()` that nobody
  reads: removing it changes the query.
- `nylra/apps/desktop/tests/check-auth.cjs:4` loads `yaml` from an untracked
  local `.superpowers/validation/node_modules`.
- `ReturnBinding::verifier` is public but only tests use it.

### Checks on Windows

- shadows-backend: `npm ci`, `typecheck` and `check:docs` passed.
  `check:contracts` failed with "source without contract owner" at
  `tests/architecture/contracts.test.ts:26`, identically on unmodified main
  (the known path-separator comparison).
- nylra: `npm ci`, `npm run build`, `cargo fmt --check`, `cargo clippy -D warnings`
  and `node apps/desktop/tests/check-auth.cjs` passed; `cargo test` 17 passed,
  1 ignored (Docker acceptance).

### Integration tests: embedded PostgreSQL against a container

The same six files (`enrollment`, `login-return`, `session-lifecycle`,
`migrations`, `authorization-races`, `backchannel-logout`), run with
`--test-concurrency=1` on Windows, Node 24.15.0:

| Database | Time | Result |
| --- | --- | --- |
| embedded-postgres 18.4, one cluster per test | 18 min, not finished | 7 failed; each test took 9 to 27 s |
| `postgres:18.4-bookworm` container, one database per test | 9 s | 20/20 passed |

- **Cause of the embedded failures:** fixture teardown, not the tests. The one
  captured error was `EBUSY: resource busy or locked, rmdir
  '...\.test-runtime\pg-XXXX\cluster'` in `f.close()` after the test body passed,
  with postgres `io_worker` processes still holding the directory. The failing
  set changed from run to run, and each failing test passed in another run.
  `login-return.test.ts` alone passed 6/6, then the process never exited.
- **Container mode** (`a44ad18`): with `B1_TEST_PG_ADMIN` set to a loopback
  PostgreSQL 18.4, the fixture creates and drops one database per test. Unset,
  nothing changes; CI does not set it. The container uses the Compose image
  digest with `--pull never` and tmpfs storage. README "Fast tests on Windows"
  has the command.
- **Whole integration suite in container mode:** 49/51 in about 9 s, and no
  test database was left behind. The two failures are Windows-only, and this
  branch did not touch their files:
  - `nylra_wire snapshots match the canonical schema`: with
    `core.autocrlf=true` the checked-out `api/nylra-v1.openapi.json` is CRLF,
    while the export is LF.
  - `oidc-client.test.ts`: its one test passed, then Node 24.15.0 aborted on
    exit with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file
    src\win\async.c, line 76`, so the runner marked the file failed.
- Not run on Windows: `auth-wire`, `keycloak-login`, `session-restart` (Keycloak
  needs the Linux suite), and the Linux suite itself. CI on Linux is the gate.

### nylra CI

nylra had no workflow. `873357a` added one Windows job: `npm ci`,
`npm run build`, `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`
(merged as nylra#8). It passed on its pull request in 6 min 49 s and on later
runs in about 2 minutes with the cache. nylra#7 merged before this CI existed,
so only the local checks above cover it.
