# TypeScript application portfolio

Three independent TypeScript, Node, React, and SQL release candidates built from the specifications in `codexdocs/crud-projects`. Each folder owns its dependencies, lockfile, database, ports, documentation, and runtime processes; there are no runtime dependencies between projects. See the [execution plan](./EXECUTION-PLAN.md) and the evidence-level [increment tracker](./PROGRESS.md).

New engineers should begin with the [intern-to-mid-level learning path](./learning-path/README.md), which teaches these codebases through visual diagrams, conceptual models, concrete code tours, hands-on labs, debugging drills, Socratic prompts, quizzes, and teach-back exercises.

## Release dashboard

| Project | Status | Web / API | Verification | Next increment |
| --- | --- | --- | --- | --- |
| [Inventory and orders](./01-inventory-orders/) | Verified local RC; advanced ERP gaps documented | 3011 / 4011 | strict types, lint, 9 files / 14 tests, build, reset/seed, API and worker startup/shutdown | PostgreSQL locking, staged transfers, cycle counts, job-backed CSV |
| [Project management](./02-project-management/) | Verified local RC; several secondary mutations remain schema/API-first | 5202 / 4202 | strict types, lint, 8 files / 17 tests, build, reset/migrate/seed, API and worker startup/shutdown | complete labels/assignment/invitation/notification UI and PostgreSQL locks |
| [Appointment scheduling](./03-appointment-scheduling/) | Verified local RC; availability exceptions and richer operator UI are partial | 5303 / 4303 | strict types, lint, 7 files / 18 tests, build, reset/seed, API and worker startup/shutdown | apply exceptions/opening rules, capacity resources, wait-list acceptance |

## Commands

Run commands from the selected project directory. All projects support `npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, focused unit/integration/smoke commands, migration/reset/seed commands, `npm run build`, `npm start`, and `npm run start:worker`. Exact command names are in each project README:

- [Inventory commands](./01-inventory-orders/README.md#commands)
- [Project-management commands](./02-project-management/README.md#commands)
- [Scheduling commands](./03-appointment-scheduling/README.md#commands)

## Demo identities

| Project | Demo credentials |
| --- | --- |
| Inventory | `admin@example.com`, `catalog@example.com`, `sales@example.com`, or `viewer@example.com`; password `demo-password` |
| Project management | Bearer tokens `demo-owner-acme`, `demo-guest-acme`, and `demo-owner-globex` |
| Scheduling | `Bearer demo:<user>:<role>`; identities include `admin-1:admin`, `scheduler-1:scheduler`, `provider-1:provider`, `reception-1:reception`, and `customer-1:customer` |

These credentials are intentionally local-only demonstrations, not production authentication.

## Major evidence

- Inventory proves immutable ledger/projection consistency, atomic reservation, durable idempotency, last-unit exclusion, and receipt rollback. See its [architecture](./01-inventory-orders/docs/architecture.md), [ERD](./01-inventory-orders/docs/erd.md), [ADRs](./01-inventory-orders/docs/adr/), [threat model](./01-inventory-orders/docs/threat-model.md), and [runbooks](./01-inventory-orders/docs/runbooks/).
- Project management proves server-derived tenant/project access, WIP-limited versioned moves, stable ranks, stale-organization cache rejection, scan jobs, and signed webhook simulation. See its [architecture and ERD](./02-project-management/docs/ARCHITECTURE.md), [ADRs](./02-project-management/docs/adr/), [threat model](./02-project-management/docs/THREAT-MODEL.md), and [runbooks](./02-project-management/docs/runbooks/).
- Scheduling proves DST gap/repeated-time rules, signed server-revalidated slots, last-slot exclusion, idempotent holds/confirmation, and atomic reschedule rollback. See its [architecture](./03-appointment-scheduling/docs/architecture.md), [ERD](./03-appointment-scheduling/docs/erd.md), [ADRs](./03-appointment-scheduling/docs/adr/), [threat model](./03-appointment-scheduling/docs/threat-model.md), and [runbooks](./03-appointment-scheduling/docs/runbooks/).

## Shared limitations

These are portfolio-scale single-host systems. SQLite is intentionally isolated behind repositories, but multi-host writes require PostgreSQL-specific locking/exclusion designs and new database integration tests. Outbound email, storage, scanning, notifications, and webhooks are deterministic local adapters. Authentication is demo-only. The smoke suites exercise real HTTP listeners, but there is no browser-driver screenshot suite or deployed load environment. Project-specific omissions are listed in each README and tracked as partial rather than complete in [PROGRESS.md](./PROGRESS.md).
