# Module 03 — Node and asynchronous boundaries

Pair with: RelayDesk increments 2, 6, and 8.

## Why this matters

Async code is not primarily about syntax. It is about time, ownership, partial
failure, and work that continues after the caller stops caring. Node makes
concurrent I/O easy, but the product still needs explicit decisions about
ordering, limits, cancellation, cleanup, and retries.

## Promise settlement and error paths

An `async` function always returns a promise. A synchronous throw becomes a
rejection. `await` pauses only the current async function; it does not block
the event loop. A promise that is started but not returned or awaited may fail
outside the intended error boundary.

```ts
async function handle(): Promise<void> {
  saveAudit(); // floating work: completion and failure are now unowned
}
```

Every asynchronous operation should have an owner responsible for observing
completion, failure, cancellation, and cleanup.

## Sequential, concurrent, and bounded work

- Sequential work preserves dependency or required ordering.
- Full concurrency minimizes latency when operations are independent and
  resource limits permit it.
- Bounded concurrency protects databases, remote APIs, memory, and downstream
  rate limits.

The correct choice is a product and capacity decision, not a favorite syntax.

## Cancellation is cooperative

Ignoring a late result does not cancel the underlying work. A timeout created
with `Promise.race` only stops waiting unless the operation also receives an
abort signal or equivalent cancellation mechanism.

Cancellation needs a path through every layer that owns cancellable work. The
cleanup path should be idempotent because abort, normal completion, and error
can race.

## Retry changes semantics

A retry repeats an effect. Before adding one, decide whether the operation is
safe to repeat, how duplicates are prevented, which failures are transient,
and how total time is bounded. Backoff protects a struggling dependency;
jitter prevents synchronized clients from retrying together.

## Common failure patterns

- `forEach(async () => ...)` with unobserved promises.
- `Promise.all` discarding useful successes after one rejection.
- Timeout wrappers that leave timers or underlying work alive.
- Retrying validation or authorization failures.
- Unbounded mapping over user-sized input.
- Event listeners registered repeatedly and never removed.
- Shutdown ending the process while writes are in flight.

## Exercise 1 — event-loop trace (core)

Create a program containing synchronous logs, resolved-promise callbacks,
`queueMicrotask`, timers, an async function with two awaits, and one I/O
callback. Predict every ordering guarantee and mark pairs whose order is not
portable enough to rely on.

Proof: prediction written before execution, observed output from five runs,
and explanation of microtask checkpoints.

Debrief: which output ordering is guaranteed by language/runtime semantics and
which was merely observed?

AI level: 0.

## Exercise 2 — result-preserving concurrency (core)

Load six ticket records concurrently. Return one result per input in input
order, preserving individual failures instead of rejecting the entire batch.

Constraints:

- At most three loads run simultaneously.
- Input order differs from completion order.
- A synchronous throw and an async rejection are both captured.
- Empty input performs no work.

Proof: deterministic scheduler or controlled deferred promises, maximum-active
assertion, and ordered result assertions.

Debrief: why are output order and execution order independent contracts?

AI level: 1.

## Exercise 3 — abortable request chain (applied)

Pass cancellation from an HTTP-like handler through a service into two
repository/external operations.

Constraints:

- Aborting before start, during work, and after completion is safe.
- Listener cleanup occurs in every settle path.
- Abort is distinguishable from dependency failure.
- No real delays in tests.

Proof: controlled tests for all three timing positions and a listener-count or
cleanup assertion.

Debrief: which operations can truly be cancelled and which can only have their
results ignored?

AI level: 1.

## Exercise 4 — timeout leak hunt (review)

Write a plausible timeout helper that passes a success test but leaves a timer
or underlying task alive. Demonstrate the leak, then fix ownership.

Constraints:

- The test must expose retained resources or late side effects without waiting
  real seconds.
- Both resolve and reject paths clear owned timers.
- Do not claim cancellation unless the operation receives it.

Proof: before/after active-resource or fake-scheduler evidence.

Debrief: why can “the caller got a timeout error” coexist with continuing
work?

AI level: 2, diagnosis only.

## Exercise 5 — retry policy table (applied)

Design and implement a policy for outbound webhooks across network errors,
timeouts, HTTP 400, 401, 404, 409, 429, and 500–503.

Constraints:

- Decisions are data-driven and separately testable.
- Server-provided retry delay is bounded and validated.
- Backoff uses injected randomness and time.
- Total attempts and total elapsed time have limits.

Proof: table tests and one integration-shaped test with a scripted transport.

Debrief: which status decisions depend on the provider contract rather than a
universal HTTP rule?

AI level: 2 after your first policy table.

## Exercise 6 — graceful shutdown (applied)

Build a small Node service that accepts work, tracks in-flight operations,
responds to a shutdown signal, stops accepting new work, waits up to a
deadline, closes dependencies, and exits with meaningful status.

Constraints:

- Multiple shutdown signals are safe.
- One hung task cannot block forever.
- Forced shutdown is logged distinctly from clean shutdown.
- Tests invoke the shutdown coordinator directly rather than signaling the
  test process.

Proof: tests for no work, successful drain, timeout, repeated signal, and
dependency-close failure.

Debrief: in what order should server, workers, and database close, and why?

AI level: 1.

## Project transfer

Apply the ownership model to request cancellation, RD-603 stale-response
handling, RD-801–803 webhooks, and deployment shutdown behavior.

