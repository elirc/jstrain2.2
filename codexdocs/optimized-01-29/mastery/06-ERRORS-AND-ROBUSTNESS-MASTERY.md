# 06 — Errors and robustness mastery bank

Deepen: taxonomy, results, exceptions, causes, cleanup, retries, invariants,
degradation, error boundaries, safe messages, and observability.

## Explain

- [ ] Classify expected domain outcomes versus unexpected exceptional failures.
- [ ] Explain catch/rethrow/translate/recover/cleanup responsibilities by layer.
- [ ] Explain error cause chains and separate client, log, and telemetry audiences.
- [ ] Explain `finally` behavior across return, throw, rejection, and cleanup failure.
- [ ] Explain fail-open versus fail-closed choices for five system capabilities.

## Predict

- [ ] Predict try/catch/finally return and throw behavior for ten snippets.
- [ ] Predict promise rejection propagation through await, catch recovery, and finally.
- [ ] Predict resource state after success, operation failure, cleanup failure, and both failures.
- [ ] Predict retry outcomes for validation, conflict, timeout, rate limit, and connection reset.
- [ ] Predict what a central HTTP boundary exposes/logs for diverse thrown values.

## Implement

- [ ] Implement a typed Result with map/chain/recover and no swallowed error detail.
- [ ] Implement async resource scoping with deterministic dual-failure policy.
- [ ] Implement domain-to-HTTP error mapping with stable codes and request IDs.
- [ ] Implement retry filtering with backoff, jitter, attempts, elapsed cap, and cause.
- [ ] Implement graceful degradation for an optional dependency without falsifying core success.

## Test

- [ ] Table-test error taxonomy and HTTP/log mappings.
- [ ] Test cleanup under every exit path and prove resource reuse afterward.
- [ ] Test thrown Error, subclass, primitive, AggregateError, and nested cause.
- [ ] Test retry scheduling without real time and verify permanent failures stop.
- [ ] Test client responses omit stack, SQL, secret, and internal dependency detail.

## Debug and review

- [ ] Diagnose a catch returning undefined that corrupts downstream state.
- [ ] Review context-wrapping that destroys original error/cause.
- [ ] Find a transaction/resource cleanup path skipped on rejection.
- [ ] Diagnose retry that amplifies a permanent failure or duplicate effect.
- [ ] Review “best effort” behavior and identify whether it silently violates the contract.

## Apply

- [ ] Create RelayDesk error taxonomy shared in concept, not coupled to framework classes.
- [ ] Trace one failure from dependency to safe response and structured log.
- [ ] Add cleanup proof to one database, timer, listener, or worker lifecycle.
- [ ] Define retryability for webhook/provider outcomes from actual contract semantics.
- [ ] Audit optional-feature degradation so core behavior and operator visibility stay honest.

