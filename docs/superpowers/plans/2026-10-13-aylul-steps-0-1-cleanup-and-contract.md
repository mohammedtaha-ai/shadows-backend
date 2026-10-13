# AYLUL first release, steps 0 and 1: cleanup and the nylra-v1 0.2 contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the probe code that piled up in three repositories without losing what it proved, then fix the client contract (nylra-v1 0.2) with fixtures and a mock server, so Mohammed's friend can build the Flutter app while Mohammed builds the laptop and backend halves.

**Architecture:** Step 0 moves every probe's findings into one dated evidence file per probe, rewrites links into deleted folders as text naming the commit that still holds them, deletes the probe code, and reviews the authentication code that stays. Step 1 writes the contract as TypeBox in `shadows-backend/src/transports/http/`, exports OpenAPI 3.0 and TypeScript from it, checks synthetic fixtures against it, and serves it from a fixture-replaying mock server in `scripts/`. No product route, service or store is added.

**Tech Stack:** Node 24, TypeScript 5.9.3, TypeBox 0.34.52, Fastify 5.12.5, openapi-typescript 7.13.0, node:test; Rust/Tauri 2 and React in `nylra/apps/desktop` (review only).

**Spec:** [NYLRA delivery spec, Independent companion and First release](../../../../nylra/docs/superpowers/specs/2026-10-10-nylra-delivery-design.md#independent-companion) and [backend delivery spec §4, nylra-v1 0.2](../specs/2026-10-10-backend-delivery-design.md#nylra-v1-02-the-first-releases-client-contract-2026-10-13). Executors read both before Task 1.

## Global Constraints

- Work on the existing local branch `spec/aylul-companion` in each of the three repositories (`E:/Globalprojects/shadows`, `E:/Globalprojects/nylra`, `E:/Globalprojects/shadows-backend`). Commit locally; never push, tag or delete a remote branch (Task 8 is the controller's).
- Commits end with `Co-Authored-By:` naming the executing model.
- Repository rule: "Spike code is deleted once its evidence file is written." Evidence files are dated facts; each names the commit that holds the deleted source.
- Commits that hold deleted probe material: shadows-backend `main` at `db27eb5`; nylra `main` at `41b8e84`; branch `codex/linux-integration-probe` at shadows `60b9edc`, nylra `f9789af`, shadows-backend `7fc59a7`. Task 8 tags those branch heads before deleting the branches, so the commits stay reachable.
- Contract version is `0.2.0`. The contract's source is TypeBox in `src/transports/http/`; `api/nylra-v1.openapi.json` and `api/nylra-v1.d.ts` are generated and never edited by hand.
- A session step carries the tool name, file path and a one-line summary (at most 200 characters), never a diff or file content.
- The account comes from the session, never a request body field.
- The phone can revoke a grant; no operation creates or widens one.
- The OpenAPI document is version 3.0.3 and contains no `const` and no `"type": "null"`, because Dart generators read 3.0.
- Fixtures are synthetic. No real account, project, path, token or key appears in them.
- The mock server is development-only and holds no product rule. It lives in `scripts/`, not `src/`.
- File size rule: at 300 lines a file states its single responsibility in the commit message; at 500 it splits by responsibility.
- Backend tests run with `node --import tsx --test <file>`. The snapshot test that spawns `node_modules/.bin/openapi-typescript` runs on Linux (CI); on Windows it fails at the spawn (`ENOENT`, a `.cmd` shim), like the existing `auth-wire` test. Report that failure as Windows-only; do not change it.

## Review Focus

1. **A client sends a diff or file content in a step.** Expected: refused by the schema. Pinned by the `Step` "no diff leaves the laptop" invalid fixture (Task 5).
2. **A client puts an account id in a body.** Expected: refused. Pinned by the `ApprovalDecide` accountId invalid fixture (Task 5).
3. **A client reconnects a stream with a cursor the server no longer holds, or one ahead of it.** Expected: 410 `resnapshot_required`, never a silent gap. Pinned by the mock's stream test (Task 7).
4. **The person decides an approval that AYLUL already decided under a grant, or one that expired.** Expected: 409 with `approval_already_decided` or `approval_expired`. Pinned by the mock's approval test (Task 7).
5. **The phone calls without a bearer, or with an invalid body.** Expected: 401 `unauthorized` and 400 `request_invalid`, each in the shared refusal shape. Pinned by the mock tests (Task 7).

---

## Step 0: Cleanup

### Task 1: shadows, keep the Linux ACP probe's evidence

The probe changed `crates/shadows-agent/src/claude.rs` and `crates/shadows/tests/harness_config.rs` on `codex/linux-integration-probe`. That code is not wanted; its evidence file is.

**Files:**
- Create: `docs/evidence/2026-10-12-minimax-linux-acp-cross-project.md` (in `E:/Globalprojects/shadows`)

- [ ] **Step 1: Copy the evidence file from the probe branch**

```bash
cd E:/Globalprojects/shadows
git fetch origin
git show origin/codex/linux-integration-probe:docs/evidence/2026-10-12-minimax-linux-acp-cross-project.md > docs/evidence/2026-10-12-minimax-linux-acp-cross-project.md
```

- [ ] **Step 2: Add the provenance note under its title**

Insert this paragraph directly after the file's first heading line:

```markdown
The probe's code change (provider and proxy forwarding in
`crates/shadows-agent/src/claude.rs`, and `crates/shadows/tests/harness_config.rs`)
was not merged. It is at `60b9edc`, tagged `probe/2026-10-12-linux-integration`.
```

- [ ] **Step 3: Check that every link in the file resolves**

Open the file and follow each relative Markdown link. A link to a file that exists only on the probe branch becomes plain text: `` the label (`path` at `60b9edc`) ``.

- [ ] **Step 4: Commit**

```bash
git add docs/evidence/2026-10-12-minimax-linux-acp-cross-project.md
git commit -m "docs(evidence): keep the Linux ACP probe's findings; its code stays unmerged"
```

### Task 2: shadows-backend, fold the probes into evidence and delete them

**Files:**
- Create: `docs/evidence/2026-10-12-j1-linux-probe.md`
- Modify: every Markdown file that links into `probes/b0-2026-10-10/` (the rewrite script finds them), `docs/source-structure.md:140`
- Delete: `probes/b0-2026-10-10/` (61 files)

- [ ] **Step 1: Write the J1 Linux probe's evidence file from its branch**

```bash
cd E:/Globalprojects/shadows-backend
git fetch origin
B=origin/codex/linux-integration-probe
{
  printf '# J1 Linux cross-project probe (2026-10-12)\n\n'
  printf 'Probe source: `probes/j1-linux-2026-10-12/` at `7fc59a7`, tagged\n`probe/2026-10-12-linux-integration`. It was not merged; this file keeps its\nfindings. Sections below are the probe'"'"'s own records, unchanged.\n\n'
  for f in RESULTS OPENROUTER LIBRARIES; do
    printf '## %s\n\n' "$f"
    git show "$B:probes/j1-linux-2026-10-12/$f.md" | sed '1{/^# /d}' | sed 's/^#/##/'
    printf '\n'
  done
} > docs/evidence/2026-10-12-j1-linux-probe.md
```

Open the result. Relative links in it pointed into `probes/j1-linux-2026-10-12/`; make each one plain text: `` the label (`probes/j1-linux-2026-10-12/<file>` at `7fc59a7`) ``.

- [ ] **Step 2: Save the link-rewrite script outside the repository**

Save as `E:/Globalprojects/rewrite-probe-links.py` (it is a tool for this task, not part of any repository):

```python
# Rewrites Markdown links that point into a deleted folder as plain text naming
# the commit that still holds the target. Usage, from a repository root:
#   python ../rewrite-probe-links.py <folder> <commit>
import pathlib, re, sys

root = pathlib.Path('.').resolve()
folder = (root / sys.argv[1]).resolve()
commit = sys.argv[2]
link = re.compile(r'\[([^\]]*)\]\(([^)#\s]+)(#[^)]*)?\)')

for path in root.rglob('*.md'):
    if {'.git', 'node_modules'} & set(path.parts) or folder in path.resolve().parents:
        continue
    text = path.read_text(encoding='utf-8')

    def swap(match):
        target = (path.parent / match.group(2)).resolve()
        if target != folder and folder not in target.parents:
            return match.group(0)
        return f'{match.group(1)} (`{target.relative_to(root).as_posix()}` at `{commit}`)'

    new = link.sub(swap, text)
    if new != text:
        path.write_text(new, encoding='utf-8')
        print(path.relative_to(root).as_posix())
```

- [ ] **Step 3: Rewrite the links, then note the removal in each changed evidence file**

```bash
python ../rewrite-probe-links.py probes/b0-2026-10-10 db27eb5
```

Expected output lists at least `docs/evidence/2026-10-10-backend-capability-probes.md`, `docs/evidence/2026-10-11-b0-closure-followup.md`, `docs/evidence/2026-10-11-minimax-provider-probe.md` and `docs/superpowers/specs/2026-10-10-backend-delivery-design.md`. In each listed file under `docs/evidence/`, insert after its first heading:

```markdown
Probe sources and raw artifacts named here were removed from the tree on
2026-10-13; `git show db27eb5:<path>` retrieves any of them.
```

- [ ] **Step 4: Amend the source-structure rule**

In `docs/source-structure.md`, replace the sentence beginning `Non-product experiments live under` with:

```markdown
Non-product experiments are deleted once their evidence file is written; the
B0 probes are at `db27eb5` and the J1 Linux probe at `7fc59a7`.
```

Keep the rest of that paragraph if it still reads true; delete any clause that says probes are retained in the tree.

- [ ] **Step 5: Delete the probe folder and confirm nothing links into it**

```bash
git rm -r -q probes/b0-2026-10-10
git grep -n "](.*probes/b0-2026-10-10" -- '*.md'
```

Expected: the grep prints nothing.

- [ ] **Step 6: Teach the documentation check to skip quoted Markdown**

This plan quotes whole Markdown files inside code fences, and their links are relative to where those files will live, not to the plan. A link inside a fence is an example, not a link. In `scripts/check-docs.ts`, replace:

```ts
 for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
```

with:

```ts
 const prose=text.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm,'');
 for(const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
```

- [ ] **Step 7: Run the documentation check**

```bash
npm ci
npm run check:docs
```

Expected: `{"result":"PASS",...}`.

- [ ] **Step 8: Commit**

```bash
git add -A docs probes scripts/check-docs.ts
git commit -m "chore: fold the B0 and J1 probes into evidence and delete their code

The docs check now skips fenced code: quoted Markdown is an example."
```

### Task 3: nylra, fold the probes into evidence and delete them

**Files:**
- Create: `docs/evidence/2026-10-12-linux-probe.md`
- Modify: every Markdown file that links into `docs/evidence/probes/2026-10-10-n0/`; `docs/superpowers/plans/2026-10-10-nylra-initial-plan.md` (its status line)
- Delete: `docs/evidence/probes/` (234 files)

- [ ] **Step 1: Write the Linux probe's evidence file from its branch**

```bash
cd E:/Globalprojects/nylra
git fetch origin
{
  printf '# Linux AYLUL window and streamed chat probe (2026-10-12)\n\n'
  printf 'Probe source: the `linux_probe` module, `apps/desktop/src/app/linux-probe.tsx`,\n`probe-stream.ts` and `docs/evidence/probes/2026-10-12-linux/` at `f9789af`, tagged\n`probe/2026-10-12-linux-integration`. It was not merged; this file keeps its findings.\n\n'
  git show origin/codex/linux-integration-probe:docs/evidence/probes/2026-10-12-linux/README.md | sed '1{/^# /d}'
} > docs/evidence/2026-10-12-linux-probe.md
```

Make every relative link in it plain text: `` the label (`docs/evidence/probes/2026-10-12-linux/<file>` at `f9789af`) ``. The probe's screenshots stay in Git at that commit.

- [ ] **Step 2: Rewrite links into the N0 probe folder**

```bash
python ../rewrite-probe-links.py docs/evidence/probes/2026-10-10-n0 41b8e84
```

Expected output lists at least `docs/evidence/2026-10-10-aylul-windows-probes.md`, `docs/evidence/2026-10-11-aylul-windows-probes.md`, `docs/evidence/2026-10-11-aylul-asset-continuation.md`, `docs/evidence/2026-10-11-windows-shell-continuation.md` and `docs/superpowers/plans/2026-10-10-nylra-initial-plan.md`. In each listed file under `docs/evidence/`, insert after its first heading:

```markdown
Probe sources and raw artifacts named here were removed from the tree on
2026-10-13; `git show 41b8e84:<path>` retrieves any of them.
```

- [ ] **Step 3: Amend the initial plan's status line**

In `docs/superpowers/plans/2026-10-10-nylra-initial-plan.md`, replace `Continue on `codex/windows-shell-n0`; preserve historical probes.` with:

```markdown
`codex/windows-shell-n0` merged as PR #1; historical probe sources are at `41b8e84`.
```

- [ ] **Step 4: Delete the probe folder and confirm nothing else uses it**

```bash
git rm -r -q docs/evidence/probes
git grep -n "evidence/probes/" -- ':!docs/evidence/2026-10-12-linux-probe.md'
```

Every remaining hit must be plain text naming `41b8e84` or `f9789af`, or a command line inside an evidence file's historical reproduction steps. A hit in a non-Markdown file (for example an asset manifest under `assets/`) is not changed here: list it in the task report with its file and line.

- [ ] **Step 5: Confirm the desktop app still builds**

```bash
cd apps/desktop
npm ci
npm run build
cd src-tauri
cargo test
```

Expected: both succeed; the deletion touched no build input.

- [ ] **Step 6: Commit**

```bash
cd E:/Globalprojects/nylra
git add -A docs
git commit -m "chore: fold the N0 and Linux probes into evidence and delete their sources"
```

### Task 4: one structure review of the authentication code that stays

This is a review seat, run by a reviewer who fixes what it finds (repository rule: "A reviewer fixes what it finds"). It does not change behavior.

**Scope:**
- `shadows-backend/src/**` (identity, devices, platform/database, transports/http, app) with their `contract.yaml` files and tests.
- `nylra/apps/desktop/src-tauri/src/**` and `nylra/apps/desktop/src/**`.

**Rules to check:**
- A file over 300 lines states its single responsibility; over 500 it splits by responsibility. `nylra/apps/desktop/src-tauri/src/native_login/mod.rs` is 420 lines: either name its one job in a short phrase without "and" and record it in the commit, or split it so each file has one.
- No `helpers`/`utils` pile; no file that must be read together with its sibling to make sense.
- Each `contract.yaml` matches the code: every `public_api` name exists, every obligation's test exists and asserts the rule.
- No dead code, no probe leftovers, no unused dependency.
- Adapters translate and hold no rule.

- [ ] **Step 1: Read the code maps first** (`shadows-backend/docs/codebase/README.md`, `nylra/docs/codebase/README.md`), then each module's contract, then the code.
- [ ] **Step 2: Fix what you find,** one commit per repository, each message naming what changed and why.
- [ ] **Step 3: Run each repository's checks**

```bash
cd E:/Globalprojects/shadows-backend
npm run typecheck
npm run check:contracts
npm run check:docs
npm test
cd E:/Globalprojects/nylra/apps/desktop
npm run build
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

`npm test` in shadows-backend starts embedded PostgreSQL; if it cannot start on this machine, report that and the commands that did pass.

- [ ] **Step 4: Report** everything found, what was fixed, and what was left with the reason.

---

## Step 1: The nylra-v1 0.2 contract

All tasks below are in `E:/Globalprojects/shadows-backend` on `spec/aylul-companion`. The code in them was run on 2026-10-13 against the pinned libraries: the typecheck passed, and every test passed except the Windows-only spawn noted in Global Constraints.

### Task 5: the schema and its fixtures

**Files:**
- Create: `src/transports/http/nylra-schema.ts`
- Create: `api/nylra-v1.fixtures.json`
- Create: `tests/integration/nylra-wire.test.ts` (the fixture test now; Task 6 adds the rest)

**Interfaces:**
- Produces: the exported TypeBox schemas named in the file below (`Laptop`, `Topic`, `Entry`, `TopicEvent`, `Session`, `Step`, `SessionEvent`, `Approval`, `Decider`, `ApprovalDecide`, `GrantRevoked`, `AccountEvent`, `NylraRefusal`, `Empty`, and the rest), and `type Schema = TSchema`.
- Produces: `api/nylra-v1.fixtures.json` with keys `contractVersion`, `notice`, `valid` (one value per schema name; `TopicEvents`, `SessionEvents`, `AccountEvents` are arrays), `responses` (per-operation overrides keyed `"METHOD /path"`), `mock` (`decidedApprovalId`, `expiredApprovalId`), `invalid` (`schema`, `why`, `value`; markers `@@LONG_MESSAGE@@` and `@@LONG_SUMMARY@@`), `refusals`.

- [ ] **Step 1: Write the fixture test**

`tests/integration/nylra-wire.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Value } from '@sinclair/typebox/value';
import * as S from '../../src/transports/http/nylra-schema.js';

const schemas = S as unknown as Record<string, Parameters<typeof Value.Check>[0]>;
const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8'));
const streams: Record<string, string> = { TopicEvents: 'TopicEvent', SessionEvents: 'SessionEvent', AccountEvents: 'AccountEvent' };

test('nylra_wire fixtures pass and invalid samples refuse for their stated reason', () => {
  for (const [name, value] of Object.entries(fixtures.valid)) {
    const schema = schemas[streams[name] ?? name];
    assert.ok(schema, name);
    for (const item of streams[name] ? value as unknown[] : [value])
      assert.ok(Value.Check(schema, item), `${name}: ${[...Value.Errors(schema, item)][0]?.message}`);
  }
  for (const [name, events] of Object.entries(fixtures.valid).filter(([name]) => streams[name])) {
    const seqs = (events as { seq: number }[]).map(event => event.seq);
    assert.deepEqual(seqs, seqs.map((_, index) => seqs[0]! + index), `${name} is gapless`);
  }
  for (const sample of fixtures.invalid) {
    const value = JSON.parse(JSON.stringify(sample.value)
      .replace('@@LONG_MESSAGE@@', 'x'.repeat(2001)).replace('@@LONG_SUMMARY@@', 'x'.repeat(201)));
    assert.equal(Value.Check(schemas[sample.schema]!, value), false, sample.why);
  }
  for (const refusal of fixtures.refusals) assert.ok(Value.Check(S.NylraRefusal, refusal.body));
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --import tsx --test tests/integration/nylra-wire.test.ts`
Expected: FAIL, cannot find `nylra-schema.js` or `nylra-v1.fixtures.json`.

- [ ] **Step 3: Write the schema**

`src/transports/http/nylra-schema.ts`:

```ts
// Canonical nylra-v1 wire shapes, shared by the Flutter app and AYLUL desktop.
// nylra-paths.ts names the operations; scripts/mock-nylra.ts answers them from fixtures.
import { Type, type TSchema } from '@sinclair/typebox';

type Fields = Parameters<typeof Type.Object>[0];
const closed = <T extends Fields>(fields: T, description?: string) =>
  Type.Object(fields, { additionalProperties: false, ...(description ? { description } : {}) });
const literals = <T extends string>(values: T[]) => Type.Union(values.map(value => Type.Literal(value)));
const text = (maxLength: number, minLength = 0) => Type.String({ minLength, maxLength });
const nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const Id = Type.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' });
export const Timestamp = Type.String({
  pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,9})?Z$', description: 'UTC, RFC 3339.',
});
export const Seq = Type.Integer({ minimum: 0, description: 'Position in one ordered stream; gapless and never reused.' });
export const CommandId = Type.String({
  ...Id, description: 'Client-generated. The same id with the same request replays; with another, command_conflict.',
});

// Links: laptops running AYLUL desktop that this account paired.
export const LinkClaim = closed({ commandId: CommandId, code: Type.String({ pattern: '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' }) },
  'The pairing code AYLUL desktop displays.');
export const Laptop = closed({
  laptopId: Id, name: text(80, 1), status: literals(['online', 'offline']), lastSeenAt: nullable(Timestamp),
});
export const LaptopList = closed({ laptops: Type.Array(Laptop, { maxItems: 20 }) });
export const LaptopParams = closed({ laptopId: Id });

// Push registration for the current phone.
export const PushRegistration = closed({ platform: literals(['fcm', 'apns']), token: text(4096, 1) });

// Chat: topics, their entries and their stream.
export const ProjectRef = closed({ laptopId: Id, projectId: text(128, 1), name: text(200) },
  'A Shadows project shared with AYLUL on one laptop.');
export const Topic = closed({
  topicId: Id, title: text(200), project: nullable(ProjectRef), state: literals(['open', 'resolved']),
  createdAt: Timestamp, updatedAt: Timestamp, lastSeq: Seq,
});
export const TopicList = closed({ topics: Type.Array(Topic, { maxItems: 200 }), cursor: Seq },
  'cursor is the account stream position matching this list.');
export const TopicCreate = closed({
  commandId: CommandId, title: Type.Optional(text(200, 1)),
  project: Type.Optional(closed({ laptopId: Id, projectId: text(128, 1) })),
});
export const TopicParams = closed({ topicId: Id });
export const AfterQuery = closed({ after: Type.Optional(Seq) });
export const SourceRef = closed({
  kind: Type.String({ pattern: '^[a-z][a-z_]{0,39}$' }), id: text(128, 1), version: text(128, 1), readAt: Timestamp,
}, 'What an answer rests on, as the brain read it.');
const entry = <T extends Fields>(type: string, fields: T) =>
  closed({ type: Type.Literal(type), entryId: Id, seq: Seq, createdAt: Timestamp, ...fields });
export const Entry = Type.Union([
  entry('user_message', { turnId: Id, text: text(2000, 1) }),
  entry('assistant_message', {
    turnId: Id, text: text(16000), status: literals(['streaming', 'complete', 'partial']),
    answeredBy: literals(['laptop', 'cloud']), sources: Type.Array(SourceRef, { maxItems: 50 }),
  }),
]);
export const TopicSnapshot = closed({ topic: Topic, entries: Type.Array(Entry, { maxItems: 1000 }), cursor: Seq });
const event = <T extends Fields>(type: string, fields: T) => closed({ type: Type.Literal(type), seq: Seq, ...fields });
export const TopicEvent = Type.Union([
  event('entry_added', { entry: Entry }),
  event('delta', { entryId: Id, text: text(4000, 1) }),
  event('entry_updated', { entry: Entry }),
  event('turn_finished', { turnId: Id, outcome: literals(['done', 'error', 'cancelled']), code: Type.Optional(text(64, 1)) }),
  event('topic_updated', { topic: Topic }),
]);
export const TurnRequest = closed({ commandId: CommandId, message: text(2000, 1) });
export const TurnAccepted = closed({ turnId: Id, entryId: Id, seq: Seq });
export const TurnParams = closed({ topicId: Id, turnId: Id });

// Sessions: what Claude Code and Codex are doing on each laptop.
export const Agent = literals(['claude_code', 'codex']);
export const Step = closed({
  stepId: Id, seq: Seq, at: Timestamp, tool: text(64, 1), path: nullable(text(1024, 1)), summary: text(200, 1),
}, 'One agent step as the laptop summarized it. Never a diff or file content.');
export const Session = closed({
  sessionId: Id, laptopId: Id, agent: Agent, projectName: text(200), cwd: text(1024, 1),
  state: literals(['running', 'waiting', 'ended', 'offline']), startedAt: Timestamp, updatedAt: Timestamp,
  lastStep: nullable(Step), lastSeq: Seq,
}, 'offline: its laptop is not connected, and the rest is as last reported.');
export const SessionList = closed({ sessions: Type.Array(Session, { maxItems: 200 }), cursor: Seq },
  'cursor is the account stream position matching this list.');
export const SessionQuery = closed({ laptopId: Type.Optional(Id) });
export const SessionParams = closed({ sessionId: Id });
export const SessionSnapshot = closed({ session: Session, steps: Type.Array(Step, { maxItems: 500 }), cursor: Seq });
export const SessionEvent = Type.Union([
  event('step_added', { step: Step }),
  event('session_updated', { session: Session }),
]);

// Approvals: an agent's request, and who decided it.
export const Decider = Type.Union([
  closed({ kind: Type.Literal('person') }),
  closed({ kind: Type.Literal('aylul_grant'), grantId: Id }),
], { description: 'person: the person decided. aylul_grant: AYLUL decided on their behalf under that grant.' });
export const Approval = closed({
  approvalId: Id, sessionId: Id, laptopId: Id, agent: Agent, tool: text(64, 1),
  path: nullable(text(1024, 1)), command: nullable(text(2000, 1)), summary: text(200, 1),
  requestedAt: Timestamp, expiresAt: Timestamp, state: literals(['pending', 'allowed', 'denied', 'expired']),
  decidedBy: nullable(Decider), decidedAt: nullable(Timestamp),
});
export const ApprovalList = closed({ approvals: Type.Array(Approval, { maxItems: 200 }), cursor: Seq },
  'Pending requests, oldest first. cursor is the account stream position matching this list.');
export const ApprovalParams = closed({ approvalId: Id });
export const ApprovalDecide = closed({ commandId: CommandId, decision: literals(['allow', 'deny']) },
  'The person decides. The account comes from the session, never the body.');

// Grants: the phone can only revoke one. Creating or widening a grant happens on the laptop.
export const GrantParams = closed({ grantId: Id });
export const GrantRevoke = closed({ commandId: CommandId });
export const GrantRevoked = closed({ grantId: Id, revokedAt: Timestamp },
  'Revoking an already revoked grant answers the same value again.');

// Account stream: what the lists and notifications need.
export const AccountEvent = Type.Union([
  event('approval_requested', { approval: Approval }),
  event('approval_resolved', { approval: Approval }),
  event('session_changed', { session: Session }),
  event('laptop_online', { laptop: Laptop }),
  event('laptop_offline', { laptop: Laptop }),
  event('topic_updated', { topic: Topic }),
]);

export const NylraRefusal = closed({ code: literals([
  'request_invalid', 'unauthorized', 'not_found', 'rate_limited', 'operation_failed',
  'link_code_invalid', 'command_conflict', 'resnapshot_required', 'approval_already_decided', 'approval_expired',
]) });
export const Empty = closed({});
export type Schema = TSchema;
```

- [ ] **Step 4: Write the fixtures**

`api/nylra-v1.fixtures.json`, exactly:

```json
{
 "contractVersion":"0.2.0",
 "notice":"Synthetic wire examples only. Ids, names and texts describe no real project or account.",
 "valid":{
  "LinkClaim":{"commandId":"00000000-0000-4000-8000-0000000000c1","code":"K7QF-3MZP"},
  "Laptop":{"laptopId":"00000000-0000-4000-8000-000000000010","name":"Laptop","status":"online","lastSeenAt":"2026-10-13T09:40:00Z"},
  "LaptopList":{"laptops":[{"laptopId":"00000000-0000-4000-8000-000000000010","name":"Laptop","status":"online","lastSeenAt":"2026-10-13T09:40:00Z"}]},
  "PushRegistration":{"platform":"fcm","token":"synthetic-fcm-token"},
  "Topic":{"topicId":"00000000-0000-4000-8000-000000000030","title":"وين وصلنا في Synthetic Lighthouse؟","project":{"laptopId":"00000000-0000-4000-8000-000000000010","projectId":"proj-synthetic-1","name":"Synthetic Lighthouse"},"state":"open","createdAt":"2026-10-13T09:30:00Z","updatedAt":"2026-10-13T09:30:05Z","lastSeq":2},
  "TopicList":{"topics":[{"topicId":"00000000-0000-4000-8000-000000000030","title":"وين وصلنا في Synthetic Lighthouse؟","project":{"laptopId":"00000000-0000-4000-8000-000000000010","projectId":"proj-synthetic-1","name":"Synthetic Lighthouse"},"state":"open","createdAt":"2026-10-13T09:30:00Z","updatedAt":"2026-10-13T09:30:05Z","lastSeq":2}],"cursor":12},
  "TopicCreate":{"commandId":"00000000-0000-4000-8000-0000000000c2","project":{"laptopId":"00000000-0000-4000-8000-000000000010","projectId":"proj-synthetic-1"}},
  "TopicSnapshot":{"topic":{"topicId":"00000000-0000-4000-8000-000000000030","title":"وين وصلنا في Synthetic Lighthouse؟","project":{"laptopId":"00000000-0000-4000-8000-000000000010","projectId":"proj-synthetic-1","name":"Synthetic Lighthouse"},"state":"open","createdAt":"2026-10-13T09:30:00Z","updatedAt":"2026-10-13T09:30:05Z","lastSeq":2},"entries":[{"type":"user_message","entryId":"00000000-0000-4000-8000-000000000051","seq":1,"createdAt":"2026-10-13T09:30:00Z","turnId":"00000000-0000-4000-8000-000000000050","text":"وين وصلنا في المشروع؟"},{"type":"assistant_message","entryId":"00000000-0000-4000-8000-000000000052","seq":2,"createdAt":"2026-10-13T09:30:05Z","turnId":"00000000-0000-4000-8000-000000000050","text":"الخطة الحالية في مرحلة البناء، وآخر مهمة مكتملة هي تسجيل الدخول.","status":"complete","answeredBy":"laptop","sources":[{"kind":"plan","id":"plan-synthetic-1","version":"7","readAt":"2026-10-13T09:30:01Z"}]}],"cursor":2},
  "TopicEvents":[
   {"type":"entry_added","seq":3,"entry":{"type":"user_message","entryId":"00000000-0000-4000-8000-000000000056","seq":3,"createdAt":"2026-10-13T09:35:00Z","turnId":"00000000-0000-4000-8000-000000000055","text":"وش باقي؟"}},
   {"type":"entry_added","seq":4,"entry":{"type":"assistant_message","entryId":"00000000-0000-4000-8000-000000000057","seq":4,"createdAt":"2026-10-13T09:35:01Z","turnId":"00000000-0000-4000-8000-000000000055","text":"","status":"streaming","answeredBy":"cloud","sources":[]}},
   {"type":"delta","seq":5,"entryId":"00000000-0000-4000-8000-000000000057","text":"باقي مهمتان: "},
   {"type":"delta","seq":6,"entryId":"00000000-0000-4000-8000-000000000057","text":"الجلسات والموافقات."},
   {"type":"entry_updated","seq":7,"entry":{"type":"assistant_message","entryId":"00000000-0000-4000-8000-000000000057","seq":4,"createdAt":"2026-10-13T09:35:01Z","turnId":"00000000-0000-4000-8000-000000000055","text":"باقي مهمتان: الجلسات والموافقات.","status":"complete","answeredBy":"cloud","sources":[]}},
   {"type":"turn_finished","seq":8,"turnId":"00000000-0000-4000-8000-000000000055","outcome":"done"}
  ],
  "TurnRequest":{"commandId":"00000000-0000-4000-8000-0000000000c3","message":"وش باقي؟"},
  "TurnAccepted":{"turnId":"00000000-0000-4000-8000-000000000055","entryId":"00000000-0000-4000-8000-000000000056","seq":3},
  "Step":{"stepId":"00000000-0000-4000-8000-000000000061","seq":1,"at":"2026-10-13T09:20:00Z","tool":"Read","path":"src/auth/login.ts","summary":"Read the login handler"},
  "Session":{"sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","projectName":"Synthetic Lighthouse","cwd":"C:/work/synthetic-lighthouse","state":"running","startedAt":"2026-10-13T09:15:00Z","updatedAt":"2026-10-13T09:21:00Z","lastStep":{"stepId":"00000000-0000-4000-8000-000000000062","seq":2,"at":"2026-10-13T09:21:00Z","tool":"Edit","path":"src/auth/login.ts","summary":"Added the token refresh call"},"lastSeq":2},
  "SessionList":{"sessions":[{"sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","projectName":"Synthetic Lighthouse","cwd":"C:/work/synthetic-lighthouse","state":"running","startedAt":"2026-10-13T09:15:00Z","updatedAt":"2026-10-13T09:21:00Z","lastStep":{"stepId":"00000000-0000-4000-8000-000000000062","seq":2,"at":"2026-10-13T09:21:00Z","tool":"Edit","path":"src/auth/login.ts","summary":"Added the token refresh call"},"lastSeq":2}],"cursor":12},
  "SessionSnapshot":{"session":{"sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","projectName":"Synthetic Lighthouse","cwd":"C:/work/synthetic-lighthouse","state":"running","startedAt":"2026-10-13T09:15:00Z","updatedAt":"2026-10-13T09:21:00Z","lastStep":{"stepId":"00000000-0000-4000-8000-000000000062","seq":2,"at":"2026-10-13T09:21:00Z","tool":"Edit","path":"src/auth/login.ts","summary":"Added the token refresh call"},"lastSeq":2},"steps":[{"stepId":"00000000-0000-4000-8000-000000000061","seq":1,"at":"2026-10-13T09:20:00Z","tool":"Read","path":"src/auth/login.ts","summary":"Read the login handler"},{"stepId":"00000000-0000-4000-8000-000000000062","seq":2,"at":"2026-10-13T09:21:00Z","tool":"Edit","path":"src/auth/login.ts","summary":"Added the token refresh call"}],"cursor":2},
  "SessionEvents":[
   {"type":"step_added","seq":3,"step":{"stepId":"00000000-0000-4000-8000-000000000063","seq":3,"at":"2026-10-13T09:22:00Z","tool":"Bash","path":null,"summary":"Asked to run the test suite"}},
   {"type":"session_updated","seq":4,"session":{"sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","projectName":"Synthetic Lighthouse","cwd":"C:/work/synthetic-lighthouse","state":"waiting","startedAt":"2026-10-13T09:15:00Z","updatedAt":"2026-10-13T09:22:00Z","lastStep":{"stepId":"00000000-0000-4000-8000-000000000063","seq":3,"at":"2026-10-13T09:22:00Z","tool":"Bash","path":null,"summary":"Asked to run the test suite"},"lastSeq":4}}
  ],
  "Approval":{"approvalId":"00000000-0000-4000-8000-000000000070","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Bash","path":null,"command":"npm test","summary":"Run the test suite","requestedAt":"2026-10-13T09:22:00Z","expiresAt":"2026-10-13T09:32:00Z","state":"pending","decidedBy":null,"decidedAt":null},
  "ApprovalList":{"approvals":[{"approvalId":"00000000-0000-4000-8000-000000000070","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Bash","path":null,"command":"npm test","summary":"Run the test suite","requestedAt":"2026-10-13T09:22:00Z","expiresAt":"2026-10-13T09:32:00Z","state":"pending","decidedBy":null,"decidedAt":null}],"cursor":12},
  "ApprovalDecide":{"commandId":"00000000-0000-4000-8000-0000000000c4","decision":"allow"},
  "GrantRevoke":{"commandId":"00000000-0000-4000-8000-0000000000c5"},
  "GrantRevoked":{"grantId":"00000000-0000-4000-8000-000000000080","revokedAt":"2026-10-13T09:40:00Z"},
  "AccountEvents":[
   {"type":"approval_requested","seq":13,"approval":{"approvalId":"00000000-0000-4000-8000-000000000070","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Bash","path":null,"command":"npm test","summary":"Run the test suite","requestedAt":"2026-10-13T09:22:00Z","expiresAt":"2026-10-13T09:32:00Z","state":"pending","decidedBy":null,"decidedAt":null}},
   {"type":"approval_resolved","seq":14,"approval":{"approvalId":"00000000-0000-4000-8000-000000000071","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Edit","path":"src/auth/login.ts","command":null,"summary":"Edit the login handler","requestedAt":"2026-10-13T09:21:00Z","expiresAt":"2026-10-13T09:31:00Z","state":"allowed","decidedBy":{"kind":"aylul_grant","grantId":"00000000-0000-4000-8000-000000000080"},"decidedAt":"2026-10-13T09:21:01Z"}},
   {"type":"session_changed","seq":15,"session":{"sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","projectName":"Synthetic Lighthouse","cwd":"C:/work/synthetic-lighthouse","state":"waiting","startedAt":"2026-10-13T09:15:00Z","updatedAt":"2026-10-13T09:22:00Z","lastStep":{"stepId":"00000000-0000-4000-8000-000000000063","seq":3,"at":"2026-10-13T09:22:00Z","tool":"Bash","path":null,"summary":"Asked to run the test suite"},"lastSeq":4}},
   {"type":"laptop_offline","seq":16,"laptop":{"laptopId":"00000000-0000-4000-8000-000000000010","name":"Laptop","status":"offline","lastSeenAt":"2026-10-13T09:45:00Z"}},
   {"type":"laptop_online","seq":17,"laptop":{"laptopId":"00000000-0000-4000-8000-000000000010","name":"Laptop","status":"online","lastSeenAt":"2026-10-13T09:50:00Z"}},
   {"type":"topic_updated","seq":18,"topic":{"topicId":"00000000-0000-4000-8000-000000000030","title":"وين وصلنا في Synthetic Lighthouse؟","project":{"laptopId":"00000000-0000-4000-8000-000000000010","projectId":"proj-synthetic-1","name":"Synthetic Lighthouse"},"state":"open","createdAt":"2026-10-13T09:30:00Z","updatedAt":"2026-10-13T09:35:03Z","lastSeq":8}}
  ]
 },
 "responses":{"POST /v1/nylra/approvals/{approvalId}/decide":{"approvalId":"00000000-0000-4000-8000-000000000070","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Bash","path":null,"command":"npm test","summary":"Run the test suite","requestedAt":"2026-10-13T09:22:00Z","expiresAt":"2026-10-13T09:32:00Z","state":"allowed","decidedBy":{"kind":"person"},"decidedAt":"2026-10-13T09:23:00Z"}},
 "mock":{"decidedApprovalId":"00000000-0000-4000-8000-000000000071","expiredApprovalId":"00000000-0000-4000-8000-000000000072"},
 "invalid":[
  {"schema":"LinkClaim","why":"0 and O are excluded from pairing codes","value":{"commandId":"00000000-0000-4000-8000-0000000000c1","code":"K7QF-3MZ0"}},
  {"schema":"ApprovalDecide","why":"a decision is allow or deny","value":{"commandId":"00000000-0000-4000-8000-0000000000c4","decision":"approve"}},
  {"schema":"ApprovalDecide","why":"the account comes from the session, never the body","value":{"commandId":"00000000-0000-4000-8000-0000000000c4","decision":"allow","accountId":"00000000-0000-4000-8000-000000000001"}},
  {"schema":"Step","why":"no diff leaves the laptop","value":{"stepId":"00000000-0000-4000-8000-000000000061","seq":1,"at":"2026-10-13T09:20:00Z","tool":"Read","path":"src/auth/login.ts","summary":"Read the login handler","diff":"@@ -1 +1 @@"}},
  {"schema":"Step","why":"a summary is one line of at most 200 characters","value":{"stepId":"00000000-0000-4000-8000-000000000061","seq":1,"at":"2026-10-13T09:20:00Z","tool":"Read","path":"src/auth/login.ts","summary":"@@LONG_SUMMARY@@"}},
  {"schema":"Approval","why":"a grant decision names its grant","value":{"approvalId":"00000000-0000-4000-8000-000000000071","sessionId":"00000000-0000-4000-8000-000000000060","laptopId":"00000000-0000-4000-8000-000000000010","agent":"claude_code","tool":"Edit","path":"src/auth/login.ts","command":null,"summary":"Edit the login handler","requestedAt":"2026-10-13T09:21:00Z","expiresAt":"2026-10-13T09:31:00Z","state":"allowed","decidedBy":{"kind":"aylul_grant"},"decidedAt":"2026-10-13T09:21:01Z"}},
  {"schema":"TurnRequest","why":"a message is at most 2000 characters","value":{"commandId":"00000000-0000-4000-8000-0000000000c3","message":"@@LONG_MESSAGE@@"}},
  {"schema":"Laptop","why":"times are UTC","value":{"laptopId":"00000000-0000-4000-8000-000000000010","name":"Laptop","status":"online","lastSeenAt":"2026-10-13T12:40:00+03:00"}}
 ],
 "refusals":[{"status":401,"body":{"code":"unauthorized"}},{"status":409,"body":{"code":"approval_already_decided"}},{"status":410,"body":{"code":"resnapshot_required"}}]
}
```

- [ ] **Step 5: Run the test to see it pass**

Run: `node --import tsx --test tests/integration/nylra-wire.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add src/transports/http/nylra-schema.ts api/nylra-v1.fixtures.json tests/integration/nylra-wire.test.ts
git commit -m "feat(api): nylra-v1 0.2 schema and synthetic fixtures"
```

### Task 6: the operations, the exported contract and its owner's contract

**Files:**
- Create: `src/transports/http/nylra-paths.ts`
- Create: `scripts/export-nylra-schema.ts`
- Generate: `api/nylra-v1.openapi.json`, `api/nylra-v1.d.ts`
- Modify: `tests/integration/nylra-wire.test.ts`, `package.json` (scripts), `src/transports/http/contract.yaml`, `docs/codebase/README.md` (HTTP row)

**Interfaces:**
- Consumes: Task 5's schemas.
- Produces: `interface NylraOperation { method; path; summary; params?; query?; body?; ok; okType?; refusals }` and `nylraOperations: NylraOperation[]` (16 paths, 18 operations); `nylraSchema(): string` and `nylraVersion = '0.2.0'` from `scripts/export-nylra-schema.ts`.

- [ ] **Step 1: Add the snapshot and operation tests**

Replace the imports at the top of `tests/integration/nylra-wire.test.ts` with:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { Value } from '@sinclair/typebox/value';
import * as S from '../../src/transports/http/nylra-schema.js';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';
import { nylraSchema, nylraVersion } from '../../scripts/export-nylra-schema.js';
```

Then add these three tests after the existing one:

```ts
test('nylra_wire snapshots match the canonical schema', async () => {
  const document = nylraSchema();
  assert.equal(document, await readFile('api/nylra-v1.openapi.json', 'utf8'));
  assert.ok(!document.includes('"const"'), 'OpenAPI 3.0 has no const');
  assert.ok(!document.includes('"type": "null"'), 'OpenAPI 3.0 has no null type');
  await mkdir('.test-runtime', { recursive: true });
  const directory = await mkdtemp(resolve('.test-runtime/nylra-schema-'));
  try {
    await promisify(execFile)(resolve('node_modules/.bin/openapi-typescript'), [resolve('api/nylra-v1.openapi.json'), '-o', resolve(directory, 'schema.d.ts')]);
    assert.equal(await readFile(resolve(directory, 'schema.d.ts'), 'utf8'), await readFile('api/nylra-v1.d.ts', 'utf8'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('nylra_wire every operation is bearer-protected and refuses with the shared shape', () => {
  const document = JSON.parse(nylraSchema());
  assert.equal(document.info.version, nylraVersion);
  assert.equal(fixtures.contractVersion, nylraVersion);
  for (const op of nylraOperations) {
    assert.ok(op.path.startsWith('/v1/nylra/'), op.path);
    const operation = document.paths[op.path][op.method];
    assert.deepEqual(operation.security, [{ backendBearer: [] }]);
    for (const status of [400, 401, 503])
      assert.deepEqual(operation.responses[status].content['application/json'].schema, { $ref: '#/components/schemas/NylraRefusal' });
  }
});

test('nylra_wire every operation has a fixture the mock can answer with', () => {
  for (const op of nylraOperations) {
    if (op.okType === 'text/event-stream' || op.ok === S.Empty) continue;
    const name = Object.entries(S).find(([, value]) => value === op.ok)![0];
    const value = fixtures.responses[`${op.method.toUpperCase()} ${op.path}`] ?? fixtures.valid[name];
    assert.ok(value && Value.Check(op.ok, value), `${op.method} ${op.path}`);
  }
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --import tsx --test tests/integration/nylra-wire.test.ts`
Expected: FAIL, cannot find `nylra-paths.js`.

- [ ] **Step 3: Write the operations table**

`src/transports/http/nylra-paths.ts`:

```ts
// The nylra-v1 operations. Routes and the mock server take their schemas from this
// table, so the exported contract and what is served cannot drift apart.
import * as S from './nylra-schema.js';

export interface NylraOperation {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  summary: string;
  params?: S.Schema; query?: S.Schema; body?: S.Schema;
  ok: S.Schema; okType?: 'application/json' | 'text/event-stream';
  refusals: number[];
}
const common = [400, 401, 429, 503];
const stream = 'text/event-stream';

export const nylraOperations: NylraOperation[] = [
  { method: 'put', path: '/v1/nylra/devices/current/push', summary: 'Register this phone for push notifications', body: S.PushRegistration, ok: S.Empty, refusals: common },
  { method: 'delete', path: '/v1/nylra/devices/current/push', summary: 'Stop push notifications to this phone', ok: S.Empty, refusals: common },

  { method: 'post', path: '/v1/nylra/laptops/claim', summary: 'Pair a laptop by the code AYLUL desktop shows', body: S.LinkClaim, ok: S.Laptop, refusals: [...common, 409] },
  { method: 'get', path: '/v1/nylra/laptops', summary: 'Paired laptops and whether each is online', ok: S.LaptopList, refusals: common },
  { method: 'delete', path: '/v1/nylra/laptops/{laptopId}', summary: 'Unpair a laptop; its sessions and approvals stop reaching this account', params: S.LaptopParams, ok: S.Empty, refusals: [...common, 404] },

  { method: 'get', path: '/v1/nylra/topics', summary: 'Topics, newest activity first, with the account cursor', ok: S.TopicList, refusals: common },
  { method: 'post', path: '/v1/nylra/topics', summary: 'Start a conversation, optionally about one shared project', body: S.TopicCreate, ok: S.Topic, refusals: [...common, 404, 409] },
  { method: 'get', path: '/v1/nylra/topics/{topicId}', summary: 'Topic snapshot; its events after the cursor are exactly the later ones', params: S.TopicParams, ok: S.TopicSnapshot, refusals: [...common, 404] },
  { method: 'get', path: '/v1/nylra/topics/{topicId}/events', summary: 'Topic events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', params: S.TopicParams, query: S.AfterQuery, ok: S.TopicEvent, okType: stream, refusals: [...common, 404, 410] },
  { method: 'post', path: '/v1/nylra/topics/{topicId}/turns', summary: 'Send a message; the answer arrives on the topic stream', params: S.TopicParams, body: S.TurnRequest, ok: S.TurnAccepted, refusals: [...common, 404, 409] },
  { method: 'post', path: '/v1/nylra/topics/{topicId}/turns/{turnId}/cancel', summary: 'Stop an answer; its output so far stays, marked partial', params: S.TurnParams, body: S.Empty, ok: S.Empty, refusals: [...common, 404] },

  { method: 'get', path: '/v1/nylra/sessions', summary: 'Agent sessions on every paired laptop, or one', query: S.SessionQuery, ok: S.SessionList, refusals: common },
  { method: 'get', path: '/v1/nylra/sessions/{sessionId}', summary: 'Session snapshot with its recent steps', params: S.SessionParams, ok: S.SessionSnapshot, refusals: [...common, 404] },
  { method: 'get', path: '/v1/nylra/sessions/{sessionId}/events', summary: 'Session events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', params: S.SessionParams, query: S.AfterQuery, ok: S.SessionEvent, okType: stream, refusals: [...common, 404, 410] },

  { method: 'get', path: '/v1/nylra/approvals', summary: 'Pending approval requests, oldest first', ok: S.ApprovalList, refusals: common },
  { method: 'post', path: '/v1/nylra/approvals/{approvalId}/decide', summary: 'The person allows or denies one request. Already decided or expired: 409', params: S.ApprovalParams, body: S.ApprovalDecide, ok: S.Approval, refusals: [...common, 404, 409] },

  { method: 'post', path: '/v1/nylra/grants/{grantId}/revoke', summary: 'Revoke a grant; its next match goes to the person', params: S.GrantParams, body: S.GrantRevoke, ok: S.GrantRevoked, refusals: [...common, 404] },

  { method: 'get', path: '/v1/nylra/events', summary: 'Account events after a cursor (SSE; id = seq). Unknown or expired cursor: 410 resnapshot_required', query: S.AfterQuery, ok: S.AccountEvent, okType: stream, refusals: [...common, 410] },
];
```

- [ ] **Step 4: Write the export script**

`scripts/export-nylra-schema.ts`:

```ts
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { nylraOperations } from '../src/transports/http/nylra-paths.js';
import * as S from '../src/transports/http/nylra-schema.js';

export const nylraVersion = '0.2.0';

// Every exported object or union schema is one named component; a use of the same
// TypeBox value becomes a $ref, so the document stays readable for generators.
const named = new Map<object, string>(Object.entries(S)
  .filter(([, value]) => typeof value === 'object' && value !== null && ('properties' in value || 'anyOf' in value))
  .map(([name, value]) => [value as object, name]));

// OpenAPI 3.0 has neither const nor a null type, and Dart generators read 3.0:
// a literal becomes a one-value enum, a union of literals one enum, and a union
// with null a nullable schema.
function plain(schema: unknown, own?: string): unknown {
  if (Array.isArray(schema)) return schema.map(item => plain(item));
  if (typeof schema !== 'object' || schema === null) return schema;
  const name = named.get(schema);
  if (name && name !== own) return { $ref: `#/components/schemas/${name}` };
  const value = schema as Record<string, unknown>;
  if (typeof value.const === 'string') return { type: 'string', enum: [value.const] };
  if (Array.isArray(value.anyOf)) {
    const members = value.anyOf as Record<string, unknown>[];
    const description = value.description === undefined ? {} : { description: value.description };
    if (members.every(member => typeof member.const === 'string'))
      return { type: 'string', enum: members.map(member => member.const), ...description };
    const present = members.filter(member => member.type !== 'null');
    if (present.length === 1 && present.length < members.length) {
      const only = plain(present[0]) as Record<string, unknown>;
      return '$ref' in only ? { allOf: [only], nullable: true, ...description } : { ...only, nullable: true };
    }
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
}

const parameters = (schema: { properties?: Record<string, unknown>; required?: string[] } | undefined, place: 'path' | 'query') =>
  Object.entries(schema?.properties ?? {}).map(([name, value]) =>
    ({ name, in: place, required: place === 'path' || (schema?.required ?? []).includes(name), schema: plain(value) }));

export function nylraSchema(): string {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of nylraOperations) {
    const responses: Record<string, unknown> = {
      200: {
        description: op.okType === 'text/event-stream' ? 'Stream; each event data is one value of this schema' : 'OK',
        content: { [op.okType ?? 'application/json']: { schema: plain(op.ok) } },
      },
    };
    for (const status of op.refusals)
      responses[status] = { description: 'Refusal', content: { 'application/json': { schema: plain(S.NylraRefusal) } } };
    paths[op.path] = { ...paths[op.path], [op.method]: {
      summary: op.summary, security: [{ backendBearer: [] }],
      parameters: [...parameters(op.params as never, 'path'), ...parameters(op.query as never, 'query')],
      ...(op.body ? { requestBody: { required: true, content: { 'application/json': { schema: plain(op.body) } } } } : {}),
      responses,
    } };
  }
  return JSON.stringify({
    openapi: '3.0.3',
    info: {
      title: 'NYLRA backend API', version: nylraVersion,
      description: 'Client contract for the Flutter app and AYLUL desktop. Sessions come from auth-v1. Until routes exist, scripts/mock-nylra.ts serves it from api/nylra-v1.fixtures.json.',
    },
    components: {
      securitySchemes: { backendBearer: { type: 'http', scheme: 'bearer' } },
      schemas: Object.fromEntries([...named].map(([schema, name]) => [name, plain(schema, name)])),
    },
    paths,
  }, null, 2) + '\n';
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await writeFile('api/nylra-v1.openapi.json', nylraSchema());
```

- [ ] **Step 5: Add the scripts to `package.json`**

Add `schema:nylra` and `mock:nylra`, and add the wire test to `schema:check`:

```json
"schema:check": "node --import tsx scripts/check-auth-schema.ts && node --import tsx --test tests/integration/auth-wire.test.ts tests/integration/nylra-wire.test.ts",
"schema:nylra": "node --import tsx scripts/export-nylra-schema.ts && openapi-typescript api/nylra-v1.openapi.json -o api/nylra-v1.d.ts",
"mock:nylra": "node --import tsx scripts/mock-nylra.ts",
```

(`mock:nylra` starts working in Task 7.)

- [ ] **Step 6: Generate the contract and run the tests**

```bash
npm run schema:nylra
node --import tsx --test tests/integration/nylra-wire.test.ts
npm run typecheck
```

Expected: `api/nylra-v1.openapi.json` (about 2,850 lines) and `api/nylra-v1.d.ts` exist; 4 tests PASS on Linux (on Windows the snapshot test fails only at the spawn); typecheck passes.

- [ ] **Step 7: Record the contract in the HTTP owner's `contract.yaml`**

In `src/transports/http/contract.yaml`, change `owns:` to:

```yaml
owns: Canonical auth-v1 and nylra-v1 TypeBox schemas, strict request/output validation, bearer translation and safe refusals.
```

Add under `public_api:`:

```yaml
  nylraOperations: The nylra-v1 operation table; exported to api/nylra-v1.openapi.json. No route serves it yet; scripts/mock-nylra.ts answers it from fixtures.
  NylraRefusal: The one refusal shape every nylra-v1 operation returns.
```

Add under `obligations:`:

```yaml
  - rule: The nylra-v1 OpenAPI 3.0 and generated TS snapshots equal what the canonical schema exports, with no const and no null type.
    tested_by: nylra_wire snapshots match the canonical schema
    note: tests/integration/nylra-wire.test.ts
  - rule: Every nylra-v1 operation declares bearer security and the shared refusal shape.
    tested_by: nylra_wire every operation is bearer-protected and refuses with the shared shape
    note: tests/integration/nylra-wire.test.ts
  - rule: Synthetic nylra-v1 fixtures pass and streams are gapless; each invalid sample refuses (pairing code alphabet, decision value, account field, diff in a step, summary length, grant without id, message length, non-UTC time).
    tested_by: nylra_wire fixtures pass and invalid samples refuse for their stated reason
    note: tests/integration/nylra-wire.test.ts
  - rule: Every nylra-v1 operation with a JSON answer has a fixture its schema accepts.
    tested_by: nylra_wire every operation has a fixture the mock can answer with
    note: tests/integration/nylra-wire.test.ts
```

Add under `open_questions:`:

```yaml
  - nylra-v1 0.2 has no routes, services or stores yet; they arrive with the backend relay plan and take their schemas from nylraOperations.
```

In `docs/codebase/README.md`, change the HTTP row's job to `Canonical auth-v1 and nylra-v1 schemas and transport translation`, and after the sentence about the generated auth-v1 OpenAPI add:

```markdown
The [nylra-v1 contract](../../api/nylra-v1.openapi.json), its [types](../../api/nylra-v1.d.ts) and [fixtures](../../api/nylra-v1.fixtures.json) come from the same HTTP owner; no route serves them yet.
```

- [ ] **Step 8: Run the owner checks**

```bash
npm run check:contracts
npm run check:docs
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add src/transports/http scripts/export-nylra-schema.ts api package.json tests/integration/nylra-wire.test.ts docs/codebase/README.md
git commit -m "feat(api): export nylra-v1 0.2 as OpenAPI 3.0 and TypeScript"
```

### Task 7: the mock server and the friend's handoff

**Files:**
- Create: `scripts/mock-nylra.ts`
- Create: `tests/integration/nylra-mock.test.ts`
- Create: `docs/nylra-v1-handoff.md`

**Interfaces:**
- Consumes: `nylraOperations`, Task 5's schemas and fixtures.
- Produces: `buildNylraMock(fixtures: NylraFixtures): FastifyInstance` and `interface NylraFixtures`; `npm run mock:nylra` listens on `NYLRA_MOCK_HOST` (default `127.0.0.1`) and `NYLRA_MOCK_PORT` (default `4410`).

- [ ] **Step 1: Write the mock test**

`tests/integration/nylra-mock.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Value } from '@sinclair/typebox/value';
import { nylraOperations } from '../../src/transports/http/nylra-paths.js';
import * as S from '../../src/transports/http/nylra-schema.js';
import { buildNylraMock, type NylraFixtures } from '../../scripts/mock-nylra.js';

