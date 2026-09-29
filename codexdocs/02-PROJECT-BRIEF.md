# RelayDesk project brief

RelayDesk is an internal support-ticket system used by requesters, support
agents, and administrators. It is deliberately ordinary: ordinary products
force the engineering concerns that interviews and real teams care about.

## Product problem

Teams currently handle support requests through chat messages. Requests are
lost, ownership is unclear, and nobody can answer how long work has been
waiting. RelayDesk makes requests searchable, assignable, auditable, and safe
for multiple users.

## Users and permissions

### Requester

- Creates tickets.
- Views and comments on tickets they created.
- Cannot see another requester's private tickets.

### Agent

- Views workspace tickets.
- Assigns tickets to themselves or another agent.
- Changes status and adds internal or public comments.

### Administrator

- Has agent capabilities.
- Manages users and roles.
- Views the audit history.

Authentication answers who the caller is. Authorization answers whether that
caller may perform this action on this resource. Implement and test them
separately.

## Core domain

- **User:** id, workspace id, email, display name, role, created time.
- **Ticket:** id, workspace id, requester id, assignee id, title,
  description, priority, status, version, created and updated times.
- **Comment:** id, ticket id, author id, visibility, body, created time.
- **Activity:** immutable record of who changed what and when.
- **Webhook delivery:** idempotency key, event, destination, attempt count,
  state, next attempt, and last error.

Recommended lifecycle:

```text
open -> in_progress -> resolved -> closed
  ^          |            |
  +----------+------------+  reopen
```

Represent transitions explicitly. Do not allow arbitrary strings to become a
status update.

## Primary user journey

1. A requester signs in and creates a ticket.
2. An agent sees it in a filtered, paginated queue.
3. The agent opens it, assigns it, and changes its status.
4. Requester and agent add public comments; agents may add internal comments.
5. Every meaningful change appears in an activity timeline.
6. Two simultaneous edits do not silently overwrite one another.

## Default technical shape

Use maintained versions selected during setup and commit the lockfile.

```text
relaydesk/
  apps/
    api/                 Node HTTP application
    web/                 React application
  packages/
    domain/              framework-free domain behavior
    contracts/           transport DTOs and shared schemas when justified
    test-support/        builders and controlled fakes
  db/
    migrations/
    seeds/
  docs/
    decisions/
    runbooks/
  package.json           workspace scripts
  README.md
```

Default technology choices:

- strict TypeScript everywhere;
- Node plus one mainstream HTTP framework;
- React with a lightweight development build tool;
- PostgreSQL or another relational database with real migrations;
- Vitest or an equivalent fast test runner;
- React Testing Library for component behavior;
- one browser-level end-to-end tool;
- structured JSON logging;
- automated formatting, linting, typechecking, tests, and build in CI.

The framework is replaceable. Record why you selected it in an ADR. Do not
spend more than 90 minutes comparing libraries.

## API contract

Initial endpoints:

```text
GET    /health
POST   /sessions
DELETE /sessions/current
POST   /tickets
GET    /tickets?status=&assigneeId=&cursor=&limit=&query=
GET    /tickets/:ticketId
PATCH  /tickets/:ticketId
POST   /tickets/:ticketId/comments
GET    /tickets/:ticketId/activity
POST   /tickets/:ticketId/assignments
```

Use one stable error envelope:

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket was not found",
    "details": {},
    "requestId": "..."
  }
}
```

Do not leak internal exception text. Logs may contain diagnostic context but
must not contain passwords, session tokens, or full sensitive payloads.

## Required UI states

Every remote-data screen must deliberately handle:

- initial loading;
- content;
- empty result;
- validation failure;
- permission failure;
- server or network error;
- retry;
- stale response;
- conflicting update.

The required screens are sign-in, ticket queue, create ticket, ticket detail,
and an administrator user list. Use semantic HTML, keyboard-accessible
controls, visible focus, labels, and useful error text.

## Non-functional requirements

- Every request has a request ID propagated into logs and error responses.
- List endpoints have bounded page size and deterministic ordering.
- Mutating endpoints validate content type, body shape, permissions, and
  expected record version.
- Database writes that represent one business action are atomic.
- Outbound calls have a timeout and explicit retry policy.
- Replayed mutation requests do not duplicate effects where idempotency is
  required.
- Shutdown stops accepting work and closes resources.
- The application can be set up from an empty machine using documented steps.

## Definition of done for every ticket

- Acceptance criteria are met and assumptions are recorded.
- Types, runtime validation, and error behavior agree.
- The riskiest behavior is covered at the correct test boundary.
- No unrelated refactor is hidden in the diff.
- Formatting, lint, typecheck, tests, and build pass.
- Logs contain enough context to investigate failure without exposing secrets.
- User-visible changes are accessible and include all relevant states.
- Documentation or an ADR changed when the operating contract changed.
- The author can demo and explain the change without AI assistance.

## Scope control

Do not add chat, attachments, billing, AI summarization, or real-time sockets
until the graduation gate is met. A smaller reliable system is better evidence
than a wide unfinished one.

