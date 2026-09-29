# Worked engineering examples

These examples demonstrate reasoning on smaller problems. They are not
RelayDesk implementations to copy. Read the setup, predict the flaw or next
step, and only then read the walkthrough.

## 1 — Boundary parsing versus assertion

Suppose an HTTP body should contain a display name:

```ts
interface RenameUserBody {
  displayName: string;
}

const body = JSON.parse(raw) as RenameUserBody;
return renameUser(body.displayName.trim());
```

The assertion changes what TypeScript permits, not what JSON contains. Arrays,
null, numbers, missing fields, and hostile objects all cross the assertion
unchanged. Calling `.trim()` is the first accidental runtime validator, and
its failure becomes an unexpected server error rather than a field problem.

A boundary parser separates evidence from conversion:

```ts
type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; problems: Array<{ field: string; message: string }> };

function parseRenameUser(value: unknown): ParseResult<{ displayName: string }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, problems: [{ field: '', message: 'expected an object' }] };
  }

  const raw = value as Record<string, unknown>;
  if (typeof raw.displayName !== 'string' || raw.displayName.trim() === '') {
    return {
      ok: false,
      problems: [{ field: 'displayName', message: 'must be non-empty text' }],
    };
  }

  return { ok: true, value: { displayName: raw.displayName.trim() } };
}
```

The narrow `Record` assertion does not claim the field is valid; it only gives
key access after the object check. The field remains `unknown` until runtime
evidence narrows it.

Questions:

- Should unknown keys be dropped or rejected?
- What length and Unicode rules belong to the product?
- Is trimming a validation rule or data transformation?
- Which decisions must be shared with the React form, and which remain
  server-authoritative?

## 2 — Domain failure versus infrastructure exception

A ticket transition can fail because the transition is not allowed. That is
expected domain behavior. A database connection can fail unexpectedly. If
both become a generic thrown `Error('update failed')`, callers lose recovery
semantics and operators lose the cause.

```ts
type TransitionFailure =
  | { code: 'ILLEGAL_TRANSITION'; from: Status; to: Status }
  | { code: 'STALE_VERSION'; currentVersion: number };

type TransitionResult =
  | { ok: true; ticket: Ticket }
  | { ok: false; error: TransitionFailure };
```

The service can return an expected failure while wrapping unexpected
dependency failure with context:

```ts
try {
  return await repository.transition(command);
} catch (cause) {
  throw new Error(`could not transition ticket ${command.ticketId}`, { cause });
}
```

The HTTP layer maps domain codes to stable client errors. Its central error
boundary maps the exception to a safe 500 and logs the cause chain with the
request ID.

The important separation is not “results good, exceptions bad.” It is whether
the caller has an ordinary recovery branch and whether diagnostic context is
preserved.

## 3 — Async ownership

Consider an audit write launched after a response:

```ts
await saveTicket(ticket);
saveAudit(ticket);
return created(ticket);
```

Questions reveal the missing contract:

- Is the audit required for the business action to be considered successful?
- Who observes rejection?
- May shutdown interrupt it?
- May a retry duplicate it?
- Is its failure visible to operations?

Possible designs differ by answer:

- Same transaction if both are database state in one atomic action.
- Durable outbox intent if delivery is asynchronous but must survive crashes.
- Explicit best-effort task owned by a supervised worker if loss is accepted.
- Await before response if the caller must know the audit completed.

Adding `.catch(logger.error)` prevents an unhandled rejection but does not
resolve durability, ordering, shutdown, or duplicate semantics.

## 4 — Middleware order as behavior

Suppose middleware is registered in this order:

```text
route -> body parser -> authorization -> authentication -> error handler
```

Several contracts are impossible:

- Authorization lacks an authenticated identity.
- Error handling cannot catch earlier middleware if it is nested after it.
- Route selection may happen before request-wide logging/context exists.
- An attacker may force body buffering before cheap limits or rejection.

A more useful starting structure is:

```text
error boundary
  request ID and completion log
    coarse request/body limits
      CORS/security headers as applicable
        route match
          authentication
            authorization
              route-specific body parsing/validation
                handler/service
```

This is not a universal answer. A framework may match routes before user
middleware, CORS preflight may bypass authentication, and streaming routes may
need a different body policy. The engineering step is tracing representative
requests through the actual composition model.

Trace at least: health request, preflight, invalid JSON, unauthenticated write,
forbidden read, missing route, and unexpected exception.

## 5 — Stable keyset pagination

Ordering only by `created_at DESC` is insufficient because several rows can
share a timestamp. Add a unique tiebreaker:

```sql
ORDER BY created_at DESC, id DESC
```

After a page ending at `(last_created_at, last_id)`, the next page predicate
for descending order is conceptually:

```sql
WHERE created_at < $last_created_at
   OR (created_at = $last_created_at AND id < $last_id)
ORDER BY created_at DESC, id DESC
LIMIT $limit_plus_one
```

