# 02 — Functions and closures

## Outcome

Treat functions as values with contracts, understand captured state and `this`,
and design callback lifetimes with cleanup.

## The 80/20 model

A closure retains access to bindings from the environment where it was
created. This enables private state, factories, injected dependencies, and
memoization. It also causes stale-value and retained-resource bugs when a
callback outlives the state snapshot it captured.

For ordinary functions, `this` is selected by the call site. Arrow functions
capture surrounding `this`; `call`, `apply`, and `bind` make invocation
explicit. Prefer explicit parameters and closures unless method-style dynamic
dispatch is useful.

Higher-order utilities such as debounce, memoize, retry, and middleware are
wrappers: accept behavior and return behavior. Their real contracts include
argument/return preservation, error propagation, timing, cache keys, cleanup,
and caller identity.

## Common traps

- Passing a method as a callback and losing its receiver.
- Loop closures sharing a changing `var` binding.
- Memoization keys that collide or retain objects forever.
- Debounce implementations with no cancel/flush ownership.
- Catching callback errors inside a wrapper without contract justification.

## Optimized exercises

1. **Prediction:** trace five calls using method syntax, detached method,
   arrow wrapper, `call`, and bound function. State the receiver before run.
2. **Implementation:** build `once` and a cancelable `debounce` while preserving
   arguments, return/error behavior where meaningful, and cleanup.
3. **Application:** find one long-lived RelayDesk callback—effect, listener,
   timer, worker, or middleware closure—and document captured bindings,
   lifetime, and disposer.

## Exit gate

Given a callback that runs later, identify what it captures, who owns it, when
it becomes stale, and how it is removed.

More reps: `../../bootcamp/02-functions-and-closures/`.

