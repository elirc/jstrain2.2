# 02 — Functions and closures mastery bank

Deepen: invocation, lexical scope, closures, `this`, wrappers, higher-order
functions, state lifetime, memoization, debounce, recursion, and cleanup.

## Explain

- [ ] Draw lexical environments for nested functions and identify retained bindings.
- [ ] Explain the four common `this` call forms and arrow-function capture.
- [ ] Explain closure-based dependency injection versus module-global imports.
- [ ] State full contracts for once, debounce, throttle, memoize, and retry wrappers.
- [ ] Explain recursion base/progress rules and when iteration is operationally safer.

## Predict

- [ ] Predict receiver values for method, detached, bound, call/apply, constructor, and arrow calls.
- [ ] Predict loop callback output using `var`, `let`, and factory-created bindings.
- [ ] Predict closure state after interleaved calls from two independently created instances.
- [ ] Predict debounce calls across leading, trailing, cancel, flush, and reentrant invocation.
- [ ] Predict memoization behavior for object keys, equivalent objects, rejection, and mutation.

## Implement

- [ ] Implement `once` with preserved receiver, arguments, return, and thrown error semantics.
- [ ] Implement cancelable/flushable debounce using an injected scheduler.
- [ ] Implement memoization with resolver, bounded size, rejected-promise policy, and clear.
- [ ] Implement a closure-based store with subscribe/unsubscribe and defensive dispatch iteration.
- [ ] Implement trampoline or iterative traversal for a deeply nested structure.

## Test

- [ ] Test a detached method bug and three valid receiver-preservation strategies.
- [ ] Test debounce deterministically without real time, including cleanup and reentrancy.
- [ ] Test memoization keys for collision, identity, eviction, and error behavior.
- [ ] Write a listener-unsubscribe test where a callback removes itself during dispatch.
- [ ] Build a recursion test that exposes stack-depth risk without crashing the test runner.

## Debug and review

- [ ] Diagnose a stale captured configuration value in a long-lived callback.
- [ ] Review a wrapper that swallows return values or error context.
- [ ] Find a memoization cache retaining request objects indefinitely.
- [ ] Diagnose a lost receiver after passing a service method as middleware.
- [ ] Review a closure with hidden shared mutable state across tests.

## Apply

- [ ] Inventory RelayDesk long-lived callbacks and assign owner, lifetime, and disposer.
- [ ] Extract one external dependency behind a closure/factory without service locator behavior.
- [ ] Implement or review queue-search debounce with cancellation and stale-response protection.
- [ ] Replace one module-global mutable singleton with explicit application construction.
- [ ] Explain one chosen class/closure/plain-function boundary in a PR or ADR.

