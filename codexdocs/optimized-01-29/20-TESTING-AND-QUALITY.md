# 20 — Testing and quality

## Outcome

Create fast, deterministic evidence at the cheapest boundary capable of
proving each important risk.

## The 80/20 model

Tests should fail for a meaningful behavior change and explain what broke.
Unit tests prove pure/domain behavior; integration tests prove real boundaries
such as SQL and HTTP; component tests prove user-visible React behavior; a
small E2E suite proves critical wiring.

Control time, randomness, I/O, and concurrency through injected dependencies
or deterministic coordination. Test doubles must preserve the contract they
stand in for, while real-boundary tests cover mechanisms fakes cannot prove.

Coverage reveals unexecuted code but does not measure assertion strength.
Observe a test fail for the intended reason, then mentally or temporarily
mutate likely bugs to evaluate it.

## Common traps

- Tests that start green.
- Mocking implementation details.
- Real sleeps and shared mutable fixtures.
- Snapshots hiding important assertions.
- Unit fake claimed as transaction proof.
- Many duplicated tests but missing negative/security behavior.

## Optimized exercises

1. **Risk map:** route ten RelayDesk risks to unit, service, repository, HTTP,
   component, contract, or E2E evidence; justify cost and trust.
2. **Determinism:** replace one timing-based test with fake clock/deferred
   promises and demonstrate repeated fast failure/success.
3. **Application:** audit one feature's tests, delete one low-value duplicate,
   add one missing high-risk case, and show why confidence improved.

## Exit gate

For each test in one PR, name the bug it catches, why its boundary is required,
and one incorrect implementation that might still pass.

More reps: `../../bootcamp/20-testing-and-quality/`.

