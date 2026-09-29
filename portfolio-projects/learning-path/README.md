# Intern to mid-level engineer learning path

This curriculum uses the three applications in the parent directory as a working textbook. It teaches the difference between “I can make the happy path work” and “I can own a change across UI, API, domain rules, SQL, failure handling, tests, and operations.”

## What “mid-level” means here

A mid-level engineer can take a bounded product outcome and:

1. Find the correct ownership boundary before editing.
2. State invariants and hostile cases in plain language.
3. Validate runtime input instead of trusting TypeScript.
4. Enforce authorization against the target resource.
5. make multi-write behavior atomic and retry-safe.
6. Build usable loading, empty, error, permission, and conflict states.
7. Select tests that prove the risky behavior at the right boundary.
8. Operate the result: configuration, logs, health, shutdown, migration, rollback, and recovery.
9. Explain tradeoffs and limitations without exaggerating.

## Recommended ten-week route

| Week | Read | Practice | Exit evidence |
| ---: | --- | --- | --- |
| 1 | [How to learn](./00-HOW-TO-LEARN.md), [architecture tour](./01-ARCHITECTURE-TOUR.md) | Trace one request through every layer | Hand-drawn or Mermaid sequence plus teach-back |
| 2 | [TypeScript and validation](./02-TYPESCRIPT-AND-VALIDATION.md) | Add one rejected boundary case | Parser test fails before implementation and passes after |
| 3 | [HTTP, identity, authorization](./03-HTTP-AUTHORIZATION.md) | Add a negative permission test | Same denial for missing and forbidden private resource |
| 4 | [SQL and transactions](./04-SQL-TRANSACTIONS.md) | Inject a failure between two writes | Database remains unchanged after rollback |
| 5 | [Concurrency and idempotency](./05-CONCURRENCY.md) | Run and mutate a race test | Explain why the test is deterministic |
| 6 | [React product engineering](./06-REACT-PRODUCT-ENGINEERING.md) | Build a visible conflict/retry state | Accessible component test |
| 7 | [Workers and operations](./07-WORKERS-AND-OPERATIONS.md) | Force retry and dead-letter recovery | Logs and database evidence |
| 8 | [Inventory tour](./projects/01-INVENTORY-CODE-TOUR.md) | Lab 1 or 2 | Small vertical change and review note |
| 9 | [Project-management tour](./projects/02-PROJECT-MANAGEMENT-CODE-TOUR.md) | Lab 3 or 4 | Tenant-safe feature or ordering repair |
| 10 | [Scheduling tour](./projects/03-SCHEDULING-CODE-TOUR.md) | Lab 5 or 6, then assessment | Technical defense scoring at least “independent” |

## Learning styles

Every topic is deliberately presented several ways:

- **Visual:** Mermaid boundary, sequence, state, and data-flow diagrams.
- **Conceptual:** analogies and short mental models.
- **Concrete:** tours of real functions, SQL, and tests.
- **Hands-on:** labs with acceptance criteria and verification commands.
- **Socratic:** questions that require evidence before an answer.
- **Debugging-first:** seeded investigations and failure symptoms.
- **Teach-back:** prompts for explaining the system without notes.

Do not read the whole track passively. For each lesson, predict behavior, run an experiment, inspect evidence, and explain the result.

## Project entry points

| Concern | Inventory | Project management | Scheduling |
| --- | --- | --- | --- |
| Runtime contracts | [`packages/contracts`](../01-inventory-orders/packages/contracts/src/index.ts) | [`packages/contracts`](../02-project-management/packages/contracts/src/index.ts) | [`packages/contracts`](../03-appointment-scheduling/packages/contracts/src/index.ts) |
| Pure rules | [`packages/domain`](../01-inventory-orders/packages/domain/src/index.ts) | [`packages/domain`](../02-project-management/packages/domain/src/index.ts) | [`packages/domain`](../03-appointment-scheduling/packages/domain/src/index.ts) |
| HTTP boundary | [`app.ts`](../01-inventory-orders/apps/api/src/app.ts) | [`app.ts`](../02-project-management/apps/api/src/app.ts) | [`app.ts`](../03-appointment-scheduling/apps/api/src/app.ts) |
| Data operations | [`inventory.ts`](../01-inventory-orders/apps/api/src/inventory.ts) | [`repository.ts`](../02-project-management/apps/api/src/repository.ts) | [`scheduling.ts`](../03-appointment-scheduling/apps/api/src/scheduling.ts) |
| React | [`App.tsx`](../01-inventory-orders/apps/web/src/App.tsx) | [`App.tsx`](../02-project-management/apps/web/src/App.tsx) | [`main.tsx`](../03-appointment-scheduling/apps/web/src/main.tsx) |
| Worker | [`index.ts`](../01-inventory-orders/apps/worker/src/index.ts) | [`worker.ts`](../02-project-management/apps/worker/src/worker.ts) | [`jobs.ts`](../03-appointment-scheduling/apps/worker/src/jobs.ts) |

## Ground rules for interns

- Never change a state field directly when the system exposes a named command.
- Never add an organization ID to a request and call that authorization.
- Never use a unit fake to claim SQL rollback or locking works.
- Never “fix” a concurrency test by adding a sleep.
- Never hide a limitation in order to make a progress table greener.
- Before coding, complete: “If this implementation is wrong, the worst plausible result is ___, and the test that catches it is ___.”

Finish with the [labs](./labs/README.md), [assessment](./assessments/MID-LEVEL-ASSESSMENT.md), [mentor guide](./MENTOR-GUIDE.md), and [glossary](./GLOSSARY.md).
