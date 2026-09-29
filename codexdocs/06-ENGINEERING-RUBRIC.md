# Engineering capability rubric

Score evidence from 0–3. A score is not based on confidence, reading, or
exercise completion.

- **0 — absent:** cannot perform the skill yet.
- **1 — guided:** succeeds with implementation-level direction.
- **2 — independent:** succeeds on a clear task and explains the result.
- **3 — owning:** handles ambiguity, tradeoffs, failure modes, and review.

## 1. Requirements and decomposition

- 1: implements explicit steps.
- 2: turns acceptance criteria into small vertical tasks and identifies gaps.
- 3: asks high-value questions, controls scope, sequences risk, and records
  decisions.

Required evidence: RD-1001 plan and at least two small reviewable PRs.

## 2. JavaScript and TypeScript judgment

- 1: types ordinary functions but relies on casts and trial-and-error.
- 2: models domains clearly, narrows `unknown`, and explains runtime behavior.
- 3: designs maintainable contracts, recognizes type lies, and rejects clever
  types that cost more than they protect.

Required evidence: ticket lifecycle model, boundary parser, and one TypeScript
debug hunt.

## 3. Node and asynchronous systems

- 1: writes async handlers on the happy path.
- 2: handles propagation, cancellation, cleanup, concurrency, and shutdown.
- 3: selects retry/idempotency/concurrency policy from product semantics and
  diagnoses race behavior deterministically.

Required evidence: RD-603 and RD-801–803.

## 4. HTTP and API design

- 1: creates CRUD routes.
- 2: uses stable contracts, validation, status codes, pagination, and error
  handling.
- 3: evolves APIs deliberately, handles conflicts, and considers clients,
  limits, compatibility, and operations.

Required evidence: RD-201–303 plus an API change review.

## 5. Data and SQL

- 1: performs basic reads and writes.
- 2: writes parameterized queries, migrations, constraints, joins, and
  transactions.
- 3: reasons about concurrency, query plans, rollout, rollback, and data
  integrity under failure.

Required evidence: RD-401–403, RD-1001, and RD-1102.

## 6. React product engineering

- 1: renders components and manages local state.
- 2: builds accessible async flows with clear state ownership and behavior
  tests.
- 3: handles races, conflicts, composition, performance evidence, and API
  evolution without fragile coupling.

Required evidence: RD-501–604.

## 7. Testing

- 1: adds happy-path examples after implementation.
- 2: chooses useful boundaries and proves negative/error behavior.
- 3: designs deterministic concurrency/failure tests, removes misleading
  tests, and uses failures as diagnostics.

Required evidence: test-risk matrix, RD-901–903, and one caught regression.

## 8. Security and privacy

- 1: knows common vulnerability names.
- 2: implements boundary validation, authorization, safe SQL/output, secret
  handling, and negative tests.
- 3: threat-models features, catches composition flaws, prioritizes risk, and
  documents residual exposure.

Required evidence: RD-701–704 and an authorization matrix.

## 9. Operations and reliability

- 1: can run the app locally.
- 2: deploys it with validated configuration, health checks, logs, timeouts,
  and a runbook.
- 3: investigates incidents from evidence, mitigates safely, measures fixes,
  and improves prevention/detection.

Required evidence: RD-1101–1103 and RD-1201.

## 10. Git, review, and communication

- 1: commits working code.
- 2: creates scoped diffs, useful commit/PR descriptions, and responds to
  review with evidence.
- 3: reviews others' or AI code for correctness, communicates tradeoffs, and
  leaves the system easier for the next engineer.

Required evidence: three PR templates, one rejected review suggestion, one
ADR, one incident report, and the final demo.

## Graduation rule

Graduate when all are true:

- Every category is at least 2.
- At least six categories are 3.
- No category score depends only on drills.
- One feature and one debugging task were completed at AI Level 0.
- Another person can clone, run, test, and understand the project.

If a category is below 2, create one project ticket that produces the missing
evidence. Do not prescribe an entire module unless the weakness is broad.

## Weekly scorecard

```markdown
| Category | Previous | Current | New evidence | Next gap |
| --- | ---: | ---: | --- | --- |
| Requirements | | | | |
| JS/TS | | | | |
| Node/async | | | | |
| HTTP/API | | | | |
| Data/SQL | | | | |
| React | | | | |
| Testing | | | | |
| Security | | | | |
| Operations | | | | |
| Git/review/communication | | | | |
```

