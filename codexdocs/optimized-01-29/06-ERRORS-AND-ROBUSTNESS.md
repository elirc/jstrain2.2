# 06 — Errors and robustness

## Outcome

Separate expected failures from unexpected exceptions, preserve diagnostic
context, and leave resources consistent under every exit path.

## The 80/20 model

Expected alternatives—validation problems, illegal transitions, stale
versions—often deserve typed results the caller must handle. Unexpected
infrastructure or invariant failures usually travel as exceptions to a central
boundary. Consistency matters more than dogma.

Catch only when you can recover, add context, translate at a boundary, or
clean up. Preserve the original cause. Client messages, logs, and internal
exception details serve different audiences.

Use `finally` or scoped ownership for cleanup. A failure path must release
locks, transactions, timers, listeners, files, and connections. Robustness also
means limits, validation, graceful degradation, and refusing corrupt state.

## Common traps

- Catching and returning `undefined`.
- Wrapping every error in the same message without `cause`.
- Using exceptions for routine field validation.
- Cleanup only on the success path.
- Retrying permanent or programmer failures.
- Logging secrets inside convenient error context.

## Optimized exercises

1. **Taxonomy:** classify twelve RelayDesk failures as validation, domain,
   authorization, conflict, dependency, invariant, or programmer failure;
   define caller and logging behavior.
2. **Implementation:** write `withResource` that preserves return/rejection and
   always performs async cleanup, including dual operation/cleanup failure.
3. **Application:** trace one API failure from database cause to log and safe
   error envelope; add a request ID and regression test.

## Exit gate

For any caught error, explain why this layer is capable of doing something
useful and what information must survive the translation.

More reps: `../../bootcamp/06-errors-and-robustness/`.

