# 08 — E-commerce operations platform

## Product objective

Build the operational core of an online store: catalog, pricing, carts,
inventory reservation, checkout, orders, simulated payment authorization,
webhooks, fulfillment, cancellation, returns, refunds, and support-visible
history. Avoid real payment data. The project is designed around exact money,
snapshots, distributed failure, idempotency, inventory races, and reconciliation.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Customer | Browse catalog, manage own cart/orders/returns |
| Guest customer | Cart and checkout with limited order-access token policy |
| Catalog manager | Products, variants, media metadata, prices, publication |
| Fulfillment operator | Allocation, pick, pack, ship, returns reception |
| Support agent | Order history, safe cancellation/refund initiation within policy |
| Finance operator | Payment/refund reconciliation and restricted reports |
| Administrator | Roles, warehouses, tax/shipping configuration, provider settings |

Support and fulfillment roles see only necessary payment metadata—never raw
credentials. Administrative impersonation or elevation is explicit and audited.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Product and variant | Stable SKU, attributes, publication state, version |
| Price | Currency, integer minor amount, effective interval, channel |
| Warehouse and stock | On-hand/reserved versioned balance and movement ledger |
| Cart and cart line | Owner/session, variant, quantity, observed price, expiry |
| Promotion | Versioned eligibility and benefit rules, usage constraints |
| Checkout attempt | Idempotency key, validated snapshots, state, failure details |
| Order and order line | Customer/address/price/tax/discount snapshots, state, totals |
| Inventory reservation | Order line, warehouse, quantity, state, expiry |
| Payment attempt | Provider reference, amount, state, idempotency key, safe metadata |
| Payment event | Verified provider event and processing state |
| Fulfillment/shipment | Warehouse, lines, tracking, state, idempotency key |
| Return and refund | Eligible quantities, reason, disposition, amount, state |
| Outbox event | Transactional integration event and delivery state |

Orders preserve all values needed to explain what the customer agreed to.
Catalog, address, promotion, or tax configuration changes cannot rewrite history.

## Required workflows

### Catalog, price, and stock

- Manage products and variants, unique SKUs, publication, search, filters, and pagination.
- Define effective-dated currency prices and reject overlapping ambiguous price periods.
- Adjust/receive/transfer stock through immutable movements and exact balance updates.
- Published product detail exposes only currently sellable variants and valid price.
- Product retirement preserves historical order references.

### Cart and pricing

- Add, update, and remove cart lines with bounded quantity and inventory messaging.
- Merge guest and authenticated carts through a documented conflict policy.
- Calculate subtotal, discounts, shipping simulation, tax simulation, and total in
  a pure pricing domain module using exact integer arithmetic.
- Version promotion rules and explain applied/rejected promotions.
- Reprice at checkout and require customer acknowledgement when material values changed.

### Checkout and order creation

- Validate cart, customer contact, address, current price, promotions, shipping,
  and availability on the server.
- Use one checkout idempotency key across retries and page refresh.
- Atomically create immutable order snapshots, reserve inventory, and create an
  outbox/payment-work record.
- Define whether payment authorization precedes or follows reservation and how
  compensation works when the other step fails.
- Return the existing result after an ambiguous timeout and repeated request.

### Payment simulation and webhooks

- Implement a fake provider behind an interface with authorize, capture, void,
  refund, lookup, and signed webhook behavior.
- Provider operations use durable idempotency keys and stable references.
- Verify webhook signature against raw bytes, tolerate duplicates and reordering,
  and record unrecognized events safely.
- Reconcile local state through provider lookup instead of guessing after timeout.
- Keep webhook receipt fast and process durable work asynchronously.

### Fulfillment, cancellation, returns, refunds

- Allocate, pick, pack, and partially ship order quantities.
- Shipment consumes reserved/on-hand inventory exactly once.
- Cancellation releases unshipped reservations and voids/refunds only eligible payment amounts.
- Create return authorization only for delivered, unreturned quantities within policy.
- Receive returned items with restock/quarantine/discard disposition.
- Calculate refund from historical order allocation, not current catalog price.
- Support partial failure and reconciliation between refund, return, and order states.

### Reporting and support

