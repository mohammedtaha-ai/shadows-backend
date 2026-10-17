# Shadows Backend - Agent Instructions

Read [README.md](README.md) and [docs/architecture.md](docs/architecture.md)
before proposing code. The architecture records the agreements to date;
unresolved prerequisites are not permission to invent decisions silently.
Read [source structure](docs/source-structure.md) for the prepared layout and
[contract convention](docs/contracts/README.md) before adding source. Proposed
paths are not existing modules or permission to scaffold unused packages.

## Ownership

- This repository owns the shared TypeScript/Node.js cloud application.
- NYLRA client experience is owned by `../nylra/Vision.md`.
- Local project rules remain owned by Shadows. An adapter cannot bypass them.
- Team rules also execute in the Rust Shadows runtime. Do not duplicate them in
  TypeScript or access Rust-owned tables. Follow Shadows §1.7 for synchronization
  and §24.6 for external confirmation and assessment.
- Keep one owner for every rule, table, protocol shape, and decision.
- A source module has one named job. Split by responsibility; do not create
  miscellaneous `helpers` or `utils` piles.
- Interfaces translate. Application services enforce domain rules.
- A service owns its persistence. Other services use its declared operations,
  including explicitly declared transactional operations where necessary.

## Contracts and evidence

- Use [the source contract template](docs/contracts/TEMPLATE.yaml) for source
  modules. Describe inspected implementation, not hoped-for behavior.
- Keep a changed module's contract current in the same change.
- Name stable symbols in gaps. Reference externally owned types.
- Obligations identify inspected tests, or explicitly state missing coverage.
- Maintain a hand-written code map when product source exists; do not list
  imaginary modules or copy signatures into that map.
- Owner specifications describe intended behavior. Source contracts describe
  implemented behavior. Verification records describe observed behavior.
- Amend decisions in their owner file. OPEN items name their closing trigger.
- Preserve the full product direction. Delivery slices do not authorize a
  planned rewrite, a second implementation of a rule, or a reduced end goal.

## Work

Explain the scope before editing. Run checks appropriate to the actual
change and report what was run. Validate YAML contracts with a parser.
Distinguish local checks, remote CI, and real-device acceptance.
Do not infer permission to commit, push, deploy, or change another repository
from a request to write local documentation.

## The backend lead

Hamoud (`.claude/agents/hamoud.md`) leads backend work through a Sonnet builder
and an Opus fixer: [docs/backend/AGENTS.md](docs/backend/AGENTS.md). NYLRA's
leads ask for API changes in [docs/shared/](docs/shared/README.md) before code.
Specs and plans go to `docs/backend/{specs,plans}/`. Earlier decisions are
summarized in `docs/backend/specs/2026-10-10-backend-foundations.md`.
