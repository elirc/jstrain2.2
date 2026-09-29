# 14 — software design patterns mastery bank

Deepen: strategy, observer, command, adapter, decorator, state, repository,
factory, DI, composition, architecture boundaries, and pattern restraint.

## Explain

- [ ] For ten patterns, name force solved, added cost, and simplest implementation form.
- [ ] Compare strategy function/object/class and selection ownership.
- [ ] Explain observer delivery ordering, error isolation, unsubscribe, and backpressure limits.
- [ ] Explain adapter boundary versus leaking external/provider models inward.
- [ ] Explain dependency injection as construction separation, not global service lookup.

## Predict

- [ ] Trace decorator order for logging, timeout, retry, auth, and caching wrappers.
- [ ] Predict observer mutation/reentrancy behavior during dispatch.
- [ ] Trace command do/undo failure and grouped-command partial failure.
- [ ] Predict state-machine illegal transitions under scattered versus centralized rules.
- [ ] Predict repository abstraction changes when storage/query capability evolves.

## Implement

- [ ] Implement retry and authorization as explicit strategies with contract tests.
- [ ] Implement observer with disposer, defensive iteration, error policy, and once.
- [ ] Implement adapter translating provider response/errors into local domain contract.
- [ ] Implement command-based reversible edit with bounded history and failure policy.
- [ ] Build explicit composition root constructing app dependencies and lifecycle.

## Test

- [ ] Contract-test two strategy/adapter implementations without private-call coupling.
- [ ] Test decorator order changes observable behavior and document chosen sequence.
- [ ] Test observer reentrancy, unregister, throwing listener, and cleanup.
- [ ] Exhaustively test state transition table and newly added state compiler pressure.
- [ ] Test composition root startup failure and reverse-order resource cleanup.

## Debug and review

- [ ] Identify pattern-shaped code whose force no longer exists and simplify it.
- [ ] Diagnose event bus hiding important synchronous dependency/order.
- [ ] Review repository that only renames persistence methods without stabilizing contract.
- [ ] Find service locator access that hides dependencies from tests/review.
- [ ] Review inheritance hierarchy and propose composition only with concrete benefit.

## Apply

- [ ] Name patterns already present in RelayDesk and document actual tradeoffs.
- [ ] Add smallest adapter for webhook/provider isolation.
- [ ] Centralize ticket lifecycle as explicit state policy.
- [ ] Review wrapper order for request logging/auth/error/retry/cache behavior.
- [ ] Remove or reject one premature abstraction and explain saved complexity.

