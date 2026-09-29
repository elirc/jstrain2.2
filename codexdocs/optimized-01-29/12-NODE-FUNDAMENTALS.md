# 12 — Node fundamentals

## Outcome

Use Node's process, path, filesystem, stream, event, crypto, URL, and HTTP APIs
with explicit resource ownership and platform-safe behavior.

## The 80/20 model

Node runs JavaScript around an event loop and delegates much I/O to the OS or
worker pool. Files, sockets, streams, timers, and listeners are resources with
lifetimes. Errors often arrive asynchronously and must be observed.

Use `path` and URL APIs instead of string concatenation. Treat filesystem paths
from users as hostile and prove resolved containment. Prefer streams when data
can be processed incrementally; backpressure prevents fast producers from
overwhelming slow consumers.

Use cryptographic APIs for hashes, HMAC, secure randomness, and password
derivation according to their distinct contracts. A fast hash is not a
password storage strategy. Timing-safe comparison requires equal-length
buffers and does not fix a weak protocol.

## Common traps

- Blocking synchronous I/O in request paths.
- Missing stream `error` and cleanup paths.
- Building paths or URLs through interpolation.
- `Math.random` for secrets.
- Reading unlimited request/file content into memory.
- Process shutdown without closing owned resources.

## Optimized exercises

1. **Files:** implement atomic JSON configuration write using same-directory
   temporary file, flush/close as appropriate, and rename; test interrupted
   paths.
2. **Streams:** count lines/bytes in a large stream with a transform, bounded
   memory, error propagation, and abort cleanup.
3. **Application:** add or review RelayDesk request IDs, secure token creation,
   path/URL parsing, and graceful shutdown using Node APIs directly.

## Exit gate

For one Node resource, explain creation, normal completion, error, cancellation,
cleanup, and shutdown ownership.

More reps: `../../bootcamp/12-node-fundamentals/`.

