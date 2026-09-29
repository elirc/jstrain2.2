# 07 — Async mastery bank

Deepen: event loop, ownership, ordering, aggregation, limits, cancellation,
timeouts, retries, races, listeners, queues, and shutdown.

## Explain

- [ ] Explain call stack, tasks, microtasks, I/O readiness, and microtask starvation.
- [ ] Define ownership of a promise from creation through observation and cleanup.
- [ ] Compare sequential, full-concurrent, bounded, and waterfall execution.
- [ ] Separate timeout, cancellation, ignoring results, and compensating effects.
- [ ] Explain why retry requires classification, idempotency, backoff, jitter, and limits.

## Predict

- [ ] Predict mixed sync/promise/await/microtask/timer output and justify guarantees.
- [ ] Predict Promise all/allSettled/race/any results for mixed settle orders.
- [ ] Predict error paths for async callback, dropped return, synchronous throw, and finally.
- [ ] Predict active-count/output ordering for a three-worker controlled queue.
- [ ] Predict listener/timer state after resolve, reject, abort, timeout, and late settle.

## Implement

- [ ] Implement Promise.all semantics including empty input and thenables.
- [ ] Implement ordered mapLimit with per-item results and bounded active work.
- [ ] Implement abortable delay and compose signals without listener leaks.
- [ ] Implement timeout that aborts supported work and reports unsupported cancellation honestly.
- [ ] Implement keyed serial queue that parallelizes different keys but orders the same key.

## Test

- [ ] Build deferred-promise tools to control every settlement order deterministically.
- [ ] Assert maximum concurrency and output order independently.
- [ ] Test abort before/during/after work and repeated abort cleanup.
- [ ] Test retry delay/attempt/elapsed bounds using fake time and injected randomness.
- [ ] Detect floating rejection, leftover timer/listener, and hung-promise timeout behavior.

## Debug and review

- [ ] Diagnose async forEach returning before work completes.
- [ ] Review Promise.all use where partial success is product-required.
- [ ] Find stale response race despite individually correct requests.
- [ ] Diagnose lost update across an await and identify authoritative fix layer.
- [ ] Review shutdown for unowned in-flight tasks and forced-deadline behavior.

## Apply

- [ ] Add cancellation propagation to one RelayDesk request chain.
- [ ] Prove UI stale-response protection with out-of-order completion.
- [ ] Implement bounded webhook worker behavior and per-delivery result capture.
- [ ] Add deterministic race proof for optimistic ticket version updates.
- [ ] Exercise graceful shutdown with active HTTP and worker operations.

