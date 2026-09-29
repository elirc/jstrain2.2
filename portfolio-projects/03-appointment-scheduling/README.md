# Northstar appointment scheduling

An independently runnable TypeScript/Node/React/SQLite scheduling system focused on future civil-time correctness and exclusive resource allocation. It includes customer booking, an operator-oriented appointment API/calendar, recurring availability, holds, lifecycle commands, atomic rescheduling, wait-list intake, private-safe iCalendar export, reports, reminders, and an independently runnable worker.

## Quick start

Requirements: Node 22+ and npm 10+.

```bash
npm install
npm run db:reset
npm run dev
```

Open `http://localhost:5303`; API is `http://localhost:4303`. Development auth is deliberately local-only: `Bearer demo:<user>:<role>`. Demo identities are `admin-1:admin`, `scheduler-1:scheduler`, `provider-1:provider`, `reception-1:reception`, `customer-1:customer`, and `customer-2:customer`. All seeded users belong to `org-1`.

## Commands

| Goal | Command |
| --- | --- |
| API/web/worker development | `npm run dev` |
| Migrate / seed / clean reset | `npm run migrate` / `npm run seed` / `npm run db:reset` |
| Lint / strict types | `npm run lint` / `npm run typecheck` |
| Unit / integration / React / smoke | `npm run test:unit` / `npm run test:integration` / `npm run test:react` / `npm run test:e2e` |
| Everything / production | `npm run check` / `npm run build && npm start` |
| Production worker | `npm run start:worker` |

## Correctness model

Intervals are half-open `[start,end)`. Service buffers expand the allocation interval, while customer-facing start/end remain unchanged. Signed slot tokens carry candidates, never authority: the server rechecks allocation inside an immediate SQLite transaction. Holds last five minutes. Confirmation and holds use separate organization-scoped idempotency keys. Rescheduling checks and writes in one transaction, so a conflict never releases the original. Appointment state updates use an expected version.

Instants are stored as UTC ISO strings and each appointment retains an IANA display zone. Missing spring-forward local times are rejected; repeated fall-back times require the desired offset. Slot generation is bounded to 31 days and 200 results.

## Evidence and documentation

- [Architecture](docs/architecture.md), [ERD](docs/erd.md), [API examples](docs/api.md)
- [Threat model and authorization matrix](docs/threat-model.md)
- [Risk-based tests](docs/test-strategy.md), [performance investigation](docs/performance.md), [incident exercise](docs/incident-zone.md)
- ADRs: [SQLite transaction model](docs/adr/001-sqlite-allocation.md), [civil time](docs/adr/002-civil-time.md), [holds](docs/adr/003-holds.md)
- Runbooks: [deployment and rollback](docs/runbooks/deployment.md), [backup and restore](docs/runbooks/backup-restore.md), [booking incident](docs/runbooks/booking-conflicts.md)

## Honest limitations

This is a local portfolio release candidate, not a regulated production service. Demo bearer credentials are not suitable for deployment. SQLite coordinates a single-region process/file and has no PostgreSQL exclusion constraint; all writers must use this repository path. Resources are modeled exclusively even though capacity is stored. Availability supports weekly rules and schema-level exceptions, but the current slot generator does not yet apply added/closed exceptions or location opening rules. The UI delivers customer discovery/booking and read-only operator concepts; full admin CRUD, drag calendar, reschedule/cancel controls, wait-list offer acceptance, provider notes separation, external calendar synchronization, quiet hours, and richer analytics remain API/domain increments. Reminder delivery is simulated. There is no screenshot automation or browser E2E suite; HTTP smoke is the current wiring test.

Scale assumption: one organization, fewer than 100 resources, 50k appointments, and at most tens of booking attempts per second on one database host. Move to PostgreSQL before multi-host writes.
