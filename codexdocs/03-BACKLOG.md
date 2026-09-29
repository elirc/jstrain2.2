# RelayDesk backlog

Complete increments in order. Within an increment, create one branch and
reviewable diff per ticket unless a ticket explicitly says otherwise.

Do not read future acceptance criteria until the current increment is merged.
Changing requirements are part of the course.

## Increment 1 — engineering baseline

### RD-101 — Create the workspace

Set up `apps/api`, `apps/web`, `packages/domain`, `packages/contracts`, and
`packages/test-support`. Add root scripts for format, lint, typecheck, test,
build, and a combined check.

Acceptance:

- One install command works from a clean checkout.
- TypeScript strict mode is enabled; no `any` escape hatch is added globally.
- The root check fails if either application or a package fails.
- The lockfile and runtime-version declaration are committed.

Evidence: CI-like local check output and a setup section in the README.

### RD-102 — Record the initial architecture

Write an ADR choosing the HTTP framework, database access style, test runner,
and browser-test tool.

Acceptance:

- Context, decision, alternatives, consequences, and revisit signal exist.
- Each choice is connected to a project need, not popularity alone.
- Comparison work is timeboxed to 90 minutes.

Evidence: `docs/decisions/0001-initial-stack.md`.

### RD-103 — Model ticket transitions

Implement framework-free ticket status and transition rules in the domain
package.

Acceptance:

- Illegal status values cannot enter the model unchecked.
- Allowed and rejected transitions are explicit.
- The caller receives a useful domain failure for a rejected transition.
- Tests include the complete transition table, not only happy examples.

Evidence: unit tests and a five-minute explanation of why this is not an HTTP
concern.

## Increment 2 — first vertical API slice

### RD-201 — Health and readiness endpoints

Add liveness and readiness endpoints. Readiness must reflect database
availability; liveness must not fail merely because a dependency is down.

Acceptance:

- Endpoints have distinct semantics and tests.
- Responses include a service version without exposing environment secrets.
- Shutdown closes the server and database connection cleanly.

### RD-202 — Create a ticket

Implement `POST /tickets` through route, parser, service, repository, and
response mapping layers. An in-memory repository is sufficient in this
increment.

Acceptance:

- The body begins as `unknown` and is parsed at the boundary.
- Whitespace-only title and description are rejected.
- Server-owned fields cannot be mass-assigned.
- Success uses an intentional status code and location identifier.

Evidence: service unit test, HTTP integration test, and request/response
example.

### RD-203 — Stable errors and request IDs

Add a central error boundary and the error envelope from the brief.

Acceptance:

- Validation, domain, not-found, and unexpected failures map deliberately.
- Unexpected internal messages and stacks never reach the client.
- Request ID appears in response headers, error envelopes, and logs.
- A thrown non-`Error` value still produces a safe response.

## Increment 3 — useful ticket API

### RD-301 — List with keyset pagination

Implement `GET /tickets` with `status`, `assigneeId`, `query`, `cursor`, and
bounded `limit` parameters.

Acceptance:

- Ordering is deterministic when timestamps tie.
- Invalid filters and cursors receive diagnostics.
- The next cursor is opaque to the client.
- Page boundaries neither duplicate nor skip records.

### RD-302 — Ticket detail

Implement `GET /tickets/:ticketId` with requester, assignee, and comment
summary information.

Acceptance:

- Malformed and absent IDs are different failures when useful.
- Repository absence becomes a domain not-found result.
- Transport DTOs do not leak repository records.

### RD-303 — Update with optimistic concurrency

Implement `PATCH /tickets/:ticketId` using an expected version.

Acceptance:

- Missing fields mean unchanged; explicitly nullable fields behave according
  to the contract.
- Stale versions return a conflict rather than silently overwriting.
- Status transitions pass through domain rules.
- Empty patches are intentionally accepted or rejected and documented.

## Increment 4 — relational persistence

### RD-401 — Establish migrations

Create users, tickets, comments, activity, and migration-history tables.

Acceptance:

- A blank database reaches the current schema automatically.
- Applying migrations twice is safe.
- Migration execution is transactional where supported.
- A failed migration does not claim success.

### RD-402 — Replace the in-memory repository

Implement the repository contract with parameterized SQL.

