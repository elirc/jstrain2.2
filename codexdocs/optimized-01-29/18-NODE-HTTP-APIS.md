# 18 — Node HTTP APIs

## Outcome

Build and review HTTP request pipelines with explicit routing, parsing,
middleware order, limits, responses, errors, and shutdown.

## The 80/20 model

Node HTTP exposes streams and events; frameworks organize them but do not
remove transport constraints. A request body is a bounded stream, headers are
untrusted strings, connections can close, and responses can begin before later
work fails.

Middleware is nested behavior. Order determines which context exists, which
work is protected by error handling, and which requests consume expensive
resources. Route handlers should translate transport to domain commands and
domain outcomes back to stable responses.

Centralize response/error conventions without hiding business behavior. Add
request IDs, timeouts/abort, size limits, content-type handling, and graceful
shutdown early.

## Common traps

- Unlimited body buffering.
- Double response after an async failure.
- Error middleware registered too late or with wrong shape.
- Authorization applied to some routes only.
- Dynamic route/sort values trusted as data when they affect syntax.
- Compressing tiny/already-compressed responses blindly.

## Optimized exercises

1. **Pipeline:** trace health, invalid JSON, unauthenticated, forbidden,
   missing, and crashing requests through proposed middleware order.
2. **Implementation:** build a tiny JSON endpoint with body limit, abort,
   validation, request ID, stable errors, and real-server integration tests.
3. **Application:** review RelayDesk route consistency for parsing, policy,
   status codes, headers, limits, and response DTOs; consolidate one unsafe
   inconsistency.

## Exit gate

Trace bytes from socket to domain command and response, including every
resource/error boundary and what happens when the client disconnects.

More reps: `../../bootcamp/18-node-http-apis/`.