- Customer order timeline and support-safe operational/payment history.
- Orders, revenue, discounts, returns, fulfillment time, and stock-demand reports.
- Payment reconciliation report identifies local/provider disagreement.
- Exports have stable schemas, authorization, streaming, and audit events.

## API and UI requirements

Provide customer APIs for catalog, carts, pricing, checkout, orders, cancellation,
and returns; operational APIs for catalog, inventory, fulfillment, support,
refunds, reconciliation, and reports; provider-facing webhook endpoints accept
the exact raw signed payload contract.

The React application needs:

- catalog/detail/cart with explicit loading, unavailable, changed-price, and empty states;
- checkout split into recoverable steps without trusting client-calculated totals;
- duplicate-submission protection and safe return to an existing checkout result;
- customer order timeline, cancellation eligibility, and return creation;
- fulfillment work queue with scan-like rapid entry and partial shipment support;
- support view explaining totals, payment attempts, fulfillment, and allowed actions;
- reconciliation dashboard that distinguishes actionable disagreement from processing delay.

## Critical rules and failure cases

- All money is integer minor units in a declared currency; currency never changes implicitly.
- Order lines and totals are immutable snapshots with a reproducible calculation breakdown.
- `reserved <= on_hand`; checkout competition cannot oversell.
- Checkout, provider operations, shipment, cancellation, webhook, and refund are idempotent.
- Order state is derived or transitioned only when component payment/fulfillment facts permit it.
- Webhook arrival order is not trusted as chronological truth.
- Refund total cannot exceed captured total minus prior successful refunds.
- Return quantities cannot exceed delivered minus already returned quantities.
- Sensitive provider and customer data is minimized, redacted, and access-controlled.

## Background work and integrations

- Outbox publisher preventing lost integration events after database commit.
- Payment command processor and webhook event processor with durable retries.
- Reservation-expiry worker with payment/checkout state checks.
- Fulfillment notification and tracking simulation.
- Provider reconciliation and inventory-ledger reconciliation jobs.
- Abandoned-cart cleanup without depending on it for stock correctness.

## Required tests

Apply the shared standard and emphasize:

- property tests for price breakdown, discounts, refund bounds, and stock movements;
- golden decision tables for promotion eligibility and allocation rounding;
- forced checkout competition and reservation-expiry/payment races;
- concurrent and sequential duplicate idempotency tests at every external command;
- webhook raw-signature, duplicate, reordering, unknown-event, and replay tests;
- fault injection between database commit, provider call, response, and outbox publication;
- authorization/projection tests across customer, support, fulfillment, and finance;
- migration and load tests for order listing and high-contention checkout.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Catalog, variants, price, publication | Effective-price constraints and customer projection |
| 2 | Stock ledger and availability | Reconciliation property and concurrent adjustment tests |
| 3 | Cart and pure pricing | Exact totals, promotion tables, guest merge behavior |
| 4 | Idempotent checkout and reservations | Last-unit race and repeated-timeout result evidence |
| 5 | Fake payment adapter and attempts | Timeout lookup, idempotency, safe metadata |
| 6 | Signed asynchronous webhooks/outbox | Raw signature, duplicates, reordering, crash recovery |
| 7 | Pick, pack, partial shipment | Atomic stock consumption and repeated shipment tests |
| 8 | Cancellation, return, refund | Bounds, historical pricing, partial-failure reconciliation |
| 9 | React customer and operations flows | Accessibility, conflicts, changed price, recovery states |
| 10 | Reports, security, operations, deploy | Threat model, query plans, restore, graceful shutdown |
| 11 | Ambiguous change | Add preorder or split fulfillment compatibly |
| 12 | Release incident | Provider timeout/webhook disorder drill, report, defense |

## Stretch features

- Multi-warehouse allocation and split fulfillment strategy.
- Preorders/backorders with explicit inventory semantics.
- Gift cards or store credit as a separate ledger.
- Promotion stacking rules with deterministic precedence.
- Fraud-review simulation and manual release workflow.

## Completion defense

Demonstrate two customers competing for one unit, a checkout response lost after
commit, provider timeout followed by lookup, duplicate/out-of-order webhooks,
partial shipment cancellation, and a partial return/refund. Explain the
consistency boundary, compensation, outbox, reconciliation, and exact-money model.

