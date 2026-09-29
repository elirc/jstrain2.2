# 03 — Appointment and resource scheduling — requirement coaching

Companion to [the build brief](../03-APPOINTMENT-SCHEDULING.md). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.

## Actors and permissions

This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.

#### R001 — Organization administrator — Locations, services, policies, resources, members

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Organization administrator — Locations, services, policies, resources, members
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R002 — Scheduler/manager — Availability, manual bookings, reassignment, exceptions

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Scheduler/manager — Availability, manual bookings, reassignment, exceptions
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R003 — Service provider — Own schedule, appointment notes, completion/no-show actions

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Service provider — Own schedule, appointment notes, completion/no-show actions
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R004 — Customer — Discover slots; create, view, reschedule, and cancel own bookings

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Customer — Discover slots; create, view, reschedule, and cancel own bookings
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R005 — Reception viewer — Read daily schedules and check in customers

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Reception viewer — Read daily schedules and check in customers
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

## Core data model

This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.

#### R006 — Organization and location — Tenant, address, business time zone, opening rules

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Organization and location — Tenant, address, business time zone, opening rules
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R007 — Service — Duration, buffer times, price snapshot rules, required resource kinds

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Service — Duration, buffer times, price snapshot rules, required resource kinds
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R008 — Staff member — Membership, qualifications, home zone, active state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Staff member — Membership, qualifications, home zone, active state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R009 — Resource — Room/equipment type, location, capacity, active state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Resource — Room/equipment type, location, capacity, active state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R010 — Availability rule — Owner, local weekday/time range, effective dates, recurrence

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Availability rule — Owner, local weekday/time range, effective dates, recurrence
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R011 — Availability exception — Closure, absence, added hours, local interval, reason

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Availability exception — Closure, absence, added hours, local interval, reason
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.

#### R012 — Customer — Contact details, preferences, consent metadata

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Customer — Contact details, preferences, consent metadata
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R013 — Appointment — Service, customer, instant interval, display zone, state, version

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Appointment — Service, customer, instant interval, display zone, state, version
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R014 — Appointment resource — Assigned staff/room/equipment with exclusive interval

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Appointment resource — Assigned staff/room/equipment with exclusive interval
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R015 — Hold — Expiring provisional slot claim and idempotency key

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Hold — Expiring provisional slot claim and idempotency key
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R016 — Reminder — Appointment/channel/scheduled instant, delivery and dedupe state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Reminder — Appointment/channel/scheduled instant, delivery and dedupe state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R017 — Wait-list entry — Requested service/range/preferences and notification state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Wait-list entry — Requested service/range/preferences and notification state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

## Required workflows

This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.

### Configuration and availability

#### R018 — Manage locations, services, qualified staff, rooms, and equipment

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Manage locations, services, qualified staff, rooms, and equipment.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R019 — Define recurring weekly availability with effective date ranges

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Define recurring weekly availability with effective date ranges.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R020 — Add holidays, absences, closures, and one-off added availability

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Add holidays, absences, closures, and one-off added availability.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Draw the environment and lifetime of captured values, identify the caller that chooses `this`, and test delayed invocation or cleanup.

#### R021 — Services specify duration, before/after buffers, capacity, and required resources

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Services specify duration, before/after buffers, capacity, and required resources.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R022 — Generate availability on demand for a bounded date range; never pre-create an

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Generate availability on demand for a bounded date range; never pre-create an
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

### Slot discovery and booking

#### R023 — Search by service, location, staff preference, date range, and display zone

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Search by service, location, staff preference, date range, and display zone.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R024 — Intersect service rules, location hours, staff/resource availability, existing

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Intersect service rules, location hours, staff/resource availability, existing
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R025 — Create a short-lived hold before confirmation or atomically confirm directly

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create a short-lived hold before confirmation or atomically confirm directly.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R026 — Prevent overlap at the database boundary where possible, not only in application code

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Prevent overlap at the database boundary where possible, not only in application code.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R027 — Return an explicit conflict when a displayed slot has been taken

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Return an explicit conflict when a displayed slot has been taken.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R028 — Repeated confirmation with the same idempotency key returns the original booking

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Repeated confirmation with the same idempotency key returns the original booking.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

### Appointment lifecycle

