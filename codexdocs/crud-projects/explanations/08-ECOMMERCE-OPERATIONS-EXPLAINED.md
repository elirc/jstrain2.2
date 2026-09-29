# 08 — E-commerce operations platform — requirement coaching

Companion to [the build brief](../08-ECOMMERCE-OPERATIONS.md). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.

## Actors and permissions

This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.

#### R001 — Customer — Browse catalog, manage own cart/orders/returns

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Customer — Browse catalog, manage own cart/orders/returns
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R002 — Guest customer — Cart and checkout with limited order-access token policy

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Guest customer — Cart and checkout with limited order-access token policy
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R003 — Catalog manager — Products, variants, media metadata, prices, publication

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Catalog manager — Products, variants, media metadata, prices, publication
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R004 — Fulfillment operator — Allocation, pick, pack, ship, returns reception

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Fulfillment operator — Allocation, pick, pack, ship, returns reception
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R005 — Support agent — Order history, safe cancellation/refund initiation within policy

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Support agent — Order history, safe cancellation/refund initiation within policy
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R006 — Finance operator — Payment/refund reconciliation and restricted reports

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Finance operator — Payment/refund reconciliation and restricted reports
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R007 — Administrator — Roles, warehouses, tax/shipping configuration, provider settings

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Administrator — Roles, warehouses, tax/shipping configuration, provider settings
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

## Core data model

This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.

#### R008 — Product and variant — Stable SKU, attributes, publication state, version

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Product and variant — Stable SKU, attributes, publication state, version
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R009 — Price — Currency, integer minor amount, effective interval, channel

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Price — Currency, integer minor amount, effective interval, channel
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R010 — Warehouse and stock — On-hand/reserved versioned balance and movement ledger

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Warehouse and stock — On-hand/reserved versioned balance and movement ledger
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R011 — Cart and cart line — Owner/session, variant, quantity, observed price, expiry

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Cart and cart line — Owner/session, variant, quantity, observed price, expiry
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R012 — Promotion — Versioned eligibility and benefit rules, usage constraints

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Promotion — Versioned eligibility and benefit rules, usage constraints
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R013 — Checkout attempt — Idempotency key, validated snapshots, state, failure details

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Checkout attempt — Idempotency key, validated snapshots, state, failure details
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R014 — Order and order line — Customer/address/price/tax/discount snapshots, state, totals

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Order and order line — Customer/address/price/tax/discount snapshots, state, totals
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R015 — Inventory reservation — Order line, warehouse, quantity, state, expiry

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Inventory reservation — Order line, warehouse, quantity, state, expiry
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R016 — Payment attempt — Provider reference, amount, state, idempotency key, safe metadata

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Payment attempt — Provider reference, amount, state, idempotency key, safe metadata
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R017 — Payment event — Verified provider event and processing state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Payment event — Verified provider event and processing state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Forcing process exit can discard output and partial work; background success is incomplete until handles and children are owned and drained.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R018 — Fulfillment/shipment — Warehouse, lines, tracking, state, idempotency key

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Fulfillment/shipment — Warehouse, lines, tracking, state, idempotency key
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R019 — Return and refund — Eligible quantities, reason, disposition, amount, state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Return and refund — Eligible quantities, reason, disposition, amount, state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R020 — Outbox event — Transactional integration event and delivery state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Outbox event — Transactional integration event and delivery state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

## Required workflows

This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.

### Catalog, price, and stock

#### R021 — Manage products and variants, unique SKUs, publication, search, filters, and pagination

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Manage products and variants, unique SKUs, publication, search, filters, and pagination.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R022 — Define effective-dated currency prices and reject overlapping ambiguous price periods

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Define effective-dated currency prices and reject overlapping ambiguous price periods.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.

#### R023 — Adjust/receive/transfer stock through immutable movements and exact balance updates

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Adjust/receive/transfer stock through immutable movements and exact balance updates.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R024 — Published product detail exposes only currently sellable variants and valid price

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Published product detail exposes only currently sellable variants and valid price.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R025 — Product retirement preserves historical order references

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Product retirement preserves historical order references.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Cart and pricing

#### R026 — Add, update, and remove cart lines with bounded quantity and inventory messaging

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Add, update, and remove cart lines with bounded quantity and inventory messaging.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R027 — Merge guest and authenticated carts through a documented conflict policy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Merge guest and authenticated carts through a documented conflict policy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R028 — Calculate subtotal, discounts, shipping simulation, tax simulation, and total in

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Calculate subtotal, discounts, shipping simulation, tax simulation, and total in
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R029 — Version promotion rules and explain applied/rejected promotions

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Version promotion rules and explain applied/rejected promotions.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R030 — Reprice at checkout and require customer acknowledgement when material values changed

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Reprice at checkout and require customer acknowledgement when material values changed.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

### Checkout and order creation