const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8')) as NylraFixtures;
const app = buildNylraMock(fixtures);
const bearer = { authorization: 'Bearer synthetic' };
const ids: Record<string, string> = {
  laptopId: '00000000-0000-4000-8000-000000000010', topicId: '00000000-0000-4000-8000-000000000030',
  turnId: '00000000-0000-4000-8000-000000000055', sessionId: '00000000-0000-4000-8000-000000000060',
  approvalId: '00000000-0000-4000-8000-000000000070', grantId: '00000000-0000-4000-8000-000000000080',
};
const decide = (approvalId: string, decision = 'allow') => app.inject({
  method: 'POST', url: `/v1/nylra/approvals/${approvalId}/decide`, headers: bearer,
  payload: { commandId: '00000000-0000-4000-8000-0000000000c4', decision },
});
const seqs = (body: string) => [...body.matchAll(/^id: (\d+)$/gm)].map(match => Number(match[1]));

test('nylra_mock refuses a request without a bearer', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/nylra/approvals' });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { code: 'unauthorized' });
});

test('nylra_mock answers every operation with a value its schema accepts', async () => {
  for (const op of nylraOperations.filter(op => op.okType !== 'text/event-stream')) {
    const url = op.path.replace(/\{(\w+)\}/g, (_, name: string) => ids[name]!);
    const name = op.body && Object.entries(S).find(([, value]) => value === op.body)![0];
    const payload = op.body ? (name === 'Empty' ? {} : fixtures.valid[name!]) : undefined;
    const response = await app.inject({ method: op.method.toUpperCase() as 'GET', url, headers: bearer, payload: payload as object });
    assert.equal(response.statusCode, 200, `${op.method} ${op.path}: ${response.body}`);
    assert.ok(Value.Check(op.ok, response.json()), `${op.method} ${op.path}`);
  }
});