The cursor encodes both values and is validated when decoded. Requesting one
extra row reveals whether a next cursor exists.

Questions:

- Which filters must remain identical across pages?
- Should the cursor sign or authenticate its contents?
- What happens if the last item is deleted?
- What happens when a newer item is inserted?
- Does product behavior require a snapshot, or is stable forward traversal
  sufficient?

Keyset pagination avoids increasing offset work and common duplicate/skip
behavior, but it does not freeze a changing dataset.

## 6 — Optimistic concurrency across API and SQL

A client displays ticket version 7 and submits an assignment change. The API
parses both intent and expected version. The repository uses one conditional
write:

```sql
UPDATE tickets
SET assignee_id = $assignee_id,
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $ticket_id
  AND version = $expected_version;
```

If zero rows change, there are at least two hypotheses: the ticket is absent,
or it exists at another version. The repository/service contract decides
whether an additional read distinguishes them. The API maps stale state to a
conflict response containing safe current information.

The React client should not automatically overwrite the new server state. It
can show the user's attempted assignment, the current assignment, and actions
to reload or retry. Optimistic rendering needs a rollback/reconciliation path.

A useful integration test coordinates two updates with version 7. It asserts
one commits, one conflicts, final version becomes 8, and no caller reports
success for a lost write.

## 7 — React state ownership

Suppose a queue stores all of these:

```ts
const [tickets, setTickets] = useState<Ticket[]>([]);
const [query, setQuery] = useState('');
const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

useEffect(() => {
  setFilteredTickets(tickets.filter((ticket) => ticket.title.includes(query)));
}, [tickets, query]);
```

`filteredTickets` is derived from two sources and temporarily lags them by a
render/effect. It also creates a third update path and an extra render.

Derive it during render:

```ts
const filteredTickets = tickets.filter((ticket) =>
  ticket.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
);
```

Only add memoization if computation cost is measured or referential identity
is a contract with a memoized child. Memoization is not the fix for storing
redundant state.

The larger ownership questions are:

- Should query live in the URL so refresh/share/navigation preserve it?
- Should filtering occur on the server when data is paginated?
- Who owns cached server data and invalidation?
- Which transient state belongs only to one component?

## 8 — Authorization-blind cache

A cache keyed only by ticket ID is dangerous when the serialized view depends
on caller permissions:

```ts
const cached = cache.get(ticketId);
if (cached) return cached;

const response = serializeForCaller(ticket, caller);
cache.set(ticketId, response);
return response;
```

If an agent populates the cache with internal comments, a requester can receive
the agent representation. The route may run authorization correctly and still
leak data through cached output.

Options include:

- cache permission-independent domain data, then authorize/filter per caller;
- include the complete authorization representation in the key;
- use separate safe representations;
- avoid caching where correctness complexity exceeds measured value.

The strongest negative test has an agent request followed by a requester
request for the same ticket and proves internal fields are absent. Reversing
request order should also be tested.

## 9 — Choosing the test boundary

Requirement: adding a comment and activity entry is atomic.

A service test with a fake repository can prove the service requests one
transactional operation. It cannot prove the SQL implementation actually
rolls back after the first statement.

A repository integration test can:

1. start from known database state;
2. force the activity insert to fail;
3. invoke the real repository operation;
4. query comments and activity from a separate observation;
5. assert neither write exists;
6. prove the connection remains usable.

The service test is still valuable for orchestration. The integration test is
necessary for the database mechanism. These are complementary, not competing
tests.

Ask of every test: what incorrect implementation could pass this? The answer
reveals the boundary's limitations.

## 10 — Evidence-led incident reasoning

Symptom: P95 ticket-queue latency rose from 120 ms to 1.8 seconds.

Weak response:

```text
The table is large, so add Redis and more server instances.
```

Disciplined response:

```text
Observation: API P95 is 1.8 s for the queue route since 14:10.
Observation: CPU is 25%; DB active connections are near the pool limit.
Observation: each request emits 51 ticket-requester queries.
Hypothesis: an N+1 path saturates the connection pool.
Experiment: capture query count for one request with 50 results.
Result: one list query plus 50 requester queries.
Mitigation: temporarily reduce page limit if needed.
Fix: fetch/project requester information in bounded query shape.
Verification: same dataset, page size, and load; compare latency/query count.
```

Caching or scaling might eventually help, but neither addresses evidence that
one request performs 51 queries. The lesson is not always “fix N+1”; it is to
keep observations and hypotheses separate until an experiment changes belief.

## Using the examples

For each example, create one variation that changes the correct decision:

- external operation becomes optional;
- ordering changes from ascending to descending;
- dataset requires snapshot consistency;
- ticket representation becomes permission-independent;
- expected domain failure becomes an infrastructure outage.

Explaining why the answer changes is stronger evidence than memorizing the
original pattern.

