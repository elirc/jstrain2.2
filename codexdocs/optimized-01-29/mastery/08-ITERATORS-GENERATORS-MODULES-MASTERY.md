# 08 — Iterators, generators, and modules mastery bank

Deepen: iterable protocols, lazy/eager evaluation, async iteration, cleanup,
backpressure, live bindings, dependency direction, cycles, and module state.

## Explain

- [ ] Explain iterable versus iterator versus iterator result and single-use state.
- [ ] Explain generator suspension, input via next, delegation, return, and throw.
- [ ] Explain laziness effects on work, memory, failure timing, and infinite sequences.
- [ ] Explain async iteration as consumer-paced value delivery and cancellation need.
- [ ] Explain ES module evaluation, caching, live bindings, cycles, and dependency direction.

## Predict

- [ ] Predict manual iterator next calls through completion and post-completion calls.
- [ ] Predict generator output with yield, yield*, return, next(value), and throw.
- [ ] Predict which lazy pipeline operations execute when consumer takes three values.
- [ ] Predict generator finally cleanup on break, return, thrown consumer error, and abort.
- [ ] Predict live-binding/circular-module values during initialization and later mutation.

## Implement

- [ ] Implement range, map, filter, take, chunk, and window as lazy iterables.
- [ ] Implement depth-first tree traversal with path accumulation and early exit.
- [ ] Implement async page iteration with cursor guards, limits, and cancellation.
- [ ] Implement event-emitter-to-async-iterator adapter with bounded buffer and cleanup.
- [ ] Refactor a circular module dependency into an inward stable contract.

## Test

- [ ] Prove laziness using source-call counts and infinite input.
- [ ] Test iterator cleanup on partial consumption and thrown mapping function.
- [ ] Test async iterator buffering/backpressure/abort without real time.
- [ ] Test repeated cursor and maximum page/item termination guards.
- [ ] Test module state isolation by explicit factory rather than cache resets.

## Debug and review

- [ ] Diagnose eager collection of an infinite or huge iterable.
- [ ] Review resource-owning generator missing finally cleanup.
- [ ] Find async iterator whose producer outruns unbounded consumer buffer.
- [ ] Diagnose circular initialization producing undefined before live binding settles.
- [ ] Review barrel exports that invert architecture or load unwanted side effects.

## Apply

- [ ] Model RelayDesk paginated export as async iterable with abort and limits.
- [ ] Stream activity events through a lazy transformation pipeline and measure memory.
- [ ] Audit package dependency direction and remove one cycle or framework inward dependency.
- [ ] Replace module-global test state with explicit application factory ownership.
- [ ] Document whether webhook event iteration needs drop, block, or bounded-buffer policy.

