# 11 — Functional programming mastery bank

Deepen: purity, effects, immutability, composition, reducers, currying,
results, structural sharing, dependency injection, and pragmatic tradeoffs.

## Explain

- [ ] Identify observable effects and explain referential transparency with counterexamples.
- [ ] Explain pure-core/impure-shell architecture and its testing/change benefits.
- [ ] Explain immutability as ownership, including structural sharing and copy costs.
- [ ] Compare composition, named stages, middleware, and imperative flow for readability.
- [ ] Explain reducers/state machines and when direct methods are simpler.

## Predict

- [ ] Predict outcomes when a “pure” function reads time, randomness, or module state.
- [ ] Predict identities through immutable nested updates and shared branches.
- [ ] Trace composed success/result/error functions and short-circuit behavior.
- [ ] Predict reducer state under valid, invalid, duplicate, and reordered actions.
- [ ] Predict memoized pure function behavior after mutable input changes.

## Implement

- [ ] Separate an I/O-heavy function into pure validation/transform core and effect shell.
- [ ] Implement typed compose/pipe with limited readable arity and preserved errors.
- [ ] Implement immutable ticket reducer with exhaustive actions and invariants.
- [ ] Implement Result sequence/traverse for collecting versus short-circuiting failures.
- [ ] Implement dependency-injected clock/ID/random policies without framework container.

## Test

- [ ] Prove purity by controlled repeated inputs and explicit injected dependencies.
- [ ] Assert structural sharing for changed and unchanged branches.
- [ ] Table-test reducer transitions including invalid actions and no-op identity.
- [ ] Test composed stages independently and as a contract without private-call assertions.
- [ ] Property-test one algebraic relationship such as map identity/composition.

## Debug and review

- [ ] Find hidden mutation inside a supposedly pure transformation.
- [ ] Diagnose derived state drift caused by storing both source and computed data.
- [ ] Review point-free composition whose failures/domain meaning are obscured.
- [ ] Find effectful callback passed into a function whose name promises purity.
- [ ] Challenge immutable copying that clones far more than ownership requires.

## Apply

- [ ] Extract RelayDesk domain policy from HTTP/database effects.
- [ ] Model ticket transition or filter logic as pure exhaustive transformation.
- [ ] Inject clock/ID/outbound dependencies at application construction.
- [ ] Review one pipeline for named stages, diagnostics, and failure ownership.
- [ ] Document a deliberate imperative design where functional abstraction would harm clarity.

