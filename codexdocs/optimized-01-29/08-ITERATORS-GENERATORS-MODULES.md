# 08 — Iterators, generators, and modules

## Outcome

Use iterable protocols for lazy data flow and design module boundaries with
clear ownership and dependency direction.

## The 80/20 model

An iterable produces an iterator; an iterator's `next()` returns `{ value,
done }`. Generators make that state machine readable and can produce large or
infinite sequences lazily. Async iterables model values arriving over time
with backpressure controlled by the consumer's next request.

Laziness delays work and failure. Resource-owning generators need `finally`
cleanup because consumers may stop early. Do not use generators where a plain
array transformation is clearer.

ES modules are live bindings evaluated once per module instance. Boundaries
should expose stable contracts, avoid circular initialization, and point
dependencies toward policy-free domain code rather than frameworks.

## Common traps

- Forgetting that iterators are consumable state.
- Infinite iterable passed to an eager collector.
- Resource cleanup skipped on early break.
- Barrel files creating circular dependencies.
- Module-scope mutable state leaking between tests/requests.

## Optimized exercises

1. **Implementation:** build a lazy paginated iterator that fetches the next
   page only when requested and stops on empty cursor or cancellation.
2. **Cleanup:** create an async event iterator and prove listener removal on
   completion, rejection, abort, and early consumer exit.
3. **Application:** draw RelayDesk package dependencies, locate a framework
   dependency pointing inward, and extract the smallest stable contract.

## Exit gate

Explain when laziness changes memory, timing, errors, and cleanup, plus how a
module boundary prevents rather than merely relocates coupling.

More reps: `../../bootcamp/08-iterators-generators-modules/`.

