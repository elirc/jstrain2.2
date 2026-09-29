# Knowledge check

Answer before opening the source. Then cite the exact function, query, or test that supports your answer.

## Questions

1. Why is `req.body as TaskCreateInput` not runtime validation?
2. Why can a client-selected organization header be safe in one design and unsafe in another?
3. What is the difference between authentication, role authorization, and resource authorization?
4. Why are both a stock movement table and a stock-level table useful?
5. Which mechanism prevents a lost task edit, and which prevents two tasks entering the final WIP position?
6. Why does a duplicate shipment need a durable idempotency record?
7. Write the half-open overlap predicate for intervals A and B.
8. Why does signing a scheduling slot not make it bookable forever?
9. What should happen to the original appointment when rescheduling conflicts?
10. Why is `Promise.all` alone not proof of a deterministic race test?
11. What is the difference between liveness and readiness?
12. Why should reminder delivery failure not update appointment state?
13. Where should arbitrary sort input be converted into SQL?
14. What does a correlation ID help diagnose?
15. Name one current SQLite assumption that changes for a multi-host deployment.

## Scenario questions

### Inventory

A receipt request times out, but the database committed. The client retries. Explain every durable record consulted or returned and what test should reject double stock.

### Project management

A guest switches from Acme to Globex while an Acme board request is in flight. Explain the server and client defenses separately.

### Scheduling

Two customers receive the same signed slot. Explain why that is allowed, then trace how only one hold succeeds.

## Answer key

1. A TypeScript assertion emits no runtime check; Zod parsing rejects actual external values.
2. It is safe only when joined to the authenticated user’s active membership; trusting the header alone grants tenant authority.
3. Identity resolves who, role grants a coarse action, and resource authorization proves access to the exact tenant/project/record.
4. Movements preserve explanation/history; the level is an efficient transactional current projection.
5. Expected version prevents lost edit; transactional serialization plus WIP reread/check prevents capacity overflow.
6. The retry can arrive after commit or restart, so memory cannot prove the command already applied.
7. `A.start < B.end && B.start < A.end`.
8. Signature proves no tampering, not that time/resources remain available; confirmation must reread under transaction.
9. The new allocation fails and transaction rolls back; the original remains unchanged.
10. Scheduling two promises creates pressure but does not force a known interleaving or database boundary.
11. Liveness indicates process responsiveness; readiness indicates it can safely receive work with dependencies available.
12. Delivery is a secondary side effect; appointment truth must not depend on an email adapter.
13. Parse an allowlisted enum, map it server-side to known SQL fragments, and parameterize values.
14. It ties a user-visible failure to request logs across boundaries without exposing internal errors.
15. SQLite’s single-file writer serialization must become explicit PostgreSQL row/advisory/exclusion locking plus new race tests.

Scenario answers should cite inventory `idem`/receipt concurrency tests, project `authenticate`/guest predicates/client generation test, and scheduling `decodeSlot`/`createHold`/last-slot test.
