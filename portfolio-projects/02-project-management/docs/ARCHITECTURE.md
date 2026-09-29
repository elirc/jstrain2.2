# Architecture

```mermaid
flowchart LR
  U[Keyboard / pointer user] --> W[React web :5202]
  W -->|Bearer + selected org| A[Node HTTP API :4202]
  A --> V[Zod contracts]
  V --> R[Tenant-scoped repository]
  R --> D[(SQLite + migrations)]
  R --> X[Pure domain policies]
  D --> Q[Durable jobs / webhook attempts]
  K[Worker process] --> Q
  K --> S[Scan simulator]
  K --> H[HMAC webhook adapter]
```

Dependency direction is UI/API adapters → contracts/domain → repository → SQLite. Tenant identity is established at the API boundary by joining the hashed session token to an active membership for the selected organization. The repository repeats organization predicates; guests additionally require a project grant. Errors are translated once at the HTTP boundary.

Task movement starts `BEGIN IMMEDIATE`, re-reads tenant-owned task/column state, verifies version, counts active destination tasks, calculates a sparse rank, updates the task, appends activity, stores the idempotent result, and commits. No observer can see a partial move. SQLite write serialization makes WIP races deterministic on one host.

## Entity relationships

```mermaid
erDiagram
  ORGANIZATION ||--o{ MEMBERSHIP : has
  USER ||--o{ MEMBERSHIP : joins
  ORGANIZATION ||--o{ PROJECT : owns
  PROJECT ||--o{ PROJECT_MEMBER : grants
  USER ||--o{ PROJECT_MEMBER : receives
  PROJECT ||--o{ BOARD : contains
  BOARD ||--o{ COLUMN : orders
  COLUMN ||--o{ TASK : holds
  TASK ||--o{ COMMENT : discusses
  TASK ||--o{ ATTACHMENT : has
  TASK }o--o{ USER : assigned
  TASK }o--o{ LABEL : tagged
  PROJECT ||--o{ SAVED_VIEW : exposes
  ORGANIZATION ||--o{ ACTIVITY : audits
  ACTIVITY ||--o{ NOTIFICATION : fans_out
  ACTIVITY ||--o{ WEBHOOK_DELIVERY : emits
```

All tenant-owned records either store `org_id` directly or are accessed through an organization-scoped parent. Foreign keys, checks, unique scopes, and transactions reinforce application policy. SQLite cannot express cross-table tenant equality as a normal foreign key; repository contract tests therefore remain mandatory.
