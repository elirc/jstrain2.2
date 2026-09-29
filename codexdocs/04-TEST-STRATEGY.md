# RelayDesk test strategy

Tests are evidence about risk. More tests are not automatically more evidence.

## Boundaries

### Domain unit tests

Use for deterministic rules: status transitions, permissions, pagination
cursor encoding, SLA calculation, and retry decisions. No network, database,
real clock, or rendering.

### Service tests

Use controlled fakes to prove orchestration: repository calls, transaction
intent, activity creation, webhook scheduling, and error translation. Avoid
asserting every private call.

### Repository integration tests

Use a real database for SQL, constraints, transactions, migrations, ordering,
locking, and query shape. An in-memory array cannot prove these properties.

### HTTP integration tests

Exercise routing, parsing, authentication, authorization, status codes,
headers, serialization, and central error handling through a real server or
faithful application boundary.

### React component tests

Test what users perceive and do: roles, labels, text, focus, keyboard actions,
loading, errors, and retries. Do not assert hook internals or CSS class lists
unless they are the product contract.

### End-to-end tests

Keep a small suite for wiring confidence: sign-in, create ticket, assign,
comment, resolve. E2E tests are expensive diagnostics; they are not the place
for every validation permutation.

## Required risk matrix

| Risk | Primary evidence |
| --- | --- |
| Invalid untrusted input | Parser/unit plus HTTP integration tests |
| Wrong status transition | Exhaustive domain table |
| SQL injection | Parameterized repository integration test/review |
| Lost update | Concurrent repository/HTTP integration test |
| IDOR or role bypass | Authorization matrix through HTTP |
| Transaction half-write | Forced-failure DB integration test |
| Stale React response | Deterministic out-of-order component test |
| Duplicate mutation/delivery | Concurrent idempotency integration test |
| Migration failure | Blank, upgrade, repeat, and rollback scenarios |
| Broken user journey | One focused browser E2E flow |

## Test construction rule

Before writing a test, complete this sentence:

> If the implementation accidentally __________, this test fails with a
> message that points me toward __________.

If the blanks are vague, the test is probably vague.

## Red-green-review cycle

1. State the contract in plain language.
2. Write the smallest failing example for the important behavior.
3. Confirm it fails for the intended reason.
4. Implement the behavior.
5. Add a boundary or counterexample the first test missed.
6. Refactor while green.
7. Mutate the code mentally or temporarily: would the test catch the likely
   bug?

## AI rule for tests

You write the first critical test. AI may then propose missing cases. For each
proposal, name the distinct risk it covers; discard duplicates. Never accept
code and all its tests from the same AI response without an independent
oracle, because shared blind spots can produce a perfectly green false
contract.

## Fixtures and time

- Prefer builders that expose relevant differences and provide safe defaults.
- Make IDs and timestamps deterministic.
- Inject clocks, randomness, schedulers, and outbound transports.
- Do not wait real seconds in tests.
- Give concurrent tests a deterministic release mechanism rather than timing
  luck.
- Keep development seed data separate from test fixtures.

## Coverage policy

Line coverage is a smoke detector, not a goal. Track it to reveal untouched
areas, but review branch behavior and risk directly. A project with 80%
meaningful coverage is stronger than one with 100% assertions that only repeat
the implementation.

## Pull-request quality gate

The full PR check should run:

```text
format check -> lint -> typecheck -> unit/component tests
             -> integration tests -> build -> selected E2E tests
```

Fast local commands should target a package or test file. CI should run the
complete clean-install pipeline. A failing or hanging check must return a
non-zero exit code and retain diagnostics.

## Test review checklist

- Does the test prove a requirement or merely mirror the implementation?
- Is it at the cheapest boundary that can prove the risk?
- Did we see it fail correctly before implementation?
- Are negative permissions and error paths included?
- Are time, randomness, network, and concurrency controlled?
- Can tests run independently and in any order?
- Would the failure tell the next engineer what behavior broke?
- Is a snapshot hiding the assertion that matters?