test('nylra_mock replays a stream after its cursor without gap or duplicate', async () => {
  const events = (after?: number) => app.inject({
    method: 'GET', url: `/v1/nylra/topics/${ids.topicId}/events${after === undefined ? '' : `?after=${after}`}`, headers: bearer,
  });
  assert.deepEqual(seqs((await events()).body), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seqs((await events(2)).body), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seqs((await events(6)).body), [7, 8]);
  assert.deepEqual(seqs((await events(8)).body), []);
  for (const cursor of [1, 9]) {
    const response = await events(cursor);
    assert.equal(response.statusCode, 410, `after=${cursor}`);
    assert.deepEqual(response.json(), { code: 'resnapshot_required' });
  }
});

test('nylra_mock refuses a decided, expired or unknown approval and an invalid decision', async () => {
  assert.equal((await decide(fixtures.mock.decidedApprovalId)).json().code, 'approval_already_decided');
  assert.equal((await decide(fixtures.mock.expiredApprovalId)).json().code, 'approval_expired');
  assert.equal((await decide('00000000-0000-4000-8000-0000000000ff')).statusCode, 404);
  const invalid = await decide(ids.approvalId!, 'approve');
  assert.equal(invalid.statusCode, 400);
  assert.deepEqual(invalid.json(), { code: 'request_invalid' });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --import tsx --test tests/integration/nylra-mock.test.ts`
Expected: FAIL, cannot find `scripts/mock-nylra.js`.

- [ ] **Step 3: Write the mock server**

`scripts/mock-nylra.ts`:

```ts
// Development-only server that answers nylra-v1 from its synthetic fixtures, so the
// Flutter app and AYLUL desktop are built before the real routes exist. It holds no
// product rule: it validates against the contract and replays what the fixtures say.
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Value } from '@sinclair/typebox/value';
import { nylraOperations, type NylraOperation } from '../src/transports/http/nylra-paths.js';
import * as S from '../src/transports/http/nylra-schema.js';

export interface NylraFixtures {
  valid: Record<string, unknown>;
  responses: Record<string, unknown>;
  mock: { decidedApprovalId: string; expiredApprovalId: string };
}
type StreamEvent = { seq: number; type: string };

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const streamFixture: Record<string, string> = { TopicEvent: 'TopicEvents', SessionEvent: 'SessionEvents', AccountEvent: 'AccountEvents' };
const schemaName = (schema: object) => Object.entries(S).find(([, value]) => value === schema)?.[0];
const refuse = (reply: FastifyReply, status: number, code: string) => reply.code(status).send({ code });

export function buildNylraMock(fixtures: NylraFixtures): FastifyInstance {
  const app = Fastify({ logger: false });
  const known = new Set(JSON.stringify(fixtures).match(uuid));
  for (const op of nylraOperations)
    app.route({
      method: op.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
      url: op.path.replace(/\{(\w+)\}/g, ':$1'),
      handler: (request, reply) => answer(op, fixtures, known, request, reply),
    });
  return app;
}

function answer(op: NylraOperation, fixtures: NylraFixtures, known: Set<string>, request: FastifyRequest, reply: FastifyReply) {
  if (!/^Bearer \S+$/.test(request.headers.authorization ?? '')) return refuse(reply, 401, 'unauthorized');
  for (const [schema, value] of [[op.params, request.params], [op.query, request.query], [op.body, request.body]] as const)
    if (schema && !Value.Check(schema, Value.Convert(schema, value ?? {}))) return refuse(reply, 400, 'request_invalid');
  const params = (request.params ?? {}) as Record<string, string>;
  if (Object.values(params).some(id => !known.has(id))) return refuse(reply, 404, 'not_found');
  if (params.approvalId === fixtures.mock.decidedApprovalId) return refuse(reply, 409, 'approval_already_decided');
  if (params.approvalId === fixtures.mock.expiredApprovalId) return refuse(reply, 409, 'approval_expired');
  if (op.okType === 'text/event-stream') {
    const events = fixtures.valid[streamFixture[schemaName(op.ok)!]!] as StreamEvent[];
    return replay(reply, events, (request.query as { after?: string }).after);
  }
  return reply.send(fixtures.responses[`${op.method.toUpperCase()} ${op.path}`] ?? fixtures.valid[schemaName(op.ok)!] ?? {});
}

// Replays the events after the cursor, then ends the response; a real server keeps
// it open. A cursor before the first retained event or after the last is unknown.
function replay(reply: FastifyReply, events: StreamEvent[], after: string | undefined) {
  if (after !== undefined) {
    const position = Number(after);
    if (position < events[0]!.seq - 1 || position > events.at(-1)!.seq) return refuse(reply, 410, 'resnapshot_required');
    events = events.filter(event => event.seq > position);
  }
  const body = events.map(event => `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
  return reply.header('content-type', 'text/event-stream; charset=utf-8').header('cache-control', 'no-store').send(body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixtures = JSON.parse(await readFile('api/nylra-v1.fixtures.json', 'utf8')) as NylraFixtures;
  const host = process.env.NYLRA_MOCK_HOST ?? '127.0.0.1';
  const port = Number(process.env.NYLRA_MOCK_PORT ?? 4410);
  await buildNylraMock(fixtures).listen({ host, port });
  console.log(`nylra-v1 mock on http://${host}:${port}`);
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
node --import tsx --test tests/integration/nylra-mock.test.ts
npm run typecheck
```

Expected: 4 tests PASS; typecheck passes.

- [ ] **Step 5: Try the mock by hand**

```bash
npm run mock:nylra
```

In a second terminal:

```bash
curl -s -H "Authorization: Bearer synthetic" http://127.0.0.1:4410/v1/nylra/approvals
curl -s -N -H "Authorization: Bearer synthetic" "http://127.0.0.1:4410/v1/nylra/topics/00000000-0000-4000-8000-000000000030/events?after=4"
```

Expected: the first prints the pending `npm test` approval; the second prints events `id: 5` to `id: 8`. Stop the mock.

- [ ] **Step 6: Write the handoff for the Flutter app**

`docs/nylra-v1-handoff.md`:

```markdown
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
- **Approvals:** deciding answers the updated approval. 409
  `approval_already_decided` (AYLUL decided under a grant, or another device
  did) and `approval_expired` are normal outcomes to show, not errors.
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
```

- [ ] **Step 7: Run the documentation check and commit**

```bash
npm run check:docs
git add scripts/mock-nylra.ts tests/integration/nylra-mock.test.ts docs/nylra-v1-handoff.md
git commit -m "feat(api): nylra-v1 mock server and the Flutter handoff"
```

### Task 8 (controller): gate, tags, push, branch cleanup

Not for the executor. The controller runs it after reviewing Tasks 1 to 7, with Mohammed's approval for each push and deletion.

- [ ] **Step 1: shadows gate** (spec-only change plus one evidence file): `cargo fmt --all --check` and the 100-column check on changed Markdown; the Rust gate is unaffected.
- [ ] **Step 2: shadows-backend gate:** `npm run typecheck`, `npm run schema:check`, `npm run check:contracts`, `npm run check:docs`, `npm test`.
- [ ] **Step 3: nylra gate:** `npm run build` in `apps/desktop`; `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` in `apps/desktop/src-tauri`.
- [ ] **Step 4: Tag the probe branch heads, then push the tags**

```bash
git -C E:/Globalprojects/shadows tag probe/2026-10-12-linux-integration 60b9edc
git -C E:/Globalprojects/nylra tag probe/2026-10-12-linux-integration f9789af
git -C E:/Globalprojects/shadows-backend tag probe/2026-10-12-linux-integration 7fc59a7
```

Push each tag with `git -c http.version=HTTP/1.1 push origin probe/2026-10-12-linux-integration`.

- [ ] **Step 5: Push `spec/aylul-companion` in each repository and open one PR per repository.**
- [ ] **Step 6: After the PRs merge, delete the remote branches `codex/linux-integration-probe` and `ccr-189943e1-8l71wu` in all three repositories, and `spec/aylul-companion`.**
