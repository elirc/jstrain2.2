# 28 — API consumer

## Outcome

Integrate unreliable external APIs with bounded time, explicit validation,
pagination, error classification, retry, idempotency, and observability.

## The 80/20 model

External responses are `unknown` regardless of generated TypeScript types.
Validate at the boundary and translate provider models/errors into local
contracts so provider changes do not leak through the application.

Every call needs timeout/cancellation, response-size limits, error-body
handling, and useful context. Retry only transient outcomes, with bounded
attempts/time, backoff, and jitter. Mutations require provider/local
idempotency semantics before retry.

Cursor pagination needs termination guards: repeated cursor, missing items,
maximum pages/items, cancellation, and partial-failure policy. Logs/metrics
should show dependency, operation, attempt, latency, status class, and safe
correlation identifiers.

## Common traps

- Casting provider JSON to a trusted interface.
- Retrying all 4xx/5xx errors.
- Timeout that does not abort underlying work.
- Infinite loop on repeated cursor.
- Logging API keys or whole error bodies.
- Provider-specific error shapes escaping local service boundaries.

## Optimized exercises

1. **Client:** wrap a scripted transport with timeout/abort, bounded body,
   validation, local error envelope, and safe diagnostics.
2. **Pagination/retry:** consume cursors with repeat/limit guards and a tested
   failure-class retry table using injected time/randomness.
3. **Application:** harden RelayDesk webhook or external-user integration for
   idempotency, partial failure, observability, and provider contract change.

## Exit gate

Trace one external call through validation, timeout, cancellation, retry,
idempotency, translation, logs, and caller-visible failure.

More reps: `../../bootcamp/28-api-consumer/`.