#### R031 — Validate cart, customer contact, address, current price, promotions, shipping,

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Validate cart, customer contact, address, current price, promotions, shipping,
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R032 — Use one checkout idempotency key across retries and page refresh

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Use one checkout idempotency key across retries and page refresh.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R033 — Atomically create immutable order snapshots, reserve inventory, and create an

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Atomically create immutable order snapshots, reserve inventory, and create an
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R034 — Define whether payment authorization precedes or follows reservation and how

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Define whether payment authorization precedes or follows reservation and how
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R035 — Return the existing result after an ambiguous timeout and repeated request

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Return the existing result after an ambiguous timeout and repeated request.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Payment simulation and webhooks

#### R036 — Implement a fake provider behind an interface with authorize, capture, void,

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Implement a fake provider behind an interface with authorize, capture, void,
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.

#### R037 — Provider operations use durable idempotency keys and stable references

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Provider operations use durable idempotency keys and stable references.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R038 — Verify webhook signature against raw bytes, tolerate duplicates and reordering,

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Verify webhook signature against raw bytes, tolerate duplicates and reordering,
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R039 — Reconcile local state through provider lookup instead of guessing after timeout

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Reconcile local state through provider lookup instead of guessing after timeout.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R040 — Keep webhook receipt fast and process durable work asynchronously

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Keep webhook receipt fast and process durable work asynchronously.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

### Fulfillment, cancellation, returns, refunds

#### R041 — Allocate, pick, pack, and partially ship order quantities

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Allocate, pick, pack, and partially ship order quantities.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R042 — Shipment consumes reserved/on-hand inventory exactly once

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Shipment consumes reserved/on-hand inventory exactly once.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R043 — Cancellation releases unshipped reservations and voids/refunds only eligible payment amounts

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Cancellation releases unshipped reservations and voids/refunds only eligible payment amounts.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R044 — Create return authorization only for delivered, unreturned quantities within policy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create return authorization only for delivered, unreturned quantities within policy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R045 — Receive returned items with restock/quarantine/discard disposition

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Receive returned items with restock/quarantine/discard disposition.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R046 — Calculate refund from historical order allocation, not current catalog price

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Calculate refund from historical order allocation, not current catalog price.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R047 — Support partial failure and reconciliation between refund, return, and order states

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Support partial failure and reconciliation between refund, return, and order states.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

### Reporting and support

#### R048 — Customer order timeline and support-safe operational/payment history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Customer order timeline and support-safe operational/payment history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R049 — Orders, revenue, discounts, returns, fulfillment time, and stock-demand reports

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Orders, revenue, discounts, returns, fulfillment time, and stock-demand reports.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R050 — Payment reconciliation report identifies local/provider disagreement

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Payment reconciliation report identifies local/provider disagreement.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R051 — Exports have stable schemas, authorization, streaming, and audit events

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Exports have stable schemas, authorization, streaming, and audit events.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe.

## API and UI requirements

This turns domain behavior into stable server contracts and honest, accessible client states.

#### R052 — catalog/detail/cart with explicit loading, unavailable, changed-price, and empty states;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: catalog/detail/cart with explicit loading, unavailable, changed-price, and empty states;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R053 — checkout split into recoverable steps without trusting client-calculated totals;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: checkout split into recoverable steps without trusting client-calculated totals;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R054 — duplicate-submission protection and safe return to an existing checkout result;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: duplicate-submission protection and safe return to an existing checkout result;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R055 — customer order timeline, cancellation eligibility, and return creation;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: customer order timeline, cancellation eligibility, and return creation;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R056 — fulfillment work queue with scan-like rapid entry and partial shipment support;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: fulfillment work queue with scan-like rapid entry and partial shipment support;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Treating every failure as 400 or 500 erases retry and conflict semantics; types also do not validate bytes received over the wire.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R057 — support view explaining totals, payment attempts, fulfillment, and allowed actions;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: support view explaining totals, payment attempts, fulfillment, and allowed actions;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R058 — reconciliation dashboard that distinguishes actionable disagreement from processing delay

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: reconciliation dashboard that distinguishes actionable disagreement from processing delay.
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

## Critical rules and failure cases

This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.

#### R059 — All money is integer minor units in a declared currency; currency never changes implicitly

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: All money is integer minor units in a declared currency; currency never changes implicitly.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R060 — Order lines and totals are immutable snapshots with a reproducible calculation breakdown

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Order lines and totals are immutable snapshots with a reproducible calculation breakdown.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R061 — reserved <= on_hand; checkout competition cannot oversell

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: `reserved <= on_hand`; checkout competition cannot oversell.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R062 — Checkout, provider operations, shipment, cancellation, webhook, and refund are idempotent

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Checkout, provider operations, shipment, cancellation, webhook, and refund are idempotent.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R063 — Order state is derived or transitioned only when component payment/fulfillment facts permit it

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Order state is derived or transitioned only when component payment/fulfillment facts permit it.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R064 — Webhook arrival order is not trusted as chronological truth

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Webhook arrival order is not trusted as chronological truth.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R065 — Refund total cannot exceed captured total minus prior successful refunds

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Refund total cannot exceed captured total minus prior successful refunds.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R066 — Return quantities cannot exceed delivered minus already returned quantities

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Return quantities cannot exceed delivered minus already returned quantities.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R067 — Sensitive provider and customer data is minimized, redacted, and access-controlled

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Sensitive provider and customer data is minimized, redacted, and access-controlled.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

