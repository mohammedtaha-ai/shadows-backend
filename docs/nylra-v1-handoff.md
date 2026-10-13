# nylra-v1 handoff for the Flutter app

The phone's contract is [api/nylra-v1.openapi.json](../api/nylra-v1.openapi.json),
version 0.2.0, OpenAPI 3.0.3. Generate Dart from that file and never edit a
copy; a field the app needs is added to the TypeBox source in
`src/transports/http/nylra-schema.ts` first. The
[backend delivery spec §4](superpowers/specs/2026-10-10-backend-delivery-design.md#nylra-v1-02-the-first-releases-client-contract-2026-10-13)
owns what it carries.

## Run the mock

    npm ci
    npm run mock:nylra

It listens on `http://127.0.0.1:4410`. An Android emulator reaches it at
`http://10.0.2.2:4410`; a phone on the same network needs
`NYLRA_MOCK_HOST=0.0.0.0` and the computer's address. Every request needs
`Authorization: Bearer <anything>`. Answers come from
[the synthetic fixtures](../api/nylra-v1.fixtures.json).

## What the app must handle

- **Refusals** are always `{ "code": "..." }`. 401 means sign in again; 410
  `resnapshot_required` means reload the snapshot, then stream from its cursor.
- **Streams** are SSE with `id` = `seq`. Reconnect with `?after=<last seq>`.
  The mock replays and then closes; a real server keeps the stream open.
  Send a nonnegative decimal integer no larger than `9007199254740991`;
  malformed values refuse with 400 instead of being rounded or truncated.
- **Approvals:** deciding answers the updated approval. 409
  `approval_already_decided` (AYLUL decided under a grant, or another device
  did) and `approval_expired` are normal outcomes to show, not errors.
  The mock selects distinct allowed/denied fixtures for the decision; it
  replays fixed examples and does not persist decisions between requests.
- **`decidedBy`** is `{ "kind": "person" }` or
  `{ "kind": "aylul_grant", "grantId": "..." }`. Show the second as "AYLUL, on
  your behalf", with a way to revoke that grant.
- **Laptop offline:** sessions show state `offline`; chat still works, answered
  by the cloud brain (`answeredBy: "cloud"`).

## Fixture ids to call the mock with

| Path parameter | Id |
| --- | --- |
| laptopId | `00000000-0000-4000-8000-000000000010` |
| topicId | `00000000-0000-4000-8000-000000000030` |
| turnId | `00000000-0000-4000-8000-000000000055` |
| sessionId | `00000000-0000-4000-8000-000000000060` |
| approvalId (pending) | `00000000-0000-4000-8000-000000000070` |
| approvalId (already decided, answers 409) | `00000000-0000-4000-8000-000000000071` |
| approvalId (expired, answers 409) | `00000000-0000-4000-8000-000000000072` |
| grantId | `00000000-0000-4000-8000-000000000080` |