#### R029 — Confirm, check in, start, complete, mark no-show, cancel, and reschedule through

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Confirm, check in, start, complete, mark no-show, cancel, and reschedule through
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R030 — Apply configurable cancellation and rescheduling windows

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Apply configurable cancellation and rescheduling windows.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R031 — Rescheduling claims the new resources and releases old ones atomically

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Rescheduling claims the new resources and releases old ones atomically.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R032 — Preserve original appointment and change history for audit and customer support

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Preserve original appointment and change history for audit and customer support.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R033 — Administrative override requires permission and a reason

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Administrative override requires permission and a reason.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

### Customer and operator experience

#### R034 — Customer receives a secure limited-purpose manage-booking link or authenticated view

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Customer receives a secure limited-purpose manage-booking link or authenticated view.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R035 — Daily/weekly provider and resource calendars support time-zone display

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Daily/weekly provider and resource calendars support time-zone display.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R036 — Wait-list entries receive offers with expiration and race-safe acceptance

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Wait-list entries receive offers with expiration and race-safe acceptance.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R037 — Export a standards-compatible calendar feed without exposing private notes

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Export a standards-compatible calendar feed without exposing private notes.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R038 — Report utilization, cancellation, no-show, lead time, and provider workload

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Report utilization, cancellation, no-show, lead time, and provider workload.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

## API and UI requirements

This turns domain behavior into stable server contracts and honest, accessible client states.

#### R039 — service/location selection and accessible slot grid/list alternatives;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: service/location selection and accessible slot grid/list alternatives;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R040 — explicit time-zone display and a zone switch that does not change the instant;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: explicit time-zone display and a zone switch that does not change the instant;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R041 — confirmation, conflict, expired-hold, cancellation-policy, and retry states;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: confirmation, conflict, expired-hold, cancellation-policy, and retry states;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R042 — operator calendars navigable by keyboard without color-only status meaning;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: operator calendars navigable by keyboard without color-only status meaning;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary.

#### R043 — recurring-availability editor with readable rule preview;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: recurring-availability editor with readable rule preview;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R044 — rescheduling UI that retains the original booking until replacement succeeds;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: rescheduling UI that retains the original booking until replacement succeeds;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R045 — check-in and daily schedule views resilient to live changes

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: check-in and daily schedule views resilient to live changes.
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

## Critical rules and failure cases

This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.

#### R046 — Appointment intervals use a documented half-open convention such as [start, end)

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Appointment intervals use a documented half-open convention such as `[start, end)`.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R047 — Required resource intervals include configured buffers

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Required resource intervals include configured buffers.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A stream-shaped API can still buffer the entire payload; verify bounded memory and cleanup instead of trusting the abstraction name.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Use bounded data, a deliberately slow consumer, error injection at each stage, and memory measurements rather than assuming piping is automatically safe. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R048 — A resource cannot have overlapping exclusive allocations; capacity resources

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: A resource cannot have overlapping exclusive allocations; capacity resources
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R049 — DST skipped local times are rejected or moved only by an explicit product rule;

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: DST skipped local times are rejected or moved only by an explicit product rule;
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Classify expected versus unexpected failure, preserve causal context, define cleanup, and specify exactly what the caller and operator observe.

#### R050 — Cancelling or expiring a hold is idempotent

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Cancelling or expiring a hold is idempotent.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R051 — Concurrent booking or wait-list acceptance yields at most one allocation

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Concurrent booking or wait-list acceptance yields at most one allocation.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R052 — Provider deactivation cannot orphan future appointments without a migration workflow

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Provider deactivation cannot orphan future appointments without a migration workflow.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R053 — Reminder delivery never changes appointment state and cannot duplicate on retry

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Reminder delivery never changes appointment state and cannot duplicate on retry.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

## Background work and integrations

This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.

#### R054 — Hold-expiration worker that safely ignores confirmed or already expired holds

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Hold-expiration worker that safely ignores confirmed or already expired holds.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

#### R055 — Reminder scheduling and delivery with customer preferences and quiet-hour rules

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Reminder scheduling and delivery with customer preferences and quiet-hour rules.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R056 — Wait-list offer creation, expiration, and next-candidate promotion

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Wait-list offer creation, expiration, and next-candidate promotion.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R057 — Calendar feed generation and a simulated external-calendar sync adapter

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Calendar feed generation and a simulated external-calendar sync adapter.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R058 — Daily stale-allocation check and schedule-integrity report

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Daily stale-allocation check and schedule-integrity report.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. A single loading flag or blanket invalidation usually hides request identity, freshness, rollback, and concurrent mutation semantics.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.

