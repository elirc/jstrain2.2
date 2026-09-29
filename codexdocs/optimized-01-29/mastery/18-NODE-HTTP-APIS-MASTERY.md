# 18 — Node HTTP APIs mastery bank

Deepen: HTTP semantics, routing, middleware, parsing, streaming, validation, error contracts, and lifecycle behavior.

## Explain

- [ ] Explain HTTP message framing, headers, body streams, connection reuse, and aborted requests.
- [ ] Explain safe/idempotent methods and how those properties affect retries and caching.
- [ ] Explain middleware composition, ownership, ordering, and exactly-once response completion.
- [ ] Explain the boundary between syntactic parsing, schema validation, and domain validation.
- [ ] Explain status, headers, and response bodies as one stable public error contract.

## Predict

- [ ] Predict behavior when middleware writes headers, calls next, and a later handler throws.
- [ ] Predict route matches when static, parameterized, wildcard, and method-specific routes overlap.
- [ ] Predict server behavior for malformed JSON, oversized bodies, missing length, and disconnects.
- [ ] Predict whether common PUT, PATCH, POST, and DELETE requests are safe to retry.
- [ ] Predict cache and browser behavior for `Vary`, ETag, CORS, cookies, and content type changes.

## Implement

- [ ] Build request/response helpers that preserve streaming and prevent double completion.
- [ ] Build a router with decoded parameters, query parsing, method handling, and 404/405 distinction.
- [ ] Build composable middleware for correlation IDs, logging, auth, timing, and error translation.
- [ ] Build bounded JSON parsing plus schema validation with consistent field-level errors.
- [ ] Build conditional GET and optimistic update support with ETags or version fields.

## Test

- [ ] Test the real listening server over HTTP, including status, headers, bytes, and keep-alive.
- [ ] Test route precedence, encoded paths, unsupported methods, missing resources, and query repeats.
- [ ] Test empty, invalid, wrong-type, too-large, and prematurely disconnected request bodies.
- [ ] Test middleware ordering and prove errors, async rejection, and responses settle exactly once.
- [ ] Test concurrent conditional updates and show stale clients receive a deterministic conflict.

## Debug and review

- [ ] Diagnose `headers already sent` and identify the first violated ownership rule.
- [ ] Repair an async handler whose rejection bypasses the central error boundary.
- [ ] Review a permissive CORS configuration with credentials and demonstrate the actual exposure.
- [ ] Diagnose a cookie that works locally but fails behind HTTPS proxying or cross-site requests.
- [ ] Repair incorrect cache variation that returns one user's representation to another context.

## Apply

- [ ] Implement RelayDesk ticket create/read/update/list endpoints as complete vertical slices.
- [ ] Add pagination, filtering, stable sorting, and an evolvable response envelope.
- [ ] Publish an API error catalog with codes, status mapping, examples, and client actions.
- [ ] Write shutdown behavior that stops acceptance, drains requests, and closes dependencies.
- [ ] Produce an API review showing contract tests, threat cases, compatibility, and tradeoffs.
