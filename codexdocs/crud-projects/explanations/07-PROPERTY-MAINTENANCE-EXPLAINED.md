# 07 — Property maintenance platform — requirement coaching

Companion to [the build brief](../07-PROPERTY-MAINTENANCE.md). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.

## Actors and permissions

This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.

#### R001 — Portfolio administrator — Organizations, properties, members, vendors, policies

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Portfolio administrator — Organizations, properties, members, vendors, policies
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R002 — Property manager — Units, occupants, requests, assignments, estimates, invoices

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Property manager — Units, occupants, requests, assignments, estimates, invoices
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R003 — Tenant/occupant — Own-unit requests, public updates, appointments, completion feedback

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Tenant/occupant — Own-unit requests, public updates, appointments, completion feedback
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R004 — Internal technician — Assigned work orders, schedule, notes, parts, completion evidence

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Internal technician — Assigned work orders, schedule, notes, parts, completion evidence
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R005 — Vendor coordinator — Vendor users, assignment acceptance, estimates, invoices

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Vendor coordinator — Vendor users, assignment acceptance, estimates, invoices
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R006 — Vendor worker — Only explicitly assigned work and vendor-visible communication

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Vendor worker — Only explicitly assigned work and vendor-visible communication
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. Forcing process exit can discard output and partial work; background success is incomplete until handles and children are owned and drained.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

#### R007 — Finance viewer — Approved costs, invoices, exports; limited tenant details

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Finance viewer — Approved costs, invoices, exports; limited tenant details
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

## Core data model

This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.

#### R008 — Portfolio/organization — Tenant root and settings

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Portfolio/organization — Tenant root and settings
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R009 — Property and unit — Address, zone, manager, active state, unit identifiers

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Property and unit — Address, zone, manager, active state, unit identifiers
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R010 — Occupancy — User/tenant, unit, effective interval, contact/access preferences

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Occupancy — User/tenant, unit, effective interval, contact/access preferences
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R011 — Maintenance request — Reporter, unit, category, urgency, description, version

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Maintenance request — Reporter, unit, category, urgency, description, version
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R012 — Work order — Request, state, priority, assignee/vendor, target dates, costs

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Work order — Request, state, priority, assignee/vendor, target dates, costs
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R013 — Work-order event — Immutable state, assignment, communication, and cost history

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Work-order event — Immutable state, assignment, communication, and cost history
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R014 — Comment — Tenant-visible, vendor-visible, or internal visibility

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Comment — Tenant-visible, vendor-visible, or internal visibility
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R015 — Attachment — Evidence metadata, uploader, visibility, scan state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Attachment — Evidence metadata, uploader, visibility, scan state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R016 — Appointment window — Work order, local interval/zone, participants, state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Appointment window — Work order, local interval/zone, participants, state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R017 — Estimate — Vendor, line items, amount, expiry, submitted/approved/rejected state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Estimate — Vendor, line items, amount, expiry, submitted/approved/rejected state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.

#### R018 — Invoice — Work performed, line items, amount, review/payment-export state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Invoice — Work performed, line items, amount, review/payment-export state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R019 — Asset — Optional appliance/system in a unit with service history

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Asset — Optional appliance/system in a unit with service history
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R020 — Vendor — Services, coverage, insurance expiry, active/suspended state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Vendor — Services, coverage, insurance expiry, active/suspended state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

## Required workflows

This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.

### Property and access setup

#### R021 — Manage properties, units, occupancy periods, managers, assets, and vendors

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Manage properties, units, occupancy periods, managers, assets, and vendors.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R022 — Prevent overlapping active occupancy where the selected domain disallows it

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Prevent overlapping active occupancy where the selected domain disallows it.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R023 — Invite tenant/vendor users through expiring, scoped invitations

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Invite tenant/vendor users through expiring, scoped invitations.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R024 — Suspend vendor access without deleting work history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Suspend vendor access without deleting work history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R025 — Alert on vendor insurance/certification expiry and prevent new assignment by policy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Alert on vendor insurance/certification expiry and prevent new assignment by policy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

### Intake and triage

#### R026 — Tenant creates a request with category, description, access permission, preferred

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Tenant creates a request with category, description, access permission, preferred
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R027 — Detect likely duplicate open requests for the same unit/asset and let a manager link them

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Detect likely duplicate open requests for the same unit/asset and let a manager link them.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R028 — Triage urgency and responsibility; emergency paths show explicit safety instructions

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Triage urgency and responsibility; emergency paths show explicit safety instructions.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R029 — Convert an accepted request to a work order exactly once

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Convert an accepted request to a work order exactly once.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R030 — Reject or merge requests while preserving tenant-visible reasoning and history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Reject or merge requests while preserving tenant-visible reasoning and history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.

### Assignment, estimate, and approval

