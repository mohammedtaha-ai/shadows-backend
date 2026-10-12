# Temporary OpenRouter free-model probe — 2026-10-12

The user authorized a temporary OpenRouter key and free models only. The key
was passed through non-echoing stdin to one Node process, never written to a
repository, environment file, Docker image or output log.

## Current observed boundary

The authenticated discovery attempt did not reach OpenRouter. A subsequent
credential-free `curl --head https://openrouter.ai/api/v1/models` returned
`CONNECT tunnel failed, response 403` from the managed environment's Envoy
proxy. The current environment status reported an **enforced restricted**
network policy with `api.minimax.io` allowed; `openrouter.ai` was absent from
the effective allowed hosts. This is a network-policy refusal before TLS and
the provider API. It establishes neither key validity nor free-model availability
or quota exhaustion. No free OpenRouter model result is claimed yet.

The environment's supported configuration workflow must add `openrouter.ai`
before retrying. The runtime tool here can read policy, not change it. Proxy
bypasses or alternate relays are not valid ways to test the blocked destination.

## Prepared diagnostic

`openrouter-discovery.mjs` authenticates at `/api/v1/key`, obtains the live
model catalog, filters `:free` IDs with zero prompt/completion prices, and
attempts up to three advertised tool-capable free models using a tiny synthetic
prompt. Each call is capped at 256 output tokens and 30 seconds. It prints only
safe statuses, model IDs, counts/booleans, finish reasons and classified failures.
It does not persist response text. Paid models are never selected.

On a permitted Linux network, from this directory:

```bash
read -r -s -p 'Temporary OpenRouter key: ' probe_router_key
printf '%s\n' "$probe_router_key" | NODE_USE_ENV_PROXY=1 node openrouter-discovery.mjs
unset probe_router_key
```

Preserve the managed proxy and CA settings. Do not enable shell tracing.

## Do not collapse different failures into quota

- A proxy CONNECT refusal is a transport/policy failure; there is no provider
  HTTP status to classify.
- HTTP 401 establishes authentication rejection; HTTP 402 establishes a credit
  requirement. HTTP 429 alone establishes rate limiting with an unknown window.
- Only explicit daily/free-limit evidence is classified as daily/free quota.
- Unavailable endpoints, rejected parameters, upstream failure, timeout, and
  empty model output have separate classifications.

`provider-failure.test.mjs` verifies these distinctions. The earlier MiniMax
native-click request did receive an explicit `2067` / `insufficient_balance_error`
Token Plan limit response. That finding is specific to that provider request;
it cannot explain the separate OpenRouter proxy denial.