Acceptance:

- Existing service tests run unchanged against the in-memory fake.
- Repository integration tests use a real test database.
- All user-controlled values are parameters, never SQL fragments.
- List queries avoid N+1 behavior.

### RD-403 — Atomic comment and activity write

Adding a comment must also append an activity record as one business action.

Acceptance:

- Both writes commit or neither does.
- A forced second-write failure proves rollback.
- Transaction ownership is clear and does not leak across requests.

### RD-404 — Seed realistic data

Add deterministic development seed data spanning users, roles, statuses,
timestamps, and empty states.

Acceptance:

- Seeds are safe to rerun.
- No production credential or personal data appears.
- Tests do not depend on mutable development seeds.

## Increment 5 — React product surface

### RD-501 — Application shell and routing

Build accessible navigation and routes for queue, create, and detail screens.

Acceptance:

- Each page has a useful title and heading structure.
- Unknown routes have a navigable not-found view.
- Keyboard focus is visible and navigation works without a mouse.

### RD-502 — Ticket queue

Render paginated tickets with status, priority, requester, assignee, and age.

Acceptance:

- Loading, content, empty, and error states are distinct.
- Filters are reflected in the URL.
- Links preserve expected navigation behavior.
- Tests query by role, label, and visible meaning.

### RD-503 — Create-ticket form

Build a controlled, accessible form backed by the real API.

Acceptance:

- Client feedback helps but does not replace server validation.
- Server field errors map to the relevant controls.
- Double submission does not create duplicate tickets.
- Successful creation navigates to the new ticket.

## Increment 6 — state, races, and conflicts

### RD-601 — Ticket detail and comments

Render ticket metadata, comments, and activity. Add a public comment flow.

Acceptance:

- Empty comments are rejected client and server side.
- Refreshing the route reconstructs the screen from server state.
- Comment order is deterministic and semantic markup is used.

### RD-602 — Assignment and status updates

Add agent controls for assignment and lifecycle transitions.

Acceptance:

- UI choices reflect domain rules but the server remains authoritative.
- Pending controls communicate their state.
- Failure restores or reconciles optimistic state honestly.

### RD-603 — Stale-response protection

Rapidly changing filters must not display an older response after a newer one.

Acceptance:

- A deterministic test resolves requests out of order.
- Superseded work is ignored or cancelled.
- The implementation does not suppress legitimate errors from the active
  request.

### RD-604 — Conflict recovery

Show a useful UI when another user changed a ticket first.

Acceptance:

- The user's unsaved intent is not silently discarded.
- The screen can reload current server state.
- The conflict path is covered by an integration or component test.

## Increment 7 — identity and authorization

### RD-701 — Sessions

Implement sign-in and sign-out with securely managed sessions.

Acceptance:

- Passwords are hashed using a suitable password-hashing function.
- Session identifiers are unpredictable and protected in transport/storage.
- Error messages do not reveal whether an email exists.
- Sign-out invalidates the current session.

### RD-702 — Central authorization policy

Enforce requester, agent, and administrator permissions from the brief.

Acceptance:

- Policy logic is not duplicated across route handlers.
- Ownership checks use the requested resource, not a client-supplied owner ID.
- Denied reads and writes have intentional status behavior.

Evidence: a role × resource × action authorization matrix with negative tests.

### RD-703 — Internal comments

Agents may add internal comments; requesters must never receive them.

Acceptance:

- Filtering occurs before transport serialization.
- Direct URL access cannot bypass it.
- Cache keys, if present, include the authorization context.
- Tests prove absence, not merely the presence of public comments.

### RD-704 — Security review

Threat-model the application and fix the three highest risks found.

Required review areas: injection, IDOR, mass assignment, XSS, CSRF or session
abuse, open redirects, secrets in logs, brute force, and dependency risk.

Evidence: threat model, fixes, regression tests, and residual risks.

## Increment 8 — integrations and reliability

### RD-801 — Outbound ticket webhook

Queue a webhook when a ticket is created or resolved.

Acceptance:

- The database business action and intent-to-deliver cannot drift silently.
- Delivery has a timeout and bounded response body handling.
- Logs identify the delivery without recording secrets.

### RD-802 — Retry policy

Retry transient failures using bounded exponential backoff with jitter.

