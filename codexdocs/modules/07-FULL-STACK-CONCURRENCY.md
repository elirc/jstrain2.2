# Module 07 — Full-stack concurrency

Pair with: RelayDesk increments 6 and 8.

## Why this matters

Concurrency bugs cross layers. A React screen, API handler, service, and SQL
statement can each look correct alone while the complete interaction loses an
update or duplicates an effect.

The central question is not “is JavaScript single-threaded?” It is “what state
can change between my read and write, and which layer arbitrates the result?”

## Interleaving creates races without shared CPU threads

```text
request A reads version 4
request B reads version 4
request A writes assignment X, version 5
request B writes assignment Y, version 5
```

An `await` creates an opportunity for other work to change shared state. A
read-modify-write sequence needs a database condition, transaction/lock, or an
operation designed to be commutative/idempotent.

## Optimistic concurrency makes conflicts visible

Update with both identity and expected version:

```sql
UPDATE tickets
SET assignee_id = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

Zero affected rows is not automatically “not found.” The system may need to
distinguish absence from a stale version and return enough current state for a
human or client to recover.

## Idempotency addresses repeated attempts

Clients, proxies, queues, and operators retry. An idempotency key associates
repeated attempts with one logical operation and durable result. It needs
scope, retention, request-fingerprint rules, concurrency behavior, and an
answer for attempts that failed midway.

## UI race safety does not replace server consistency

Ignoring stale network responses protects rendering. It cannot stop two users
from overwriting the same database row. Optimistic UI improves perceived
latency. It cannot prove a write committed. Each layer owns a different race.

## Common failure patterns

- Process-local mutex used as cross-instance protection.
- Check-then-write separated by an `await`.
- Version read but not included in the update predicate.
- Retrying a mutation without idempotency.
- Idempotency record written after the side effect.
- Same key accepted with a different request body.
- UI discarding server conflict details.
- Tests that “run two promises” without forcing the dangerous interleaving.

## Exercise 1 — draw the interleaving (core)

For assignment, comment creation, webhook scheduling, and bulk updates, draw
two-request timelines that could violate an invariant.

Constraints:

- Mark every read, await/network boundary, write, constraint, and response.
- Name the invariant and authoritative layer.
- Include one case that is safe despite interleaving.

Proof: four timelines and prevention choices.

Debrief: which races are user conflicts rather than bugs to hide?

AI level: 0.

## Exercise 2 — deterministic lost update (core)

Implement a deliberately unsafe read-modify-write ticket assignment. Use
barriers/deferred promises to force two operations to read before either
writes.

Constraints:

- The test fails reliably, not probabilistically.
- Final state and both caller responses are asserted.
- The minimal fix uses an atomic/versioned database operation.

Proof: red test repeated many times, corrected SQL/service, green test.

Debrief: why would adding a JavaScript mutex be incomplete in a scaled
deployment?

AI level: 1.

## Exercise 3 — conflict contract (applied)

Design the HTTP and UI contract for a stale ticket update.

Constraints:

- Client sends expected version.
- Server distinguishes malformed request, missing ticket, and conflict.
- Conflict response supplies safe current information.
- UI preserves the user's attempted values and offers recovery.

Proof: API contract examples, integration test, and component test.

Debrief: when is automatic retry unsafe because the operation needs human
intent?

AI level: 2 after your contract exists.

## Exercise 4 — durable idempotency state machine (applied)

Model idempotent create-ticket requests as `processing`, `succeeded`, and
recoverable/failed states.

Constraints:

- Key scope includes caller/workspace as appropriate.
- Same key with a different normalized request is rejected.
- Concurrent first attempts yield one logical ticket.
- Successful response can be replayed.
- Stuck processing state has an explicit recovery policy.

Proof: state diagram, unique constraint, and concurrent integration tests.

Debrief: why is “cache the response by key” an incomplete specification?

AI level: 2 after the state diagram.

## Exercise 5 — outbox boundary (applied)

Write ticket state and a webhook-delivery intent atomically, then process the
intent outside the transaction.

Constraints:

- No network call occurs inside the database transaction.
- Worker claims are concurrency-safe.
- Crash after provider success but before local success recording is handled
  through provider idempotency or documented duplicate possibility.
- Poison deliveries do not block the queue forever.

Proof: forced-crash scenarios and eventual state assertions.

Debrief: what exactly-once claim can the system honestly make?

AI level: 2.

## Exercise 6 — race-focused review (review)

Review one full RelayDesk mutation from button click to committed data and
rendered response.

Trace:

- duplicate clicks;
- request retry;
- two different users;
- late response;
- database conflict;
- server crash before response;
- client navigation/unmount.

Proof: one sequence diagram, a list of owned/unowned races, and at least one
new regression test or explicit accepted risk.

Debrief: which layer had a race that was invisible when reviewed in isolation?

AI level: 2; require evidence for every AI claim.

## Project transfer

Apply to RD-303, RD-603–604, RD-802–803, and RD-1002. Do not call a flow
race-safe until UI, API, and database responsibilities are all named.

