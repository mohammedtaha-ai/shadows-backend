# B0 non-product capability experiments

The [2026-10-11 handoff](../../docs/evidence/2026-10-11-b0-closure-followup.md)
owns follow-up results and remaining cloud work. `identity-bindings.mjs` and
`identity-devices.mjs` are independent synthetic/prototype checks.
`identity-keycloak.mjs` requires the pinned Docker image to have been pulled first;
its behavioral cases were unexecuted locally; the separate cloud run passed.
Use `node identity-keycloak.mjs --cloud` in this managed Linux environment after
the explicit local-socket Docker preflight/pull in the report; it preserves local
results. `--cloud --refusals-only` runs six typed protocol-refusal checks only.
Neither mode is Windows native acceptance. `minimax-rounds.mjs` is explicit
opt-in real-provider work, separate from `npm test`; `--continuity-only` makes at
most four calls. Never run it automatically in CI. `.identity-runtime/` and
`.identity-cluster/` are isolated and ignored. No secret values are in artifacts.

Optional real-provider supplement: `node ai-minimax.mjs` loads the
optional repository-root `.env` only when `process.env.API_KEY` is missing.
Both opt-in probes prefer the inherited API_KEY, including a Network-secret proxy
placeholder, and never require/create a `.env`. They use only the official MiniMax
endpoint. The observed cloud binding is named MINIMAX_API_KEY, not API_KEY; no
provider call or aliasing was needed or performed in this continuation.
This makes up to four bounded paid API calls and is not part of `npm test`.
See `docs/evidence/2026-10-11-minimax-provider-probe.md` from the repository root.
Never log `.env`, SDK errors or request headers. The existing `ai.mjs` stays synthetic.

Retained for reviewer inspection. These scripts are not application source and
must never be deployed. No product modules, auth implementation or J1 protocol
are created. `package-lock.json` pins the environment; generated artifacts have
their producer scripts beside them. The dated evidence report owns observations.

Run in this directory on Windows with Node 24.15.0, npm 11.12.1 and Dart 3.12.2:

```powershell
npm ci --fetch-timeout=30000 --fetch-retries=1
npm test
node docs-check.mjs
```

The HTTP consumer fixture uses the installed Dart executable at
`C:/src/flutter/bin/cache/dart-sdk/bin/dart.exe`. No Dart packages are needed.
The DTO is generated from the exported OpenAPI response shape by
`dart-generate.mjs`; it supports this flat fixture only. Selection of a full
Dart generator remains unresolved. TS uses established `openapi-typescript`
and `openapi-fetch`, with a strict compile and an actual loopback request.

Separate focused commands:

```powershell
node versions.mjs
node availability.mjs
node http.mjs
node database.mjs
node ai.mjs
node oidc.mjs
```

Reserve loopback ports 45871 (Fastify), 45872 (PostgreSQL), 45873 (synthetic model
endpoint), 45874 (synthetic OIDC issuer), and 45875 (registered native callback
URI, HTTP redirect target only; no listener or native return handling is tested).
Do not substitute an existing database URL. `database.mjs` creates its own
ephemeral cluster under `.cluster/` and database `b0_capability`, binds PostgreSQL
to 127.0.0.1, generates a password only at runtime and stops its own cluster.
It uses explicit Kysely transactions and node-pg-migrate SQL history. The worker
receives connection configuration via stdin, never command arguments or output.
Its deliberate exit 73 leaves an active job after an independent synthetic
owner commit. Restarted pg-boss expires/retries that lease; the owner operation
replays a stored result and refuses changed fingerprints.

AI results are synthetic even though the SDK and OpenAI adapter are real. No
requests go to a commercial provider. OIDC uses the maintained provider library
with a synthetic account and automatic test consent on loopback; this is neither
a real-user login nor Windows system-browser acceptance. Its keys/cookies/tokens
remain runtime-only. Configuration availability checks output presence and status
only, never values. No secret stores, cloud accounts or sibling files are accessed.

Artifacts are JSON observations, OpenAPI, generated TS declarations and generated
Dart source. Compiled `consumer.exe`, the cluster, dependencies and logs are
ignored; retain source and lockfile. Do not delete the only reproduction before
review. Generated artifacts and result files are replaced by a rerun.

Cloud focused checks (no provider calls or repeated passed experiments):

```sh
node --test runtime-api-key.test.mjs
node cloud-provenance.mjs
node followup-checks.mjs --cloud
git diff --check
```

`--cloud` writes `followup-artifacts/cloud-checks.json`, preserving the local
check artifact; absent sibling repository links are reported separately from
broken repository-local links. Secret comparison uses inherited runtime values
only and outputs match counts, never matched content. Retained MiniMax sources
and results are historical evidence; no extra cloud MiniMax request was made.
