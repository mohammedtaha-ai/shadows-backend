# Shared requests

The only place the NYLRA apps and this backend agree on what crosses between
them. The agreed shape is decided here, **before** either side writes code, so
nothing is built twice.

`api/nylra-v1.openapi.json` stays the real contract: it is generated from this
repository's TypeBox source. A request is the agreement that source must then
satisfy.

## The cycle

1. A **NYLRA lead** (in `../nylra`) plans a screen or a native feature with the
   user and writes `requests/<yyyy-mm-dd>-<topic>.md` here from
   [`requests/TEMPLATE.md`](./requests/TEMPLATE.md). Status: `asked`.
2. They tell **Hamoud** (a message to his session) that the request is waiting.
3. **Hamoud** reads it against the backend's contracts and answers in
   "Backend answer": as asked, with a change, or not possible, and why.
   Status: `answered`.
4. The NYLRA lead accepts, or replies under it. Status: `accepted` or `disputed`.
5. A `disputed` request goes to the **teacher**, which reads both sides and
   writes the "Ruling". Its ruling is final. Status: `accepted`.
6. Only an `accepted` request may be built. Hamoud's tasks build it first; the
   app's tasks that need it stay `blocked` until the schema shows it.

A message between sessions is only a notice. What counts is written here.
