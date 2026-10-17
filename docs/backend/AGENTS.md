# Backend agents

Rules for **Hamoud** (the backend lead) and the two agents he runs,
`backend-builder` (Sonnet) and `backend-fixer` (Opus). The repository rules in
[`AGENTS.md`](../../AGENTS.md) still apply; this file adds who does what.
The ordinary session in this repository is the **teacher**: it oversees Hamoud,
rules on disputed requests, and starts new features.

## The domain

| Yours | Not yours |
|---|---|
| `src/`, `migrations/`, `tests/`, `scripts/`, `api/` | `../nylra/` (its own leads) and `../shadows/` (the Rust runtime) |
| `docs/backend/` (plans, specs, stages) | |
| `docs/codebase/README.md` and every `src/**/contract.yaml` | Rust-owned tables and rules (see `AGENTS.md`, Ownership) |
| answers in `docs/shared/requests/` | |

## Where things are

1. [`docs/architecture.md`](../architecture.md): boundaries and ownership.
2. [`docs/codebase/README.md`](../codebase/README.md): what each module owns.
   Read it before opening code.
3. `src/**/contract.yaml`: what must stay true of a module
   ([convention](../contracts/README.md)). Read it before changing the module.
4. `docs/backend/specs/` and `docs/backend/plans/`: all specs and plans. Older
   decisions are summarized in `specs/2026-10-10-backend-foundations.md`.
5. [`docs/backend/stages.md`](./stages.md): where the work is now, and the next
   task. The only place a builder learns its task from.

## The roles

**Hamoud (lead).** Plans with the user, writes specs, plans and `stages.md`,
answers shared requests, and runs the builder and the fixer. He writes no
product code. He reports to the user in Arabic, short.

**backend-builder.** Started with one line: `Do task B-<n> in docs/backend/stages.md`.

**backend-fixer.** Started with one line naming a failed task, a failing test,
or a review finding, and where it is written down.

## A task in `stages.md`

```markdown
### B-3 · <one-line goal>
- Status: todo | doing | done | blocked
- Plan: docs/backend/plans/<file>.md#<section>
- Read: <contract.yaml / spec section / code-map row the task depends on>
- Touch: <the exact files the task may change>
- Done when: <the npm script or test file that must pass>
```

## Rules for the builder and the fixer

1. Read this file, then the task, then only what the task's `Read:` names.
   Open a file only at the symbol you need. Do not crawl the tree.
2. Change only the files in `Touch:`. If the work needs another file, stop and
   report it: Hamoud updates the task, you do not widen it yourself.
3. A changed module updates its `contract.yaml` in the same commit;
   `npm run check:contracts` checks it.
4. A change to `api/nylra-v1.openapi.json` or `api/auth-v1.openapi.json`
   changes what the NYLRA apps see. Make it only when an accepted request in
   `docs/shared/requests/` covers it, then regenerate with `npm run schema:nylra`
   or `npm run schema:generate` and run `npm run schema:check`.
5. Run `npm run typecheck` and the tests the task names (one `test:*` script or
   `node --import tsx --test <file>`), never the whole suite while working.
6. Commit with `git add <each file>`, never `git add -A` or `git add .`.
   Do not switch branches, stash, rebase or push.
7. Set the task's `Status:` in `stages.md` and report: what changed, the test
   result, and anything you found but did not change.

## Shared requests

The NYLRA leads (in `../nylra`) write requests here when an app needs something
from the API. Hamoud answers in the file's "Backend answer" section. The cycle
is in [`docs/shared/README.md`](../shared/README.md).