#### R031 — Assign an internal technician or invite one or more permitted vendors to estimate

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Assign an internal technician or invite one or more permitted vendors to estimate.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R032 — Vendor accepts/declines without gaining broader property access

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Vendor accepts/declines without gaining broader property access.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R033 — Submit versioned estimate line items and supporting files

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Submit versioned estimate line items and supporting files.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R034 — Auto-approve below a configured threshold; route larger estimates for approval

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Auto-approve below a configured threshold; route larger estimates for approval.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Treating every failure as 400 or 500 erases retry and conflict semantics; types also do not validate bytes received over the wire.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.

#### R035 — Choose an estimate, reject alternatives, and preserve all bids for audit

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Choose an estimate, reject alternatives, and preserve all bids for audit.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Swallowing, stringifying, or repeatedly translating an error often loses cause and recovery meaning while making logs noisier.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.

#### R036 — Reassignment records reason and handles scheduled appointments explicitly

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Reassignment records reason and handles scheduled appointments explicitly.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Scheduling and execution

#### R037 — Offer appointment windows consistent with property zone, occupancy preferences,

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Offer appointment windows consistent with property zone, occupancy preferences,
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R038 — Prevent assignee overlap and resolve concurrent slot acceptance

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Prevent assignee overlap and resolve concurrent slot acceptance.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R039 — Check in, start, pause, complete, and reopen work through explicit transitions

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Check in, start, pause, complete, and reopen work through explicit transitions.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R040 — Record labor, parts, notes, before/after evidence, and tenant-visible summaries

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Record labor, parts, notes, before/after evidence, and tenant-visible summaries.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R041 — Require completion fields by category and optionally manager inspection

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Require completion fields by category and optionally manager inspection.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

### Invoicing and closure

#### R042 — Create invoice from approved estimate/work with documented variance rules

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create invoice from approved estimate/work with documented variance rules.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R043 — Require approval when invoice exceeds estimate tolerance

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Require approval when invoice exceeds estimate tolerance.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R044 — Mark export/paid status through an idempotent accounting adapter simulation

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Mark export/paid status through an idempotent accounting adapter simulation.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.

#### R045 — Tenant confirms resolution or reopens within a configured window

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Tenant confirms resolution or reopens within a configured window.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R046 — Close only when required work, approval, communication, and invoice conditions hold

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Close only when required work, approval, communication, and invoice conditions hold.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

### Reporting

#### R047 — Open work by age, property, category, urgency, assignee, and vendor

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Open work by age, property, category, urgency, assignee, and vendor.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R048 — Response/completion time, reopen rate, vendor acceptance, estimate variance, cost by asset

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Response/completion time, reopen rate, vendor acceptance, estimate variance, cost by asset.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R049 — Separate calendar and business-time metrics with documented definitions

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Separate calendar and business-time metrics with documented definitions.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R050 — Export only fields permitted for the operator's portfolio role

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Export only fields permitted for the operator's portfolio role.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

## API and UI requirements

This turns domain behavior into stable server contracts and honest, accessible client states.

#### R051 — mobile-first tenant intake with upload recovery and emergency guidance;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: mobile-first tenant intake with upload recovery and emergency guidance;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R052 — manager queues with URL filters, bulk assignment, age indicators, and conflicts;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: manager queues with URL filters, bulk assignment, age indicators, and conflicts;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R053 — separate internal, vendor, and tenant communication composers with strong visibility cues;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: separate internal, vendor, and tenant communication composers with strong visibility cues;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R054 — vendor portal exposing only assigned work, estimates, appointments, and invoices;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: vendor portal exposing only assigned work, estimates, appointments, and invoices;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R055 — accessible calendar/list scheduling and zone display;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: accessible calendar/list scheduling and zone display;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R056 — technician mobile workflow tolerant of temporary network loss without claiming full offline sync;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: technician mobile workflow tolerant of temporary network loss without claiming full offline sync;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R057 — cost/estimate/invoice comparison and approval history;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: cost/estimate/invoice comparison and approval history;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R058 — tenant timeline containing only public events and authorized files

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: tenant timeline containing only public events and authorized files.
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

## Critical rules and failure cases

This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.

#### R059 — Every read and mutation verifies portfolio/property/unit relationship and current role

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Every read and mutation verifies portfolio/property/unit relationship and current role.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R060 — Visibility is allow-listed; internal content never reaches tenant/vendor projections

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Visibility is allow-listed; internal content never reaches tenant/vendor projections.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R061 — State transitions and reopen rules are exhaustive

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: State transitions and reopen rules are exhaustive.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R062 — A request converts to at most one primary work order unless an explicit split is recorded

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: A request converts to at most one primary work order unless an explicit split is recorded.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R063 — Estimate/invoice money is exact and approved snapshots are immutable

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Estimate/invoice money is exact and approved snapshots are immutable.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R064 — Appointment allocation prevents overlap and handles zone/DST boundaries

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Appointment allocation prevents overlap and handles zone/DST boundaries.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R065 — Duplicate invitations, assignment responses, accounting results, and uploads are idempotent

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Duplicate invitations, assignment responses, accounting results, and uploads are idempotent.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R066 — Former occupants lose current access but retain legally required historical access policy

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Former occupants lose current access but retain legally required historical access policy.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Background work and integrations

