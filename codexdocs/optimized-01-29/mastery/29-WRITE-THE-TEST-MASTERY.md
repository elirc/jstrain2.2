# 29 — write the test mastery bank

Deepen: deriving tests from contracts and risks, selecting layers, writing discriminating assertions, and proving regressions.

## Explain

- [ ] Explain how requirements become examples, invariants, equivalence classes, boundaries, and failure cases.
- [ ] Explain why each test needs a credible defect it would catch and an observable reason for failure.
- [ ] Explain state-based, interaction-based, snapshot, property, contract, and metamorphic assertions.
- [ ] Explain the test pyramid as an economic heuristic rather than a quota.
- [ ] Explain test readability through arrange-act-assert, intent-revealing data, and diagnostic failures.

## Predict

- [ ] Given ten candidate tests, predict which pass against five subtly broken implementations.
- [ ] Predict where tests coupled to call order, private methods, timestamps, or whole snapshots will break.
- [ ] Predict boundary cases for ranges, strings, collections, dates, pagination, and permissions.
- [ ] Predict which test layer gives the fastest reliable signal for each supplied production risk.
- [ ] Predict mutants that survive assertions checking only existence, status, or broad truthiness.

## Implement

- [ ] Turn an ambiguous requirement into a compact decision table and executable test cases.
- [ ] Write table-driven unit tests that cover partitions without duplicating setup noise.
- [ ] Write a property test with generators, shrinking-friendly inputs, and a meaningful invariant.
- [ ] Write an HTTP contract test that asserts status, headers, schema, errors, and side effects.
- [ ] Write a concurrency test with deferred controls that forces the dangerous interleaving.

## Test

- [ ] Test-drive a pure function from examples through generalization and refactor only under green tests.
- [ ] Test-drive a vertical slice using a thin acceptance test plus focused boundary tests.
- [ ] Delete or weaken each assertion temporarily to confirm it contributes a useful failure signal.
- [ ] Run a mutation exercise and strengthen tests until important behavioral mutants are killed.
- [ ] Run the suite repeatedly, shuffled, isolated, and under CI-like settings to verify reliability.

## Debug and review

- [ ] Repair a test that passes even when the production operation never runs.
- [ ] Repair a test that asserts mock choreography while missing an incorrect user-visible result.
- [ ] Repair an overgrown snapshot by replacing it with focused contract assertions.
- [ ] Diagnose a flaky integration test and replace implicit time or shared state with deterministic control.
- [ ] Review a test suite and classify redundant, missing, brittle, slow, and high-value coverage.

## Apply

- [ ] For five old exercises, write the tests first from prose before reading their implementations.
- [ ] Add a regression test for a real debug hunt, demonstrate red, apply fix, and demonstrate green.
- [ ] Build a RelayDesk feature test plan from risks, assigning ownership to appropriate layers.
- [ ] Write a pull-request test note describing evidence, omissions, manual checks, and residual risk.
- [ ] Conduct a mock review where you defend why each test exists and what defect it detects.
