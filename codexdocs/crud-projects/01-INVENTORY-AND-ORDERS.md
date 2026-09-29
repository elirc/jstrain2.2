# 01 — Inventory and order management

## Product objective

Build a multi-warehouse system that purchases products from suppliers, tracks
every stock movement, reserves inventory for customer orders, fulfills or
cancels orders, processes returns, and explains current and historical stock.
The central engineering challenge is preserving stock invariants when requests
fail, repeat, or run concurrently.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Administrator | Manage organization settings, users, roles, warehouses, and adjustments |
| Catalog manager | Manage products, variants, suppliers, costs, and reorder settings |
| Purchasing agent | Draft, submit, receive, and cancel purchase orders |
| Warehouse operator | Receive, transfer, pick, ship, return, and count stock |
| Sales operator | Create customer orders, reserve stock, cancel, and view fulfillment |
| Auditor/viewer | Read reports and immutable movement history; no mutation |

Permissions must be organization-scoped and action-specific. Adjustments and
retroactive corrections require a reason and an audit record.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization | Name, settings, users, warehouses; root tenant boundary |
| Product | SKU unique per organization, name, status, unit, reorder threshold |
| Product variant | Optional attributes and its own SKU; belongs to product |
| Supplier | Contact data, lead time, active status; many-to-many with products |
| Warehouse | Code unique per organization, address, active status |
| Stock level | Product/variant plus warehouse, on-hand, reserved, version |
| Stock movement | Immutable quantity delta, type, source reference, actor, timestamp |
| Purchase order | Supplier, destination, state, expected date, line items |
| Sales order | Customer snapshot, state, idempotency key, line items, totals |
| Reservation | Sales-order line, warehouse, quantity, active/released/consumed |
| Shipment | Order, tracking data, shipped lines, timestamp |
| Return | Original shipment lines, disposition, refund state |
| Cycle count | Expected and counted quantities plus approved adjustment |

Do not treat `stock_level` as the source of historical truth. Every change must
create an immutable movement; the balance is a transactional projection that
can be reconciled against movements.

## Required workflows

### Catalog and warehouse setup

- Create, edit, deactivate, search, filter, and paginate products and suppliers.
- Reject duplicate normalized SKUs and prevent deactivation while an unsafe
  active workflow depends on the record.
- Manage supplier-product relationships, cost, lead time, and supplier SKU.
- Create warehouses and prevent new work against inactive locations.

### Purchasing and receiving

- Draft a purchase order with multiple lines and editable quantities/costs.
- Submit only valid, nonempty drafts; assign an immutable human-readable number.
- Partially receive a purchase order across multiple receipts.
- A receipt transaction creates movements, increases on-hand stock, and updates
  received quantities exactly once.
- Reject over-receipt unless an authorized user explicitly approves it.
- Close or cancel remaining quantities while preserving history.

### Sales, reservation, and fulfillment

- Create a sales order from a price snapshot; later catalog changes must not
  rewrite historical order lines.
- Reserve stock atomically. `available = on_hand - reserved` cannot be negative.
- Support insufficient-stock rejection and an optional backorder state.
- Pick and ship partially. Shipping consumes reservations and decreases both
  on-hand and reserved quantities in one transaction.
- Cancellation releases only active unconsumed reservations.
- Duplicate create or shipment requests with the same idempotency key return
  the original result rather than applying twice.

### Transfers, adjustments, and returns

- Transfer between warehouses through requested, in-transit, received, and
  cancelled states; source and destination movements remain traceable.
- Require reason, actor, and optional evidence for adjustments.
- Process a return against shipped quantities only. Restock, quarantine, and
  discard dispositions have different movement effects.
- Run a cycle count, show variance, and require approval above a threshold.

### Reporting

- Current availability by warehouse, product, and variant.
- Movement ledger with running balance and source links.
- Low-stock and reorder suggestions based on thresholds and open purchase orders.
- Inventory valuation using a documented simple method such as weighted average.
- Order fulfillment time, supplier delivery variance, and return-rate summaries.
- CSV export must stream and preserve filter/sort metadata in a manifest.

