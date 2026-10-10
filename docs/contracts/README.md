# Source contract convention

Date: 2026-10-10. Shared by `shadows-backend` and `nylra`.
This file owns how those repositories apply [TEMPLATE.yaml](TEMPLATE.yaml).
The supplied `GENERIC_SOURCE_CONTRACT_TEMPLATE.yaml` was inspected and compared
with that template: their SHA-256 hashes match. Keep this one canonical copy.

## Three artifacts, three purposes

| Artifact | Describes | Created when |
| --- | --- | --- |
| Owner design | Intended behavior and unresolved decisions | Before implementation |
| Wire schema | Public request/event/response shapes | With the protocol owner |
| Source contract | Observed source behavior and its evidence | With inspected source |

The actual code map points to source owners and contracts. It is not a future
folder plan and does not duplicate signatures. Until code exists, the source
structure documents are designs only; no empty code map or pretend contract.

## Placement and granularity

- A cohesive source module uses a colocated `contract.yaml` with `source` naming
  its repository-relative file or directory. An individual complex file can use
  `<stem>.contract.yaml` instead. Prefer one meaningful module over one contract
  for every trivial UI widget.
- A source unit has one contract owner. If a module is split into independently
  owned modules, narrow the parent's scope and give each child its own contract;
  do not repeat the child's behavior in the parent.
- Generated files, third-party code and visual assets have provenance/generation
  metadata rather than hand-maintained source contracts. Wrapper code with real
  behavior gets its own contract.
- Document public operations, durable effects, cancellation/error semantics,
  authority boundaries and invariants that callers must not reproduce. Do not
  transcribe every private helper or duplicate externally owned types.

## Evidence discipline

Read implementation and relevant test bodies. Keep the useful template sections;
delete illustrative records/functions/tests that do not exist. `status: current`
means faithful to inspected code, not complete, safe or feature-ready. Avoid
`ahead` contracts as a planning mechanism; future requirements stay in the design.

`tested_by: none` means a known missing test; `unknown` means evidence was not
inspected or established. A test reference records what its assertions cover; it
does not claim a successful test run. Dated evidence records command/environment,
result and limits separately. For external tests, include repository-relative
file and stable test name in `note` so the reference can be resolved.

`gaps.at` names a real stable symbol. An uninspected external dependency produces
an open question, not a fabricated defect. `agreements.holds: true` needs inspected
evidence; omit an unverified agreement rather than asserting it because the design
wants it. Reference a canonical external type instead of copying its fields.

## Change and validation workflow

1. Read the actual code map, owning design and affected contract.
2. Implement one complete path; inspect the resulting source and relevant tests.
3. Update its contract in the same change. Keep signatures only where they explain
   the boundary; do not create a competing API specification.
4. Parse YAML with an existing parser. Check source paths, stable symbols and test
   references against the code. A parser proves syntax, not truthful behavior.
5. Run the checks relevant to changed behavior and record exactly what ran.

With first implementation, add small architecture checks for contract/source
coverage and resolvable references. Use language-aware tooling where available;
text matching alone cannot prove semantic correctness. Do not build a custom
cross-language documentation engine before ordinary checks demonstrate a need.
