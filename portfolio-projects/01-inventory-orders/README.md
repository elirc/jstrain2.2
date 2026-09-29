# Inventory & Orders

A self-contained TypeScript, Node, React, and SQLite inventory operations application. It demonstrates the hard part of inventory software: an immutable movement ledger plus transactional balance projection, atomic reservations, durable idempotency, and organization-scoped authorization.

## Quick start

Requirements: Node 22+ and npm 10+.

```bash
npm install
npm run db:reset
npm run dev
# optional independent worker
npm run dev:worker
```

Web: http://localhost:3011. API: http://localhost:4011. All demo passwords are `demo-password`.

| Account | Role |
| --- | --- |
| admin@example.com | Administrator |
| catalog@example.com | Catalog manager |
| sales@example.com | Sales operator |
| viewer@example.com | Auditor/viewer |

## Commands

`npm run dev`, `dev:worker`, `typecheck`, `lint`, `test:unit`, `test:integration`, `test:react`, `test:e2e`, `db:migrate`, `db:reset`, `db:seed`, `build`, `start`, `start:worker`, `smoke`, and `verify` run from this directory. Production start expects the API already built and `DATABASE_PATH` configured. Configuration is runtime-validated; see `.env.example`.

## Implemented workflows

- Organization membership authentication with six action-specific roles; tenant context is derived from the signed-in membership tuple rather than request bodies.
- Searchable, sortable, bounded catalog; products, suppliers, warehouses; normalized tenant-unique SKUs.
- Stock availability projection (`available = on_hand - reserved`) protected by SQL constraints and immutable movement triggers.
- Draft/submit purchase orders and partial, idempotent receipt transactions.
- Price-snapshot sales orders with atomic all-lines reservation, partial idempotent shipment, and cancellation release.
- Idempotent adjustments, immediate traceable warehouse transfers, and shipment-bounded returns with restock/quarantine/discard dispositions.
- Running ledger, low-stock report, bounded deterministic CSV stock export, and bounded product CSV import with row-level outcomes.
- Correlation IDs, structured failure/start/stop logs, readiness/liveness, graceful API/worker shutdown.
- Independently runnable reconciliation/notification job loop with exponential bounded retry, dedupe, dead-letter state, and operator-visible database records.
- Responsive semantic React console covering catalog, stock, purchasing, sales, receiving, fulfillment, and reporting.

## Verification and evidence

The test suite includes domain state tables, real SQLite repository behavior, a real-socket API authorization test, React accessibility/role behavior, repeatable migration, worker retry/dead-letter behavior, receipt rollback after an injected mid-transaction failure, durable duplicate-delivery behavior, and a deterministic two-contender last-unit test. `npm run verify` is the release gate and `npm run smoke` checks a built-equivalent listening service.

See [architecture](docs/architecture.md), [ERD](docs/erd.md), [API](docs/api.md), [threat model](docs/threat-model.md), [test strategy](docs/test-strategy.md), [ADRs](docs/adr), and [runbooks](docs/runbooks).

## Known limitations and scale assumptions

This is a credible local release candidate, not a complete ERP. SQLite serializes writers and targets one API instance; move to PostgreSQL row locks before horizontal write scaling. Demo bearer tokens are reversible local credentials, with plaintext demo-only passwords; production requires hashed passwords, TLS, expiring signed/opaque sessions, CSRF policy, and rate limiting. Product variants, supplier-product editing, cycle-count approval, asynchronous large CSV jobs with rejection download, purchase over-receipt approval, staged in-transit transfers, UI list/detail pages for every aggregate, notification transport, webhook signature verification, valuation/lead-time/return analytics, screenshots, a real load run, and browser-driven three-path E2E automation remain future increments. CSV export is buffered and import is synchronous/bounded rather than a background streaming job. Return refund state is not modeled. Backorders are intentionally unsupported.

## Next increment

Move the transactional repositories to PostgreSQL using `SELECT … FOR UPDATE`, add multi-stage transfers and approved cycle counts, then add job-backed CSV import/export with downloadable row failures and measured memory bounds.
