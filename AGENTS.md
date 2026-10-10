# Shadows Backend - Agent Instructions

Read [README.md](README.md) and [docs/architecture.md](docs/architecture.md)
before proposing code. The architecture records the agreements to date;
unresolved prerequisites are not permission to invent decisions silently.

## Ownership

- This repository owns the shared TypeScript/Node.js cloud application.
- NYLRA client experience is owned by `../nylra/Vision.md`.
- Local project rules remain owned by Shadows. An adapter cannot bypass them.
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
