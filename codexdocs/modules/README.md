# Applied module library

These ten modules add sixty exercises to the forty-ticket RelayDesk backlog,
forming a one-hundred-exercise deep project spine. The optimized 01–29
companion adds 87 core exercises and 870 mastery exercises, for 1,057 total
across the full course.

The modules deepen concepts; the backlog integrates them. Do not finish all
six module exercises before touching the project. Use this rhythm:

1. Read the mental model and failure patterns.
2. Complete exercises 1 and 2.
3. Apply the concept to the linked RelayDesk increment.
4. Return for exercises 3–6 when the project exposes the corresponding risk.

## Modules

| Module | Exercises | Project pairing |
| --- | ---: | --- |
| [01 — JavaScript runtime and contracts](01-JS-RUNTIME-AND-CONTRACTS.md) | 6 | Foundations, increments 1–2 |
| [02 — TypeScript domain modeling](02-TYPESCRIPT-DOMAIN-MODELING.md) | 6 | Increments 1–3 |
| [03 — Node and async boundaries](03-NODE-ASYNC-BOUNDARIES.md) | 6 | Increments 2, 6, 8 |
| [04 — HTTP API design](04-HTTP-API-DESIGN.md) | 6 | Increments 2–3 |
| [05 — SQL and data integrity](05-SQL-AND-DATA-INTEGRITY.md) | 6 | Increments 4, 10–11 |
| [06 — React state and accessibility](06-REACT-STATE-AND-ACCESSIBILITY.md) | 6 | Increments 5–6 |
| [07 — Full-stack concurrency](07-FULL-STACK-CONCURRENCY.md) | 6 | Increments 6 and 8 |
| [08 — Security and authorization](08-SECURITY-AND-AUTHORIZATION.md) | 6 | Increment 7 |
| [09 — Testing and refactoring](09-TESTING-AND-REFACTORING.md) | 6 | Increment 9 |
| [10 — Operations and delivery](10-OPERATIONS-AND-DELIVERY.md) | 6 | Increments 10–12 |

## Exercise format

Each exercise supplies:

- **Task:** what to build, predict, debug, or decide.
- **Constraints:** what makes the exercise teach the intended mechanism.
- **Proof:** observable evidence required for completion.
- **Debrief:** questions you must answer after the code works.
- **AI level:** the maximum assistance level recommended on the first attempt.

An exercise is incomplete if the code works but the proof or debrief is
missing.

## Scratch-work convention

Place non-project solutions under a separate directory in your RelayDesk
workspace:

```text
practice/
  01-runtime/
  02-types/
  ...
```

Give each exercise its own test file. Keep practice code out of production
bundles. Commit only the exercises that demonstrate meaningful growth; the
course values evidence, not a folder full of copied answers.

## Difficulty

- **Core:** expected for independent product work.
- **Applied:** combines multiple mechanisms or boundaries.
- **Review:** starts with plausible code or a design that must be challenged.

The sequence within each module moves from core mental model to integrated
judgment. If exercise 1 is difficult, use the linked existing modules before
continuing. If exercise 6 is easy and your explanation is precise, return to
the project rather than inventing more drills.
