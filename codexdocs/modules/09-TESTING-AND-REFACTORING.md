# Module 09 — Testing and refactoring

Pair with: RelayDesk increment 9 and every pull request.

## Why this matters

A useful test suite makes change cheaper. It detects important regressions,
localizes failures, and permits structural improvement without freezing every
implementation detail.

The central design question is: what risk requires evidence, and what is the
cheapest trustworthy boundary that can supply it?

## Test behavior, not private choreography

A mock-heavy test can prove that an implementation called its collaborators in
the way the test already knew. That may be appropriate for a true outbound
contract, but it often blocks refactoring without protecting user behavior.

Prefer observable outputs, durable state, emitted domain events, or calls at
architectural boundaries. Avoid asserting private helper order unless order is
the requirement.

## Fakes cannot prove every boundary

An array repository is fast for service decisions, but cannot prove SQL
syntax, constraints, transactions, locking, migrations, or query performance.
A mocked fetch cannot prove browser/server serialization or headers. Match
evidence to the failure mechanism.

## Determinism is designed

Control clocks, randomness, generated IDs, network responses, process signals,
and concurrency interleavings. “Increase the timeout” treats nondeterminism as
a speed problem and usually makes feedback slower without making it reliable.

## Refactoring requires a safety boundary

Characterization tests record important existing behavior before structure
changes. They need not bless every quirk. Decide which behavior is contract,
which is accidental, and which is a bug to change explicitly.

Small refactor steps keep causality visible:

```text
green -> mechanical move -> green -> rename -> green
      -> change dependency direction -> green
```

## Common failure patterns

- Tests written only after implementation and never observed red.
- Assertion that repeats implementation calculation.
- Snapshot replacing meaningful assertions.
- Mocking the unit itself through every collaborator.
- Shared mutable fixtures and order dependence.
- Real timers/sleeps for async behavior.
- One E2E test expected to diagnose every layer.
- Refactor mixed with behavior change in one large diff.
- Coverage percentage used as the quality target.

## Exercise 1 — risk-to-boundary map (core)

Choose ten RelayDesk risks and assign unit, service, repository integration,
HTTP integration, component, contract, or E2E evidence.

Constraints:

- Justify why a cheaper boundary is insufficient and a more expensive one is
  unnecessary.
- Include authorization, transaction, migration, stale UI, and user journey.
- Identify duplicate tests that add little distinct confidence.

Proof: test portfolio table and one proposed deletion/addition.

Debrief: which existing test was expensive but weak?

AI level: 1 after your first map.

## Exercise 2 — red for the right reason (core)

Write a test for one missing feature, run it, and inspect the failure before
implementation.

Constraints:

- The failure message names expected behavior.
- It fails because behavior is absent, not setup/import noise.
- Temporarily introduce a different bug and confirm the diagnostic changes.

Proof: captured initial failure, working implementation, and mutation check.

Debrief: what false confidence would you have had if the test started green?

AI level: 0.

## Exercise 3 — deterministic race test (applied)

Replace a timing-based async test with deferred promises or an injected
scheduler.

Constraints:

- No arbitrary sleep.
- Test forces the exact dangerous ordering.
- Failure occurs quickly and consistently over repeated runs.
- Cleanup leaves no open handles.

Proof: before/after duration and repeatability evidence.

Debrief: was the original test flaky, slow, or incapable of proving the race?

AI level: 1.

## Exercise 4 — contract test across implementations (applied)

Define a repository behavior suite that runs against both in-memory and SQL
implementations.

Constraints:

- Shared behaviors include absence, ordering, expected-version conflict, and
  duplicate idempotency key.
- SQL-only tests still cover transactions/constraints.
- The fake must not imitate SQL quirks that are not part of the contract.

Proof: same contract suite passes both; one SQL-specific risk has separate
evidence.

Debrief: how can a contract suite prevent a fake from becoming wishful
thinking?

AI level: 2 after contract cases are written.

## Exercise 5 — characterize and refactor (applied)

Select a function/service over 80 lines or with mixed responsibilities.
Identify stable behavior, add missing characterization tests, and refactor in
at least three green commits.

Constraints:

- Behavior changes require a separate ticket/commit.
- Tests avoid new coupling to extracted private functions.
- Final design has a named ownership improvement.

Proof: commit sequence, before/after dependency sketch, and unchanged external
contract suite.

Debrief: which tests resisted the refactor for a bad reason?

AI level: 2 for review, not implementation on the first pass.

## Exercise 6 — write the test the author missed (review)

Ask AI to generate a plausible implementation and tests for a bounded helper
or endpoint. Do not edit them initially. State the contract independently,
find a shared blind spot, and write the missing failing test.

Constraints:

- The defect must be behavioral, not formatting.
- Prefer a boundary, negative, concurrency, or ownership case.
- Explain why the generated tests agreed with incorrect code.

Proof: original green suite, your red test, minimal fix, and review comment.

Debrief: what prompt detail might have prevented the error, and why would
independent verification still be necessary?

AI level: 3 deliberately; this is an AI-review exercise.

## Project transfer

Use the risk map in RD-901, the contract suite in repository refactoring, and
the characterization sequence for RD-902. Keep RD-903's E2E test small and
diagnostic artifacts rich.