## Required tests

This supplies independent evidence against a named risk rather than measuring activity or line execution.

#### R059 — table tests around DST gaps, repeated times, zones, leap day, and date boundaries;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: table tests around DST gaps, repeated times, zones, leap day, and date boundaries;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R060 — property tests for interval overlap and availability intersection;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: property tests for interval overlap and availability intersection;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R061 — forced concurrent booking, hold expiration, and rescheduling tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: forced concurrent booking, hold expiration, and rescheduling tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R062 — database exclusion/capacity constraint tests where supported;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: database exclusion/capacity constraint tests where supported;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R063 — fake-clock tests for cancellation windows, reminders, and expired offers;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: fake-clock tests for cancellation windows, reminders, and expired offers;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R064 — authorization tests separating customer, provider, and private notes;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: authorization tests separating customer, provider, and private notes;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R065 — accessibility tests for slot and calendar navigation;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: accessibility tests for slot and calendar navigation;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R066 — load testing popular-slot searches and simultaneous confirmations

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: load testing popular-slot searches and simultaneous confirmations.
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

## Delivery plan

This keeps the project shippable through vertical increments with concrete exit evidence.

#### R067 — 1 — Locations, services, staff, resources; Constraint and authorization tests; usable admin CRUD

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 1 — Locations, services, staff, resources; Constraint and authorization tests; usable admin CRUD
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R068 — 2 — Weekly availability and exceptions; Zone/DST decision table and generation tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 2 — Weekly availability and exceptions; Zone/DST decision table and generation tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R069 — 3 — Slot search; Intersection property tests and bounded query measurement

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 3 — Slot search; Intersection property tests and bounded query measurement
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R070 — 4 — Holds and atomic booking; Deterministic last-slot concurrency evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 4 — Holds and atomic booking; Deterministic last-slot concurrency evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R071 — 5 — Appointment lifecycle; Exhaustive state-machine and idempotency tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 5 — Appointment lifecycle; Exhaustive state-machine and idempotency tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R072 — 6 — Rescheduling and cancellation policy; Atomic swap, fake-clock boundaries, audit history

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 6 — Rescheduling and cancellation policy; Atomic swap, fake-clock boundaries, audit history
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R073 — 7 — Customer and operator React flows; Accessible calendar/slot tests and conflict recovery

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 7 — Customer and operator React flows; Accessible calendar/slot tests and conflict recovery
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R074 — 8 — Reminders and wait list; Retry, dedupe, expiry, and race evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 8 — Reminders and wait list; Retry, dedupe, expiry, and race evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R075 — 9 — Calendar export and reports; Privacy review, stable contract, query plans

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 9 — Calendar export and reports; Privacy review, stable contract, query plans
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R076 — 10 — Security, operations, deployment; Threat model, graceful drain, observability and rollback

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 10 — Security, operations, deployment; Threat model, graceful drain, observability and rollback
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R077 — 11 — Maintenance change; Add group appointments or variable duration compatibly

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 11 — Maintenance change; Add group appointments or variable duration compatibly
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R078 — 12 — Release incident; Simulate zone misconfiguration; report, repair, and demo

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 12 — Release incident; Simulate zone misconfiguration; report, repair, and demo
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

## Stretch features

This adds complexity only after the core system is correct and provides a deliberate specialization challenge.

#### R079 — Group appointments with capacity and participant cancellation

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Group appointments with capacity and participant cancellation.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Trace creation, scheduling, settlement, propagation, and cleanup; include rejection and cancellation rather than testing only final success.

#### R080 — Multi-part appointments requiring resources at different stages

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Multi-part appointments requiring resources at different stages.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R081 — Deposits through a fake payment-provider adapter

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Deposits through a fake payment-provider adapter.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R082 — Travel time between locations and mobile providers

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Travel time between locations and mobile providers.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R083 — External calendar two-way synchronization and conflict resolution

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: External calendar two-way synchronization and conflict resolution.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.
