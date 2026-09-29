# 07 — Async mastery

## Outcome

Choose sequential, concurrent, or bounded execution deliberately and own
completion, failure, cancellation, timeout, and cleanup.

## The 80/20 model

Promise callbacks and `await` continuations run through microtasks; timers and
I/O callbacks enter through task phases. `await` pauses one function, not the
process. A started promise without an owner can fail after its intended error
boundary has returned.

Run dependent operations sequentially, independent operations concurrently,
and resource-sensitive batches with a limit. Output ordering is a separate
contract from execution ordering.

A timeout stops waiting unless it also aborts the work. Cancellation is
cooperative and must flow through owned operations. Retry repeats effects, so
idempotency and failure classification come first.

## Common traps

- `forEach(async ...)` and floating promises.
- `Promise.all` losing useful partial success.
- Timer/listener leaks in timeout or abort helpers.
- Retrying all errors.
- Unbounded fan-out from user input.
- Tests depending on real-time sleeps.

## Optimized exercises

1. **Prediction:** trace sync logs, two awaits, promise callbacks, microtasks,
   timers, and one rejection; distinguish guarantees from observations.
2. **Implementation:** create ordered `mapLimit` with individual result/error
   capture, cancellation, and deterministic tests.
3. **Application:** review a RelayDesk outbound or UI request for ownership,
   stale results, timeout, abort, retry, and cleanup; close one gap.

## Exit gate

Given three asynchronous operations, justify execution policy, failure
semantics, cancellation behavior, and the test that proves dangerous ordering.

More reps: `../../bootcamp/07-async-mastery/`.

