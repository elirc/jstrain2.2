# Architecture

```mermaid
flowchart LR
  Browser[React/Vite web] -->|validated JSON + demo identity| API[Express API]
  API --> Contracts[Zod contracts]
  API --> Domain[Pure domain rules]
  API --> Repo[Scheduling repository/service]
  Repo -->|BEGIN IMMEDIATE| DB[(SQLite WAL)]
  Worker[Reminder/expiry worker] --> DB
  Worker --> Mail[Deterministic email adapter]
```

The API authenticates first and derives `organization_id` from the stored user. Handlers validate input, authorize an action, and call named scheduling commands. Domain code owns state, permission, interval, and local-time rules. SQL owns foreign keys, checks, unique idempotency keys, indexes, and atomic writes. The worker shares database access but does not import the HTTP application.

Correlation IDs cross the HTTP boundary. Error envelopes are `{ "error": { "code", "message", "correlationId" } }`; internal errors do not disclose details. SIGTERM stops new HTTP work and closes SQLite after the server drains.
