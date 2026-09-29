# 28 — API consumer mastery bank

Deepen: client contracts, React state, cancellation, retries, pagination, caching, resilience, observability, and user experience.

## Explain

- [ ] Explain transport success, HTTP success, parsing success, schema success, and domain success.
- [ ] Explain loading, empty, stale, partial, error, and success states as distinct UI states.
- [ ] Explain cancellation, timeout, retry, backoff, jitter, and idempotency as interacting controls.
- [ ] Explain request deduplication, cache freshness, invalidation, and optimistic UI rollback.
- [ ] Explain why generated TypeScript types do not validate untrusted runtime responses.

## Predict

- [ ] Predict UI state when two searches complete out of order and the first request is slower.
- [ ] Predict safe retry behavior for common HTTP methods, network failures, 429, and 5xx responses.
- [ ] Predict pagination behavior when records are inserted, removed, or updated between requests.
- [ ] Predict cache results after mutation under invalidate, update-in-place, and optimistic strategies.
- [ ] Predict user-visible behavior for offline, slow, malformed, partial, unauthorized, and rate-limited responses.

## Implement

- [ ] Build a typed fetch boundary with timeout, cancellation, runtime validation, and structured errors.
- [ ] Build a React query view covering initial, loading, empty, stale, partial, retry, and fatal states.
- [ ] Prevent stale search results using cancellation or request identity and prove the behavior.
- [ ] Implement bounded retries honoring `Retry-After`, exponential backoff, jitter, and cancellation.
- [ ] Implement paginated loading with stable cursors, deduplication, and recoverable page errors.

## Test

- [ ] Test status, headers, invalid JSON, wrong schema, timeout, abort, disconnect, and network failure.
- [ ] Test out-of-order completion with controlled promises and assert the newest intent wins.
- [ ] Test retry count, delay schedule, idempotency policy, `Retry-After`, and final error mapping.
- [ ] Test cached, stale, invalidated, optimistic, rolled-back, and concurrently mutated states.
- [ ] Test accessible UI announcements, focus behavior, disabled actions, and recovery paths.

## Debug and review

- [ ] Diagnose a React state update after unmount or superseded request and repair lifecycle ownership.
- [ ] Diagnose a retry storm multiplying across browser, proxy, and service layers.
- [ ] Repair code that treats every non-2xx response as the same generic error.
- [ ] Diagnose duplicated or missing records in infinite scrolling under changing server data.
- [ ] Review telemetry for correlation, useful failure categories, privacy, and alertable signals.

## Apply

- [ ] Build the RelayDesk ticket list against the real API with filters, pagination, and resilient states.
- [ ] Add create/update optimistic UI with version conflicts and honest rollback messaging.
- [ ] Write a client/API compatibility contract for additive, deprecated, and breaking changes.
- [ ] Simulate slow, flaky, offline, unauthorized, malformed, and overloaded dependencies in a demo.
- [ ] Defend the consumer design using user impact, consistency needs, retry safety, and observability.
