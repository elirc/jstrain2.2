# Expanded exercise index

The deep project spine contains 100 substantial exercises:

- 40 project tickets in `03-BACKLOG.md`;
- 60 concept-to-application exercises in `modules/`.

The optimized 01–29 companion adds 87 core exercises—three per topic—and 870
mastery exercises—thirty per topic. That produces 1,057 exercises/tickets
across the full course. Use the [topic index](optimized-01-29/README.md) for
the concise lessons and the [mastery index](optimized-01-29/mastery/README.md)
for the six-rung banks.

Exercises are complete only when their proof and debrief are complete. The
large count is a practice library, not a command to grind everything: diagnose,
select weak rungs, apply the skill to RelayDesk, and use spaced retrieval to
verify retention.

The [whole-course spaced library](spaced-repetition-all/README.md) adds 9,700
scheduled retrieval actions across ten stages for every course file. These are
repetitions and transfer checks, not 9,700 new concepts, so they are not added
to the unique exercise count above.

## Module exercises

| ID | Exercise | Kind | Primary proof |
| --- | --- | --- | --- |
| M01-E01 | Ownership map | Core | Identity/value test table |
| M01-E02 | Parse a page request | Core | Twelve-case boundary table |
| M01-E03 | Immutable ticket update | Applied | Value and identity assertions |
| M01-E04 | Callback lifetime bug | Review | Deterministic stale-value test |
| M01-E05 | Preserve failure context | Applied | Error/result/log tests |
| M01-E06 | Contract review | Review | Before/after contract and diff |
| M02-E01 | Illegal states inventory | Core | Compile/runtime counterexamples |
| M02-E02 | Parse unknown without casts | Core | Type and runtime boundary tests |
| M02-E03 | Type a PATCH command | Applied | DTO/domain mapper examples |
| M02-E04 | Exhaustive event handler | Core | Exhaustive typecheck and fixtures |
| M02-E05 | Audit a type lie | Review | Compiling defect exposed by test |
| M02-E06 | Generic API review | Review | Two prototypes and ADR |
| M03-E01 | Event-loop trace | Core | Prediction and observed ordering |
| M03-E02 | Result-preserving concurrency | Core | Controlled concurrency test |
| M03-E03 | Abortable request chain | Applied | Cancellation timing tests |
| M03-E04 | Timeout leak hunt | Review | Resource-leak evidence |
| M03-E05 | Retry policy table | Applied | Failure-class policy tests |
| M03-E06 | Graceful shutdown | Applied | Drain/deadline tests |
| M04-E01 | Pipeline ordering | Core | Diagram and four traces |
| M04-E02 | Error mapping table | Core | Mappings and HTTP tests |
| M04-E03 | Bounded JSON reader | Applied | Real-server boundary tests |
| M04-E04 | Keyset paginator | Applied | Page/property/integration tests |
| M04-E05 | PATCH semantics review | Review | Bug-class regression tests |
| M04-E06 | API evolution | Review | Compatibility and rollout plan |
| M05-E01 | Invariant-to-constraint map | Core | Enforcement/failure table |
| M05-E02 | Transaction under forced failure | Core | Real-database rollback test |
| M05-E03 | Concurrent uniqueness | Applied | Repeatable concurrency test |
| M05-E04 | Migration evolution | Applied | Blank/upgrade/restart scenarios |
| M05-E05 | Join correctness hunt | Review | Failing/corrected report queries |
| M05-E06 | Measured index decision | Review | Plans and before/after timing |
| M06-E01 | State inventory | Core | Ownership table and flow sketch |
| M06-E02 | Accessible async form | Core | Behavior tests and keyboard check |
| M06-E03 | Derived queue | Core | Pure and navigation tests |
| M06-E04 | Out-of-order response race | Applied | Deferred-promise test |
| M06-E05 | Identity and keys hunt | Review | Reorder interaction regression |
| M06-E06 | Optimistic conflict UX | Applied | Success/failure/conflict tests |
| M07-E01 | Draw the interleaving | Core | Four cross-layer timelines |
| M07-E02 | Deterministic lost update | Core | Forced race and atomic fix |
| M07-E03 | Conflict contract | Applied | API and component evidence |
| M07-E04 | Durable idempotency machine | Applied | State diagram and concurrent test |
| M07-E05 | Outbox boundary | Applied | Forced-crash scenarios |
| M07-E06 | Race-focused review | Review | End-to-end sequence diagram |
| M08-E01 | Threat-model one flow | Core | Ranked data-flow threat model |
| M08-E02 | Authorization matrix | Core | Matrix-driven negative tests |
| M08-E03 | IDOR hunt | Applied | Exploit and correction test |
| M08-E04 | Mass assignment/output leak | Applied | Forbidden-field HTTP tests |
| M08-E05 | Session and CSRF design | Review | Sequence, ADR, security tests |
| M08-E06 | Dependency and log review | Review | Audit and redaction evidence |
| M09-E01 | Risk-to-boundary map | Core | Test portfolio table |
| M09-E02 | Red for the right reason | Core | Captured failure and mutation |
| M09-E03 | Deterministic race test | Applied | Repeatability and duration |
| M09-E04 | Cross-implementation contract | Applied | Shared repository suite |
| M09-E05 | Characterize and refactor | Applied | Three green commits |
| M09-E06 | Test the author missed | Review | Independent counterexample |
| M10-E01 | Configuration parser | Core | Startup/table tests |
| M10-E02 | Structured logging contract | Core | Captured/redacted log assertions |
| M10-E03 | Health and shutdown drill | Applied | Operational coordination test |
| M10-E04 | Compatible release plan | Applied | Runbook and compatibility matrix |
| M10-E05 | Performance investigation | Review | Hypothesis log and measurements |
| M10-E06 | Incident and postmortem | Review | Report and regression guard |

## Recommended sequence

- Weeks 0–1: M01-E01–E03, M02-E01–E03.
- Week 2: M03-E01–E03, M04-E01–E03.
- Weeks 3–4: M04-E04–E06, M05-E01–E04.
- Week 5: M06-E01–E03.
- Week 6: M06-E04–E06, M07-E01–E03.
- Week 7: M08-E01–E05.
- Week 8: M03-E04–E06, M07-E04–E05.
- Week 9: M09-E01–E05.
- Week 10: remaining review exercises.
- Weeks 11–12: M05-E05–E06, M10-E01–E06.

This sequence deliberately leaves some review exercises until the application
is large enough to supply real evidence.
