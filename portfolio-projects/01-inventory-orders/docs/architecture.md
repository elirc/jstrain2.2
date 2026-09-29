# Architecture

```mermaid
flowchart LR
  User --> React[React operations console]
  React -->|JSON + bearer token| API[Express HTTP API]
  API --> Contracts[Zod contracts]
  API --> Domain[domain rules and commands]
  Domain --> Repo[transactional SQL repository]
  Repo --> SQLite[(SQLite ledger + projection)]
  Worker[reconciliation / notification worker] --> SQLite
  Worker --> Adapter[deterministic local adapter]
```

Dependencies point inward: contracts validate unknown boundary data; domain functions contain permissions/arithmetic/state rules; the API orchestrates SQL transactions. The worker is a separate process and shares only durable job/database contracts. Every protected repository statement includes the actor's trusted organization ID. Multi-write commands use one SQLite transaction; idempotency records commit with their effect.