Acceptance:

- Permanent client errors are not retried blindly.
- Retry timing is tested with an injected clock/scheduler.
- Maximum attempts and total time are bounded.

### RD-803 — Idempotent delivery

Repeated processing must not create duplicate logical deliveries.

Acceptance:

- Idempotency has a durable database constraint, not only an in-memory check.
- A concurrent test attempts the duplicate operation.
- The behavior after partial failure is documented.

## Increment 9 — testing and refactoring

### RD-901 — Test portfolio audit

Classify every existing test as unit, integration, contract, component, or
end-to-end. Remove duplicate confidence, not useful coverage.

Acceptance:

- Each critical risk has a test at the cheapest trustworthy boundary.
- Flaky real-time waits are removed.
- Failure messages identify behavior rather than implementation trivia.

### RD-902 — Extract a service boundary

Choose one large feature and refactor it into clear domain/service/repository
responsibilities.

Acceptance:

- A characterization test lands before structural change.
- Public behavior and API contract remain stable.
- The final diff reduces coupling or clarifies ownership measurably.

### RD-903 — Add one end-to-end golden path

Automate sign-in, ticket creation, assignment, comment, and resolution.

Acceptance:

- The test owns or isolates its data.
- Failures retain useful browser/API diagnostics.
- The suite remains small; do not reproduce every lower-level test.

## Increment 10 — changing requirements

Do not begin until Gate C is passed.

### RD-1001 — Priority-based SLA

New requirement: tickets have a due time based on priority. Existing tickets
must receive a correct due time without a long write lock.

Clarify before coding: SLA table, timezone semantics, priority changes,
resolved tickets, backfill strategy, and display behavior.

Evidence: written questions, migration plan, staged implementation, tests,
and rollback plan.

### RD-1002 — Bulk assignment

Agents need to assign up to 100 tickets in one action. Partial success is not
acceptable, and stale ticket versions must be reported usefully.

Acceptance:

- Authorization is checked for every resource.
- The operation is atomic.
- Duplicate IDs and stale versions are handled deliberately.
- UI communicates pending, success, conflict, and retry paths.

### RD-1003 — Reviewer-requested change

Ask AI or a human reviewer to identify one genuine maintainability problem.
Accept, modify, or reject the suggestion in writing. Implement it only if its
value exceeds its migration and regression risk.

## Increment 11 — operations and performance

### RD-1101 — Structured operational logs

Add consistent request, error, database, and webhook context.

Acceptance:

- Logs are structured and correlate by request/operation ID.
- Sensitive-field redaction uses an allowlist strategy where appropriate.
- Expected 4xx behavior is distinguishable from service failure.

### RD-1102 — Diagnose a slow queue

Generate enough data to make the ticket queue slow, measure it, and improve
the actual bottleneck.

Acceptance:

- Baseline and final measurements use the same scenario.
- Query plans or equivalent evidence support the diagnosis.
- Correctness and pagination tests remain green.
- The report distinguishes observed fact from inference.

### RD-1103 — Incident exercise

Use [07-TEAM-SIMULATION.md](07-TEAM-SIMULATION.md) to inject an incident.
Mitigate it, identify root cause, add a regression guard, and complete the
incident template.

## Increment 12 — release candidate

### RD-1201 — Production-shaped deployment

Deploy the API, web application, and database to an environment another
person can access.

Acceptance:

- Configuration comes from the environment and is validated at startup.
- Migrations are run through a documented, controlled step.
- Health checks, logs, rollback steps, and seed/demo credentials are clear.

### RD-1202 — Documentation handoff

Write the README for a new teammate.

Required: purpose, architecture, prerequisites, setup, scripts, tests,
configuration, migrations, deployment, troubleshooting, and known tradeoffs.

### RD-1203 — Final adversarial review

Give an AI reviewer the brief, threat model, and diff—not your preferred
answer. Require correctness, security, concurrency, operability, and test-gap
findings with line-level evidence. Verify every claim yourself.

### RD-1204 — Demo and defense

Deliver a ten-minute demo and ten-minute architecture defense without AI or
notes beyond one diagram. Then score the complete project with
`06-ENGINEERING-RUBRIC.md` and create a remediation ticket for every category
below 2.

