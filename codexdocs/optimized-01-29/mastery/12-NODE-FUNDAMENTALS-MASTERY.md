# 12 — Node fundamentals mastery bank

Deepen: process/runtime, filesystem, paths, buffers, URLs, crypto, events,
streams, HTTP, configuration, signals, cleanup, and portability.

## Explain

- [ ] Explain Node event-loop role versus OS I/O and worker-pool work.
- [ ] Explain path versus URL semantics and normalized containment checks.
- [ ] Explain Buffer bytes, encodings, string conversion, and binary boundaries.
- [ ] Explain event emitter listener ownership, error events, and defensive iteration.
- [ ] Explain stream backpressure, pipeline completion, abort, and resource cleanup.

## Predict

- [ ] Predict path resolve/join/normalize results across relative, absolute, and traversal input.
- [ ] Predict UTF-8 byte length versus string length for varied Unicode values.
- [ ] Predict emitter behavior when listeners add/remove/throw during dispatch.
- [ ] Predict readable/writable state when consumer slows, errors, or aborts.
- [ ] Predict process lifetime with timers, sockets, listeners, workers, and unreferenced handles.

## Implement

- [ ] Implement validated environment config loaded once at startup.
- [ ] Implement secure random token and HMAC verify with safe encoding/comparison.
- [ ] Implement filesystem tree walk with symlink policy, abort, limits, and errors.
- [ ] Implement streaming line parser with bounded record size and backpressure.
- [ ] Implement minimal JSON HTTP server with limits, request IDs, errors, and shutdown.

## Test

- [ ] Test path containment against traversal, absolute, sibling-prefix, and separator cases.
- [ ] Test byte/encoding round trips and malformed input policy.
- [ ] Test emitter cleanup, once/off identity, mutation during dispatch, and thrown listener.
- [ ] Test stream errors from source/transform/sink plus abort and partial output cleanup.
- [ ] Spawn a process to verify signal handling, exit codes, and no leftover resources.

## Debug and review

- [ ] Diagnose script hanging after apparent completion using active-resource reasoning.
- [ ] Find synchronous filesystem work blocking a request path.
- [ ] Review token code using fast hash or non-cryptographic randomness.
- [ ] Diagnose stream buffering that defeats bounded memory.
- [ ] Review filesystem operation for race, traversal, and partial-write behavior.

## Apply

- [ ] Centralize RelayDesk config validation and redact secret failures.
- [ ] Audit URL/path/crypto uses for correct platform primitive.
- [ ] Add graceful server/worker/database shutdown coordination.
- [ ] Stream one import/export path with size limits and malformed-record reporting.
- [ ] Document active resources and owners for the deployed service.

