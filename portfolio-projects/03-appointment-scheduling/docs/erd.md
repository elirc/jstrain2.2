# Entity relationship diagram

```mermaid
erDiagram
  ORGANIZATION ||--o{ LOCATION : owns
  ORGANIZATION ||--o{ USER : has
  ORGANIZATION ||--o{ SERVICE : offers
  LOCATION ||--o{ STAFF : hosts
  LOCATION ||--o{ RESOURCE : contains
  STAFF }o--o{ SERVICE : qualified
  STAFF ||--o{ AVAILABILITY_RULE : publishes
  USER ||--o{ APPOINTMENT : customer
  SERVICE ||--o{ APPOINTMENT : snapshots-price
  STAFF ||--o{ APPOINTMENT : allocated
  RESOURCE ||--o{ APPOINTMENT : allocated
  APPOINTMENT ||--o{ APPOINTMENT_HISTORY : audits
  APPOINTMENT ||--o{ REMINDER : schedules
  USER ||--o{ HOLD : claims
  USER ||--o{ WAITLIST : requests
```

Foreign keys prevent orphaned core records. Checks bound duration, price, capacity, roles, and states. Organization-scoped unique keys deduplicate holds and bookings. Interval indexes accelerate overlap checks; the repository serializes the check/write transaction.
