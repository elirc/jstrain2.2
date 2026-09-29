# Glossary and mental models

| Term | Plain-language meaning | Example here |
| --- | --- | --- |
| Aggregate | Data changed together under one business rule | order plus lines/reservations; appointment plus allocation/history |
| Audit event | Append-only account of a sensitive change | inventory adjustment actor/reason |
| Bounded input | Explicit limit on size/work | page size 100, slot range 31 days |
| Civil time | Human local date/time governed by a zone | 9 AM America/Los_Angeles |
| Compensating movement | New history entry correcting prior effect | negative/positive inventory adjustment |
| Conflict | Valid request cannot apply to current state | stale version, WIP full, slot taken |
| Correlation ID | Identifier connecting request logs/errors | `x-correlation-id` response header |
| Dead letter | Work that exhausted retry policy and needs attention | failed reminder/webhook job |
| Half-open interval | Includes start, excludes end | `[09:00,10:00)` permits a 10:00 start |
| Idempotency | Repeating the same command does not repeat its effect | duplicate receipt returns original response |
| Invariant | Condition that must always hold after commit | reserved never exceeds on-hand |
| Optimistic concurrency | Accept update only if version is still expected | task/appointment `version` |
| Projection | Efficient current view derived from history | `stock_levels` derived from movements |
| Resource authorization | Permission checked against exact target | guest grant for a project |
| Sparse rank | Ordered numeric positions with gaps | task ranks 1024, 2048, midpoint 1536 |
| Tenant | Organization boundary whose data must be isolated | Acme versus Globex |
| Transaction | Writes commit together or roll back together | receipt stock + movement + PO state |
| Runtime validation | Checking an actual external value during execution | Zod parsing `req.body` |
| WIP limit | Maximum active tasks in a workflow column | Doing column capacity 1 |

## Error taxonomy

| Category | Typical HTTP meaning | User action |
| --- | --- | --- |
| malformed/validation | 400/422 | correct fields |
| unauthenticated | 401 | sign in again |
| unavailable/forbidden | 403 or privacy-preserving 404 | request access or navigate away |
| missing | 404 | refresh/link may be stale |
| conflict | 409 | refresh, compare, retry intentionally |
| expired | 410 | acquire a new hold/offer |
| unexpected | 500 | retry if safe; use correlation ID for support |

## One-sentence checks

- TypeScript narrows developer code; parsers narrow runtime input.
- Identity tells who; authorization tells whether this action on this resource.
- Transactions protect atomicity; idempotency protects duplicate delivery.
- Versions expose lost updates; locks/serialization protect shared invariants.
- Signatures protect integrity; server rereads protect freshness.
- Tests are evidence about a risk, not decorations for a coverage number.