This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.

#### R067 — Attachment scan/thumbnail simulation with quarantine

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Attachment scan/thumbnail simulation with quarantine.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R068 — Appointment reminders and overdue escalation with dedupe

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Appointment reminders and overdue escalation with dedupe.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R069 — Vendor credential-expiry and SLA-warning jobs

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Vendor credential-expiry and SLA-warning jobs.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R070 — Accounting export/result adapter with retries and reconciliation

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Accounting export/result adapter with retries and reconciliation.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R071 — Maintenance history export and retention/redaction jobs

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Maintenance history export and retention/redaction jobs.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

## Required tests

This supplies independent evidence against a named risk rather than measuring activity or line execution.

#### R072 — visibility projection tests across tenant, former tenant, vendor, technician, manager, finance;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: visibility projection tests across tenant, former tenant, vendor, technician, manager, finance;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R073 — effective-dated occupancy and invitation authorization tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: effective-dated occupancy and invitation authorization tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R074 — concurrent request conversion, estimate approval, scheduling, and invoice result tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: concurrent request conversion, estimate approval, scheduling, and invoice result tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R075 — exact-money estimate/invoice variance decision tables;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: exact-money estimate/invoice variance decision tables;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Binary floating-point and recalculation from current values make historical totals irreproducible and can violate refund or allocation bounds.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R076 — time-zone, notice-window, and overlap tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: time-zone, notice-window, and overlap tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R077 — file ownership, visibility, type, size, scan, and expired-access tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: file ownership, visibility, type, size, scan, and expired-access tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R078 — workflow property tests or exhaustive transition tables;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: workflow property tests or exhaustive transition tables;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R079 — mobile-width accessibility and interrupted-upload/update recovery

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: mobile-width accessibility and interrupted-upload/update recovery.
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Delivery plan

This keeps the project shippable through vertical increments with concrete exit evidence.

#### R080 — 1 — Properties, units, occupancy, roles; Effective-date and cross-role authorization tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 1 — Properties, units, occupancy, roles; Effective-date and cross-role authorization tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R081 — 2 — Tenant requests and files; Mobile accessible flow and private-file protection

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 2 — Tenant requests and files; Mobile accessible flow and private-file protection
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R082 — 3 — Triage and work-order conversion; Idempotency, duplicate linking, transition evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 3 — Triage and work-order conversion; Idempotency, duplicate linking, transition evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R083 — 4 — Assignment and vendor portal; Narrow projection and revoked-vendor tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 4 — Assignment and vendor portal; Narrow projection and revoked-vendor tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R084 — 5 — Estimates and approval; Exact totals, thresholds, concurrent-decision tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 5 — Estimates and approval; Exact totals, thresholds, concurrent-decision tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R085 — 6 — Scheduling; Zone/notice/overlap and last-slot race evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 6 — Scheduling; Zone/notice/overlap and last-slot race evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R086 — 7 — Work execution and communication; Visibility matrix and completion requirements

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 7 — Work execution and communication; Visibility matrix and completion requirements
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R087 — 8 — Invoice and closure; Variance, reopening, idempotent export tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 8 — Invoice and closure; Variance, reopening, idempotent export tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R088 — 9 — Reports and operational jobs; Aggregate/query-plan and dedupe/dead-letter evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 9 — Reports and operational jobs; Aggregate/query-plan and dedupe/dead-letter evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R089 — 10 — Security, deployment, recovery; Threat model, redaction, restore and shutdown

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 10 — Security, deployment, recovery; Threat model, redaction, restore and shutdown
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.

#### R090 — 11 — Maintenance request; Add assets/preventive work without breaking histories

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 11 — Maintenance request; Add assets/preventive work without breaking histories
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment.

#### R091 — 12 — Release incident; Private-note exposure drill, repair, report, defense

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 12 — Release incident; Private-note exposure drill, repair, report, defense
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment.

## Stretch features

This adds complexity only after the core system is correct and provides a deliberate specialization challenge.

#### R092 — Preventive maintenance generated from asset schedules

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Preventive maintenance generated from asset schedules.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R093 — Vendor bidding deadline and blinded bid comparison

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Vendor bidding deadline and blinded bid comparison.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R094 — Parts inventory linked to work orders

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Parts inventory linked to work orders.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R095 — Map-based technician routing behind an external adapter

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Map-based technician routing behind an external adapter.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R096 — Limited offline outbox with explicit merge/conflict behavior

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Limited offline outbox with explicit merge/conflict behavior.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.
