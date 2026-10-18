# Account text chat and BYOK provider connections

- Status: accepted
- Asked by: Hamoud for the human (backend-first slice), 2026-10-18
- Screen: docs/backend/specs/2026-10-17-account-chat-and-providers-design.md (step 1)

## Need

An existing signed-in account saves its own provider connections (name, API
format, address, key, model), picks an account default, and talks to NYLRA in
separate text topics. Each reply streams, can be stopped, and stays saved. A
topic can switch connection between turns, after a notice that its context
moves to the new provider. A topic can be deleted permanently. Clients come
later; this request fixes what the API must carry so they are not built twice.

## Fields

Shapes are defined in TypeBox source and generated into
`api/nylra-v1.openapi.json`. This table names the operations, not their DTOs.

| Call | Sends | Gets back |
|---|---|---|
| `listTopics`, `getTopic`, `topicEvents` (exist as `planned`) | account principal, cursor | topics, snapshot, SSE events; turn events also carry the connection/model used |
| `createTopic` (exists, extended) | `commandId`, optional title, optional connection | topic pinned to the given connection or the account default |
| `createTurn` (exists) | `commandId`, message ≤ 2,000 chars | accepted turn; the reply arrives on `topicEvents` |
| `cancelTurn` (exists) | — | stop; committed partial text stays, marked partial |
| new: change topic connection | connection id, acknowledgement of the transfer notice | updated topic; applies from the next turn |
| new: delete topic | explicit confirmation | topic gone; later reads 404 |
| new: list / create / update / delete connections | name, format (`openai_compatible`), HTTPS address, key (write only), model id | connection metadata and `keyConfigured: true/false`; never the key |
| new: get / set account default connection | connection id | current default |
| new: test connection (explicit) | connection id, acknowledgement that the probe may cost | safe outcome category |

## Errors

| When | The screen shows |
|---|---|
| No connection configured / default missing | Prompt to add a connection; no send |
| Key rejected, model unknown, quota, network | Safe category message; no automatic retry or provider switch |
| Address not HTTPS, internal, redirecting or with credentials in URL | Refused at save |
| Topic already generating, or two generations on the account | Retryable refusal |
| History over 64 KiB / 100 messages | Refused before sending; nothing truncated |
| Same `commandId` with different content | 409 conflict |
| Cursor expired | 410, resnapshot |
| Topic deleted during generation | Generation stops; later reads 404 |

## Backend answer

Possible with changes (Hamoud, 2026-10-18).

- Topics and turns reuse the `planned` operations in
  `src/transports/http/nylra-paths.ts`. `TopicCreate` gains an optional
  connection; turn events gain the connection/model actually used. Existing
  `TurnRequest` and the 2,000 / 16,000 character bounds stay.
- Delete topic, change topic connection, connections and account default are
  new operations owned by two proposed services: Provider settings
  (connections, encrypted keys, default) and Conversations (topics, turns,
  dispatch, stream, delete). Names are fixed in source during the plan.
- Keys are write-only: no response, event, URL or log carries them.
- One API format in step 1 (`openai_compatible`). Others arrive as new adapters.
- Billing: the backend never re-sends automatically. After an interrupted
  provider call the outcome is unknown; we do not promise the provider did not
  charge.
- Step 1 delete removes the topic, its messages and stream events from the local
  Docker database, stops its generation and refuses its late writes. A restored
  older backup can bring it back until step 2 lifecycle lands. Step 1 carries
  test text only.
- Open signup is not in this request (step 3).

## Reply

Accepted by the human as teacher, 2026-10-18 ("تمام انت جهزهن من ناحيتك
وخلاص"). Recorded by Hamoud. NYLRA client leads build against the generated
schema once these operations are implemented.

## Ruling

<Only if disputed.>
