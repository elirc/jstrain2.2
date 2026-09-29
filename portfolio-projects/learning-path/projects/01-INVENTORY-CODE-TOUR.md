# Inventory and orders code tour

## Product sentence

The system must explain every stock change and must never let retries, failures, or concurrent orders create impossible balances.

## Start at the schema

Open [`migrations/001_initial.sql`](../../01-inventory-orders/migrations/001_initial.sql). Group tables by purpose:

- identity/tenant: organizations, users, memberships;
- catalog: products, suppliers, warehouses;
- projection/history: stock levels and immutable stock movements;
- purchasing: purchase orders/lines;
- sales: sales orders/lines, reservations, shipments/lines;
- other commands: transfers and returns;
- reliability: idempotency, audit, jobs/dead-letter state.

`stock_levels` answers “what is available now?” efficiently. `stock_movements` answers “why?” and supports reconciliation. The triggers reject update/delete so corrections must be compensating movements.

## Boundary walkthrough

[`packages/contracts/src/index.ts`](../../01-inventory-orders/packages/contracts/src/index.ts) parses paging, product, line, quantity, adjustment, transfer, return, and configuration input. Observe that quantities are integers and most are positive. Adjustment is the deliberate exception: it may be positive or negative, but never zero and always needs a reason.

[`apps/api/src/app.ts`](../../01-inventory-orders/apps/api/src/app.ts) then:

1. establishes a correlation ID;
2. resolves local demo identity and membership;
3. applies an action permission;
4. parses input;
5. invokes a named command;
6. maps domain/validation/constraint errors to a stable envelope.

The UI hiding an adjustment form for non-admins is usability. `permit('inventory:adjust')` is security.

## Core code walkthrough

Read [`inventory.ts`](../../01-inventory-orders/apps/api/src/inventory.ts) in this order.

### `idem`

It looks up `(org, scope, key)` inside the transaction. If present, it returns the stored response. Otherwise it executes the work and stores the result before commit. This handles a retry after an ambiguous client timeout.

Question: what additional input-hash check would prevent accidental key reuse with a different body?

### `movement`

Every on-hand change calls one helper that inserts actor, source, reason, and timestamp. Centralizing the insert reduces forgotten ledger entries. SQL immutability protects it after insertion.

### `adjust`

It requires reason, loads the tenant-scoped level, rejects a decrease below reserved, updates the projection, writes movement, and audits—all inside `idem`’s transaction.

### `receive`

It proves the purchase belongs to the organization, destination matches, line exists, quantity is positive, and total will not over-receive. It upserts stock, appends receipt movement, updates received quantity/state, and audits.

The `failAfterMovement` test hook exists to prove rollback. Production behavior does not depend on it.

### `createAndReserveSale`

First it checks every line so the order is all-or-nothing. It snapshots unit price into sales lines, increments reserved stock, creates reservations, calculates a total, and audits. The transaction prevents half-reserved multi-line orders.

### `ship`

Shipping reduces both `on_hand` and `reserved`, consumes the reservation, records shipment/line/movement, computes partial/complete state, and audits. The conditional update rejects missing reservation or stock.

### `cancelSale`

Only active, unconsumed reservations are released. Already shipped stock is not magically restored.

### `transfer` and `processReturn`

A transfer writes matching source/destination movements. Returns are bounded by shipped minus already returned quantity; only restock affects available stock.

## React walkthrough

[`App.tsx`](../../01-inventory-orders/apps/web/src/App.tsx) is a compact operations console. Trace `api`, `refresh`, `submit`, and each workflow form. Notice URL-backed catalog search, live status announcements, role-aware forms, and explicit idempotency headers.

Its compactness is useful for learning but not an ideal final decomposition. A follow-up refactor should extract API client, feature forms, and query state only after behavior tests protect the current contract.

## Worker walkthrough

[`apps/worker/src/index.ts`](../../01-inventory-orders/apps/worker/src/index.ts) owns low-stock notification and reconciliation work. Identify claim/attempt/state transitions, retry cap, dedupe, and shutdown.

## Test map

| Risk | Proof |
| --- | --- |
| invalid transitions | [`domain.test.ts`](../../01-inventory-orders/tests/domain.test.ts) |
| SQL receipt/shipment semantics | [`integration.test.ts`](../../01-inventory-orders/tests/integration.test.ts) |
| final-unit race and duplicate delivery | [`concurrency.test.ts`](../../01-inventory-orders/tests/concurrency.test.ts) |
| half-write | [`rollback.test.ts`](../../01-inventory-orders/tests/rollback.test.ts) |
| tenant/role bypass | [`authorization.test.ts`](../../01-inventory-orders/tests/authorization.test.ts) |
| UI accessibility | [`react.test.tsx`](../../01-inventory-orders/tests/react.test.tsx) |
| listening HTTP boundary | [`smoke.test.ts`](../../01-inventory-orders/tests/smoke.test.ts) |

## Debugging scenarios

1. Available stock becomes negative. Inspect projection constraints, conditional reservation, and every write to `reserved`.
2. Retried receipt doubled stock. Inspect idempotency scope/key and transaction placement.
3. Ledger differs from on-hand. Group movements by product/warehouse and inspect paths that mutate `stock_levels` without `movement`.
4. One tenant sees another product. Inspect every catalog/stock join for organization predicates.

## Mid-level teach-back

Explain the source-of-truth versus projection model, then draw the exact commit boundary for receiving. Name the first scale threshold that forces PostgreSQL locking.