## API and UI requirements

Provide resource routes for catalog, suppliers, warehouses, stock, purchase
orders, receipts, sales orders, reservations, shipments, returns, counts, and
reports. Model state transitions as named commands such as
`POST /purchase-orders/:id/submit`, not arbitrary status-field updates.

The React application needs:

- searchable, sortable, paginated catalog and stock tables;
- purchase and sales order editors with dynamic line items and accessible errors;
- warehouse stock detail with movement timeline and running balance;
- receiving and picking screens optimized for repeated keyboard entry;
- conflict UI when a stale version or insufficient stock invalidates an action;
- report filters encoded in the URL and export progress/failure feedback;
- role-aware navigation without relying on hidden controls for authorization.

## Critical rules and failure cases

- Quantities are positive integers in the product's smallest tracked unit.
- `on_hand >= 0`, `reserved >= 0`, and `reserved <= on_hand` unless the chosen
  backorder model explicitly separates unallocated demand.
- Movement records are append-only; corrections use compensating movements.
- State transitions are exhaustive and reject invalid previous states.
- Concurrent reservations for the final unit produce one success and one
  explicit conflict, never overselling.
- A timeout after commit may cause a retry; durable idempotency prevents double
  receiving, shipment, transfer, and adjustment.
- Reports use stable ordering and do not multiply aggregates through joins.

## Background work and integrations

- Low-stock notification job with deduplication and configurable quiet period.
- Large import/export jobs with row-level outcomes, progress, cancellation, and
  a downloadable rejection file.
- Simulated supplier-order delivery with signed webhook verification.
- Nightly reconciliation comparing materialized balances with movement totals.
- Dead-letter visibility and an operator retry command for failed jobs.

## Required tests

Apply the shared standard and emphasize:

- property tests showing movement sequences preserve stock invariants;
- forced-interleaving tests for reservation, receiving, and shipment races;
- idempotency tests including concurrent duplicate requests and crash recovery;
- transaction rollback at every multi-write boundary;
- authorization tests for warehouse and organization isolation;
- report fixtures containing zero-stock, duplicate-child, and partial-order cases;
- migration tests that add a required SKU or reservation version safely;
- a load test for stock listing and concurrent checkout-like reservation traffic.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Workspace, identity stub, products, warehouses | Clean setup, schema constraints, CRUD integration tests |
| 2 | Immutable movements and current stock | Adjustment flow plus ledger/balance reconciliation test |
| 3 | Purchase orders and partial receipts | State-machine tests and forced rollback during receipt |
| 4 | Sales orders and atomic reservation | Deterministic last-unit concurrency test |
| 5 | Pick, partial shipment, cancellation | Idempotent shipment and reservation-release evidence |
| 6 | Transfers, returns, and cycle counts | Compensating history and authorization matrix |
| 7 | React operational workflows | Keyboard/accessibility tests and honest conflict recovery |
| 8 | Reports, search, CSV import/export | Query plans, streaming memory measurement, row failures |
| 9 | Worker, notifications, reconciliation | Retry/dead-letter tests and injected worker failure |
| 10 | Security, observability, deployment | Threat model, dashboards/log queries, shutdown proof |
| 11 | Ambiguous change request | Small compatible PR adding backorders or lot tracking |
| 12 | Release and incident simulation | Restore drill, incident report, demo, technical defense |

## Stretch features

- Lots, batches, serial numbers, and expiration dates.
- Multiple units of measure with explicit conversion rules.
- Allocation strategy by warehouse proximity or earliest expiration.
- Purchase approval thresholds and budget limits.
- Barcode-scanner-friendly progressive web application.

## Completion defense

Demonstrate two users competing for the final units, a retry after an ambiguous
network failure, a partial receipt and shipment, a movement-ledger correction,
and an upgrade from an older database. Explain why the transaction and locking
strategy preserves invariants and identify the scale at which it must change.