## Background work and integrations

This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.

#### R068 — Outbox publisher preventing lost integration events after database commit

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Outbox publisher preventing lost integration events after database commit.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R069 — Payment command processor and webhook event processor with durable retries

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Payment command processor and webhook event processor with durable retries.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

#### R070 — Reservation-expiry worker with payment/checkout state checks

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Reservation-expiry worker with payment/checkout state checks.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

#### R071 — Fulfillment notification and tracking simulation

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Fulfillment notification and tracking simulation.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R072 — Provider reconciliation and inventory-ledger reconciliation jobs

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Provider reconciliation and inventory-ledger reconciliation jobs.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R073 — Abandoned-cart cleanup without depending on it for stock correctness

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Abandoned-cart cleanup without depending on it for stock correctness.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

## Required tests

This supplies independent evidence against a named risk rather than measuring activity or line execution.

#### R074 — property tests for price breakdown, discounts, refund bounds, and stock movements;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: property tests for price breakdown, discounts, refund bounds, and stock movements;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R075 — golden decision tables for promotion eligibility and allocation rounding;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: golden decision tables for promotion eligibility and allocation rounding;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect.

#### R076 — forced checkout competition and reservation-expiry/payment races;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: forced checkout competition and reservation-expiry/payment races;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R077 — concurrent and sequential duplicate idempotency tests at every external command;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: concurrent and sequential duplicate idempotency tests at every external command;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R078 — webhook raw-signature, duplicate, reordering, unknown-event, and replay tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: webhook raw-signature, duplicate, reordering, unknown-event, and replay tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R079 — fault injection between database commit, provider call, response, and outbox publication;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: fault injection between database commit, provider call, response, and outbox publication;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R080 — authorization/projection tests across customer, support, fulfillment, and finance;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: authorization/projection tests across customer, support, fulfillment, and finance;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R081 — migration and load tests for order listing and high-contention checkout

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: migration and load tests for order listing and high-contention checkout.
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

## Delivery plan

This keeps the project shippable through vertical increments with concrete exit evidence.

#### R082 — 1 — Catalog, variants, price, publication; Effective-price constraints and customer projection

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 1 — Catalog, variants, price, publication; Effective-price constraints and customer projection
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R083 — 2 — Stock ledger and availability; Reconciliation property and concurrent adjustment tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 2 — Stock ledger and availability; Reconciliation property and concurrent adjustment tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R084 — 3 — Cart and pure pricing; Exact totals, promotion tables, guest merge behavior

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 3 — Cart and pure pricing; Exact totals, promotion tables, guest merge behavior
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R085 — 4 — Idempotent checkout and reservations; Last-unit race and repeated-timeout result evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 4 — Idempotent checkout and reservations; Last-unit race and repeated-timeout result evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R086 — 5 — Fake payment adapter and attempts; Timeout lookup, idempotency, safe metadata

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 5 — Fake payment adapter and attempts; Timeout lookup, idempotency, safe metadata
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R087 — 6 — Signed asynchronous webhooks/outbox; Raw signature, duplicates, reordering, crash recovery

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 6 — Signed asynchronous webhooks/outbox; Raw signature, duplicates, reordering, crash recovery
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R088 — 7 — Pick, pack, partial shipment; Atomic stock consumption and repeated shipment tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 7 — Pick, pack, partial shipment; Atomic stock consumption and repeated shipment tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R089 — 8 — Cancellation, return, refund; Bounds, historical pricing, partial-failure reconciliation

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 8 — Cancellation, return, refund; Bounds, historical pricing, partial-failure reconciliation
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R090 — 9 — React customer and operations flows; Accessibility, conflicts, changed price, recovery states

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 9 — React customer and operations flows; Accessibility, conflicts, changed price, recovery states
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R091 — 10 — Reports, security, operations, deploy; Threat model, query plans, restore, graceful shutdown

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 10 — Reports, security, operations, deploy; Threat model, query plans, restore, graceful shutdown
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R092 — 11 — Ambiguous change; Add preorder or split fulfillment compatibly

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 11 — Ambiguous change; Add preorder or split fulfillment compatibly
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R093 — 12 — Release incident; Provider timeout/webhook disorder drill, report, defense

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 12 — Release incident; Provider timeout/webhook disorder drill, report, defense
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

## Stretch features

This adds complexity only after the core system is correct and provides a deliberate specialization challenge.

#### R094 — Multi-warehouse allocation and split fulfillment strategy

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Multi-warehouse allocation and split fulfillment strategy.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R095 — Preorders/backorders with explicit inventory semantics

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Preorders/backorders with explicit inventory semantics.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R096 — Gift cards or store credit as a separate ledger

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Gift cards or store credit as a separate ledger.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R097 — Promotion stacking rules with deterministic precedence

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Promotion stacking rules with deterministic precedence.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R098 — Fraud-review simulation and manual release workflow

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Fraud-review simulation and manual release workflow.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.
