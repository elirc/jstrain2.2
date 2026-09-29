# 20 — testing and quality mastery bank

Deepen: test design, deterministic seams, integration and contract tests, properties, coverage, mutation, and CI quality gates.

## Explain

- [ ] Explain behavior-focused tests and why mirroring implementation structure creates brittle suites.
- [ ] Explain unit, integration, contract, end-to-end, and smoke tests by risk and feedback purpose.
- [ ] Explain dummy, stub, spy, fake, and mock test doubles with the cost of each.
- [ ] Explain deterministic seams for time, randomness, networks, processes, and persistence.
- [ ] Explain why line coverage is evidence of execution, not evidence of useful assertions.

## Predict

- [ ] Predict which tests should change for an internal refactor with identical observable behavior.
- [ ] Predict flakiness sources in tests using real clocks, random ports, shared state, and retries.
- [ ] Predict false confidence from snapshot-heavy, mock-heavy, happy-path-only, or order-dependent suites.
- [ ] Predict which boundary values and equivalence classes expose an off-by-one validation bug.
- [ ] Predict which mutants survive weak assertions despite apparently high coverage.

## Implement

- [ ] Refactor nondeterministic code behind explicit clock, ID, and dependency interfaces.
- [ ] Create table-driven tests for boundary partitions and expressive failure messages.
- [ ] Build a realistic fake repository with the same observable contract as production storage.
- [ ] Add API contract tests for schemas, errors, compatibility, and authorization boundaries.
- [ ] Add property-based tests for an invariant such as round-trip, idempotence, or ordering.

## Test

- [ ] Test a module at its public boundary and remove assertions coupled to private calls.
- [ ] Test retry code deterministically for success, exhaustion, backoff, cancellation, and non-retryable errors.
- [ ] Test concurrency with controlled deferred promises and no arbitrary sleeps.
- [ ] Run tests in randomized order and isolation to expose hidden shared state.
- [ ] Use coverage and mutation output to add missing assertions, then document remaining risk.

## Debug and review

- [ ] Reproduce and repair a flaky test, recording the actual nondeterministic dependency.
- [ ] Review a mock-heavy test and replace interaction checks with higher-value outcome evidence.
- [ ] Diagnose a test that passes alone but fails in the suite because state is not restored.
- [ ] Repair an async false positive caused by an unreturned promise or missing assertion execution.
- [ ] Triage a slow suite using measurements and improve speed without deleting meaningful coverage.

## Apply

- [ ] Create a RelayDesk risk map that assigns each major failure mode to the cheapest useful test layer.
- [ ] Add a CI quality gate for typecheck, lint, unit, integration, build, and a minimal smoke test.
- [ ] Create contract fixtures shared by API producer and consumer tests without coupling implementations.
- [ ] Write a regression test for one debug hunt before applying the smallest production fix.
- [ ] Defend the suite in a review using risk caught, runtime, reliability, and maintenance cost.
