# Portfolio increment evidence

Status meanings: **verified core** passed the local release gate for the implemented scope; **partial** has working evidence but intentionally does not claim the complete specification; **planned** has no completion claim. Verification was performed on Node 22.16.0 and npm 10.9.2.

## 01 Inventory and orders

| Increment | Status | Evidence |
| ---: | --- | --- |
| 1 Workspace, identity, catalog | verified core | [migration](./01-inventory-orders/migrations/001_initial.sql), [API](./01-inventory-orders/apps/api/src/app.ts), [authorization test](./01-inventory-orders/tests/authorization.test.ts) |
| 2 Movements and stock | verified core | [domain service](./01-inventory-orders/apps/api/src/inventory.ts), [repository tests](./01-inventory-orders/tests/integration.test.ts) |
| 3 Purchasing and receipts | verified core | [receipt flow](./01-inventory-orders/apps/api/src/inventory.ts), [rollback test](./01-inventory-orders/tests/rollback.test.ts) |
| 4 Sales and reservation | verified core | [last-unit and idempotency tests](./01-inventory-orders/tests/concurrency.test.ts) |
| 5 Shipment and cancellation | verified core | [integration tests](./01-inventory-orders/tests/integration.test.ts) |
| 6 Transfers, returns, counts | partial | Transfers and returns implemented; cycle-count approval remains in [limitations](./01-inventory-orders/README.md#known-limitations-and-scale-assumptions) |
| 7 React workflows | verified core | [React console](./01-inventory-orders/apps/web/src/App.tsx), [component test](./01-inventory-orders/tests/react.test.tsx) |
| 8 Reports and CSV | partial | Low stock, ledger, bounded CSV work; async export and richer analytics remain documented |
| 9 Worker and reconciliation | verified core | [worker](./01-inventory-orders/apps/worker/src/index.ts), [worker test](./01-inventory-orders/tests/worker.test.ts) |
| 10 Security and operations | verified core | [threat model](./01-inventory-orders/docs/threat-model.md), [runbooks](./01-inventory-orders/docs/runbooks/) |
| 11 Ambiguous change request | planned | Backorders intentionally unsupported |
| 12 Release and incident | partial | Local RC and incident docs exist; deployed restore/demo evidence remains future work |

## 02 Project management

| Increment | Status | Evidence |
| ---: | --- | --- |
| 1 Organizations and membership | verified core | [schema](./02-project-management/migrations/001_initial.sql), [tenant tests](./02-project-management/tests/api.integration.test.ts) |
| 2 Projects and permissions | verified core | [authorization routes](./02-project-management/apps/api/src/app.ts), [API tests](./02-project-management/tests/api.integration.test.ts) |
| 3 Boards, columns, tasks | verified core | [repository](./02-project-management/apps/api/src/repository.ts), [React board](./02-project-management/apps/web/src/App.tsx) |
| 4 Ordering, moves, WIP | verified core | [move implementation](./02-project-management/apps/api/src/repository.ts), [concurrency tests](./02-project-management/tests/concurrency.test.ts) |
| 5 Assignment, labels, comments | partial | Comments/activity work; several label/assignment mutations remain documented |
| 6 Filters and saved views | partial | Bounded search and saved-view foundations work; complete filter-builder/export UI remains |
| 7 Optimistic conflicts | verified core | Version conflicts and [stale-cache test](./02-project-management/tests/cache-isolation.test.tsx) |
| 8 Attachments and notifications | partial | Metadata/scan and notification storage work; real objects and full notification UI remain |
| 9 Webhooks and jobs | verified core | [worker](./02-project-management/apps/worker/src/worker.ts), [worker tests](./02-project-management/tests/worker.integration.test.ts) |
| 10 Security and operations | verified core | [threat model](./02-project-management/docs/THREAT-MODEL.md), [runbooks](./02-project-management/docs/runbooks/) |
| 11 Maintenance request | planned | Custom fields/guest-restriction change not claimed |
| 12 Release and incident | partial | Local RC and incident/runbook material exist; deployed incident exercise remains |

## 03 Appointment scheduling

| Increment | Status | Evidence |
| ---: | --- | --- |
| 1 Locations, services, resources | partial | Seed/schema/API exist; complete admin CRUD UI remains documented |
| 2 Availability and exceptions | partial | Weekly rules and DST resolution work; exception/opening-rule application remains |
| 3 Slot search | verified core | [slot generator](./03-appointment-scheduling/apps/api/src/scheduling.ts), [DST tests](./03-appointment-scheduling/tests/dst.test.ts) |
| 4 Holds and booking | verified core | Signed/revalidated holds and [last-slot test](./03-appointment-scheduling/tests/concurrency.test.ts) |
| 5 Appointment lifecycle | verified core | [state model](./03-appointment-scheduling/packages/domain/src/index.ts), [integration tests](./03-appointment-scheduling/tests/integration.test.ts) |
| 6 Reschedule and cancellation | verified core | Atomic swap and preservation proof in [concurrency tests](./03-appointment-scheduling/tests/concurrency.test.ts) |
| 7 Customer/operator React | partial | Customer booking UI and [accessible component test](./03-appointment-scheduling/tests/react.test.tsx) exist; complete operator calendar/configuration UI remains |
| 8 Reminders and wait list | partial | Retry/dead-letter and intake work; offer acceptance remains |
| 9 Calendar and reports | partial | Privacy-safe ICS and utilization work; richer reporting/sync remains |
| 10 Security and operations | verified core | [threat model](./03-appointment-scheduling/docs/threat-model.md), [runbooks](./03-appointment-scheduling/docs/runbooks/) |
| 11 Maintenance change | planned | Group/variable-duration compatibility change not claimed |
| 12 Release incident | partial | Local RC and [zone incident exercise](./03-appointment-scheduling/docs/incident-zone.md); deployed repair drill remains |
