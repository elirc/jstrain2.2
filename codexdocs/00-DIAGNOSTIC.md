# Diagnostic — establish the real baseline

Timebox: four hours. Do this cold, before reading solution files. The purpose
is routing, not judgment.

## Rules

- Use documentation for syntax lookup, but no solution files.
- AI may clarify a prompt, but may not propose code during the diagnostic.
- Stop each exercise after 25 minutes and record where you became stuck.
- After the timebox, explain every attempted solution aloud.
- Do not repair the score. A truthful baseline saves weeks.

## Part 1 — JavaScript behavior

Run these from the repository root:

```bash
node bootcamp/01-language-core/exercises/07-defaults.js
node bootcamp/01-language-core/exercises/22-value-vs-reference.js
node bootcamp/02-functions-and-closures/exercises/10-once.js
node bootcamp/02-functions-and-closures/exercises/19-debounce.js
node bootcamp/03-arrays-and-objects/exercises/10-reduce-to-summary.js
node bootcamp/06-errors-and-robustness/exercises/08-parse-dont-validate.js
node bootcamp/07-async-mastery/exercises/20-parallel-vs-sequential.js
node bootcamp/07-async-mastery/exercises/23-map-limit.js
```

## Part 2 — TypeScript judgment

```bash
node tsbootcamp/run.js tsbootcamp/01-types-and-annotations/exercises/13-unknown-vs-any.ts
node tsbootcamp/run.js tsbootcamp/02-narrowing/exercises/12-narrowing-unknown.ts
node tsbootcamp/run.js tsbootcamp/03-generics/exercises/08-box-and-result.ts
node tsbootcamp/run.js tsbootcamp/06-typing-real-code/exercises/07-typed-api-client.ts
```

If a cold compiler run is slow, use `--tests` while iterating and run the full
typecheck once before scoring.

## Part 3 — debugging

Choose one without reading its solution:

```bash
node bootcamp/24-debug-hunts/exercises/16-boss-code-review.js
node bootcamp/24-debug-hunts/exercises/24-lost-update-race.js
```

Before editing, write down:

1. the contract the code claims to satisfy;
2. the first failing observation;
3. three candidate bug classes;
4. the smallest experiment that separates them.

## Part 4 — engineering conversation

Record yourself answering these in five minutes total:

1. When should three independent requests run concurrently rather than
   sequentially?
2. Why is `unknown` safer than `any` at an HTTP boundary?
3. What is the difference between authentication and authorization?
4. Which tests would you write for a ticket-assignment endpoint?
5. How would you investigate an endpoint that became ten times slower?

## Scoring

Score every coding exercise from 0–3:

- **0:** could not form a useful approach.
- **1:** formed an approach but needed implementation-level help.
- **2:** reached correct behavior and can explain it.
- **3:** reached correct behavior, explained risks, and added a useful edge
  case or improved diagnostic.

Also record the time and confidence before running tests. Confidence that does
not match correctness is a learning signal.

## Routing

- Average below 1.0: take the two-week foundations sprint.
- Average 1.0–1.9: take one week and complete every required item.
- Average 2.0–2.5: take three days and only repair categories below 2.
- Average above 2.5: begin RelayDesk and use drills only when a project gap
  appears.

Create `diagnostic-report.md` using this structure:

```markdown
# Diagnostic report

Date:
Total time:

| Exercise/category | Score | Time | Failure or insight |
| --- | ---: | ---: | --- |

Strongest evidence:
Most dangerous gap:
First remediation set:
What I incorrectly felt confident about:
```

