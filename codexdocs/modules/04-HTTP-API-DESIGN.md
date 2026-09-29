# Module 04 — HTTP API design

Pair with: RelayDesk increments 2–3.

## Why this matters

An API is a long-lived contract between independently changing systems. Route
handlers are easy; consistent semantics for errors, identity, pagination,
concurrency, compatibility, and observability are the engineering work.

## Follow one request through the system

Use a visible pipeline:

```text
socket -> request limits -> request ID -> authentication -> parsing
       -> authorization -> service/domain -> repository
       -> response mapping -> error boundary -> access log
```

Middleware order is behavior. Authentication must precede policy that needs an
identity. Error handling must wrap work whose exceptions it converts. Request
limits must apply before unbounded body buffering.

## Parse transport into commands

Route parameters, query strings, headers, and JSON begin as transport data.
Parse once into domain commands. Do not pass a request object deep into
business logic; it smuggles framework state and unvalidated values into every
layer.

## Status codes and errors are part of the contract

Choose responses based on caller action:

- malformed or invalid request;
- missing or invalid authentication;
- authenticated but forbidden action;
- resource not found;
- state or version conflict;
- rate/size limit;
- unexpected service failure.

Avoid encoding all failure as 200 or leaking exception messages. Stable error
codes are for programmatic handling; messages are for humans; request IDs join
client reports to logs.

## Pagination requires stable order

A cursor is meaningful only relative to a deterministic ordering. If tickets
sort by creation time, include a unique tiebreaker such as ID. A cursor should
encode the last ordered values, be validated, and remain opaque to clients.

## Common failure patterns

- Parsing JSON without content-type or size limits.
- Trusting IDs or owner fields from the body.
- Catching every error inside every route.
- Returning persistence objects directly.
- Offset pagination on a changing/high-volume list.
- Filtering data after serialization.
- Logging credentials, tokens, or entire bodies.
- Treating CORS as authorization.

## Exercise 1 — pipeline ordering (core)

Given middleware for request ID, body limit, authentication, authorization,
logging, CORS, route matching, and error handling, choose and justify an order.

Constraints:

- Consider unmatched routes, malformed bodies, unauthorized requests, and
  thrown errors.
- State which middleware wraps which later work.
- Identify data unavailable at each step.

Proof: pipeline diagram plus four request traces.

Debrief: why is there no universal order independent of middleware behavior?

AI level: 0.

## Exercise 2 — error mapping table (core)

Design RelayDesk error codes and HTTP mappings for validation, bad cursor,
unauthenticated, forbidden, missing ticket, illegal transition, stale version,
rate limit, database unavailable, and unexpected failure.

Constraints:

- Client messages contain no internal error text.
- Log severity and context are specified separately.
- Every response contains a request ID.
- Decide whether forbidden resources should sometimes appear not found.

Proof: mapping table and integration tests for at least six rows.

Debrief: which distinctions help clients recover, and which leak information?

AI level: 1.

## Exercise 3 — bounded JSON reader (applied)

Implement or configure request-body handling with content-type validation,
byte limit, malformed JSON handling, and cancellation.

Constraints:

- Missing body, empty body, wrong charset/content type, oversized body,
  malformed JSON, and valid primitives receive deliberate behavior.
- A declared content length is not blindly trusted.
- Error responses remain valid if reading fails midway.

Proof: HTTP tests using a real server boundary.

Debrief: which attacks or outages happen before domain validation sees a
value?

AI level: 2 after writing cases.

## Exercise 4 — keyset paginator (applied)

Create an opaque cursor for descending `(createdAt, id)` order and build the
next-page predicate.

Constraints:

- Tied timestamps work.
- Invalid/tampered cursors fail safely.
- Limits are bounded.
- Inserting a newer item between requests does not duplicate old items.

Proof: property or table tests over multiple pages plus repository integration
tests.

Debrief: what consistency does keyset pagination provide, and what does it not
promise while data changes?

AI level: 1.

## Exercise 5 — PATCH semantics review (review)

Review three implementations: truthiness-based updates, object spread into the
entity, and explicit field handling. Identify bugs involving `null`, empty
strings, false/zero values, unknown keys, and server-owned fields.

Constraints:

- Write one failing test per bug class before selecting a design.
- Preserve absent-versus-explicit-null semantics.
- Include optimistic version handling.

Proof: review notes and a safe mapper/handler.

Debrief: when is PUT simpler than PATCH, and why might the product still need
PATCH?

AI level: 2, review only.

## Exercise 6 — API evolution (review)

Requirement change: priority gains an `urgent` value and ticket detail gains a
new optional SLA object. Plan server and client rollout across independently
deployed versions.

Constraints:

- Consider old clients, old stored records, validation, shared TypeScript
  packages, and exhaustive switches.
- Avoid a synchronized “deploy everything at once” assumption.
- Include monitoring and rollback.

Proof: compatibility matrix, rollout steps, and one contract test.

Debrief: when can sharing types between client and server create false
confidence?

AI level: 2 after your first plan.

## Project transfer

Use these decisions in RD-201–303. Require each endpoint PR to show its
transport contract, domain command, error mappings, and integration evidence.

