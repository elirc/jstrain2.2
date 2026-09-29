# 03 — Appointment and resource scheduling

## Product objective

Build a system where organizations publish services and availability, customers
book appointments requiring staff, rooms, or equipment, and operators manage
rescheduling, cancellation, reminders, and exceptions. The defining challenge
is making future civil time and exclusive resource allocation correct under
concurrent booking.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Organization administrator | Locations, services, policies, resources, members |
| Scheduler/manager | Availability, manual bookings, reassignment, exceptions |
| Service provider | Own schedule, appointment notes, completion/no-show actions |
| Customer | Discover slots; create, view, reschedule, and cancel own bookings |
| Reception viewer | Read daily schedules and check in customers |

Customers see only their records. Providers see appointments assigned to them,
with sensitive notes separated by permission. Administrative override actions
require reason and audit history.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization and location | Tenant, address, business time zone, opening rules |
| Service | Duration, buffer times, price snapshot rules, required resource kinds |
| Staff member | Membership, qualifications, home zone, active state |
| Resource | Room/equipment type, location, capacity, active state |
| Availability rule | Owner, local weekday/time range, effective dates, recurrence |
| Availability exception | Closure, absence, added hours, local interval, reason |
| Customer | Contact details, preferences, consent metadata |
| Appointment | Service, customer, instant interval, display zone, state, version |
| Appointment resource | Assigned staff/room/equipment with exclusive interval |
| Hold | Expiring provisional slot claim and idempotency key |
| Reminder | Appointment/channel/scheduled instant, delivery and dedupe state |
| Wait-list entry | Requested service/range/preferences and notification state |

Store appointment instants in UTC and preserve the IANA zone used to interpret
future local time. Do not store only an offset: offsets change with daylight
saving rules.

## Required workflows

### Configuration and availability

- Manage locations, services, qualified staff, rooms, and equipment.
- Define recurring weekly availability with effective date ranges.
- Add holidays, absences, closures, and one-off added availability.
- Services specify duration, before/after buffers, capacity, and required resources.
- Generate availability on demand for a bounded date range; never pre-create an
  unbounded calendar.

### Slot discovery and booking

- Search by service, location, staff preference, date range, and display zone.
- Intersect service rules, location hours, staff/resource availability, existing
  appointments, buffers, exceptions, and capacity.
- Create a short-lived hold before confirmation or atomically confirm directly.
- Prevent overlap at the database boundary where possible, not only in application code.
- Return an explicit conflict when a displayed slot has been taken.
- Repeated confirmation with the same idempotency key returns the original booking.

### Appointment lifecycle

- Confirm, check in, start, complete, mark no-show, cancel, and reschedule through
  valid state transitions.
- Apply configurable cancellation and rescheduling windows.
- Rescheduling claims the new resources and releases old ones atomically.
- Preserve original appointment and change history for audit and customer support.
- Administrative override requires permission and a reason.

### Customer and operator experience

- Customer receives a secure limited-purpose manage-booking link or authenticated view.
- Daily/weekly provider and resource calendars support time-zone display.
- Wait-list entries receive offers with expiration and race-safe acceptance.
- Export a standards-compatible calendar feed without exposing private notes.
- Report utilization, cancellation, no-show, lead time, and provider workload.

## API and UI requirements

Provide APIs for configuration, availability rules/exceptions, slot search,
holds, appointments and lifecycle commands, wait lists, reminders, calendars,
and reports. Slot-search responses include generated-at time, zone, duration,
and enough identity for safe confirmation without trusting the client as proof
of availability.

The React application needs:

- service/location selection and accessible slot grid/list alternatives;
- explicit time-zone display and a zone switch that does not change the instant;
- confirmation, conflict, expired-hold, cancellation-policy, and retry states;
- operator calendars navigable by keyboard without color-only status meaning;
- recurring-availability editor with readable rule preview;
- rescheduling UI that retains the original booking until replacement succeeds;
- check-in and daily schedule views resilient to live changes.

## Critical rules and failure cases

- Appointment intervals use a documented half-open convention such as `[start, end)`.
- Required resource intervals include configured buffers.
- A resource cannot have overlapping exclusive allocations; capacity resources
  cannot exceed capacity.
- DST skipped local times are rejected or moved only by an explicit product rule;
  ambiguous repeated times require the intended offset to be selected.
- Cancelling or expiring a hold is idempotent.
- Concurrent booking or wait-list acceptance yields at most one allocation.
- Provider deactivation cannot orphan future appointments without a migration workflow.
- Reminder delivery never changes appointment state and cannot duplicate on retry.

## Background work and integrations

- Hold-expiration worker that safely ignores confirmed or already expired holds.
- Reminder scheduling and delivery with customer preferences and quiet-hour rules.
- Wait-list offer creation, expiration, and next-candidate promotion.
- Calendar feed generation and a simulated external-calendar sync adapter.
- Daily stale-allocation check and schedule-integrity report.

## Required tests

Apply the shared standard and emphasize:

- table tests around DST gaps, repeated times, zones, leap day, and date boundaries;
- property tests for interval overlap and availability intersection;
- forced concurrent booking, hold expiration, and rescheduling tests;
- database exclusion/capacity constraint tests where supported;
- fake-clock tests for cancellation windows, reminders, and expired offers;
- authorization tests separating customer, provider, and private notes;
- accessibility tests for slot and calendar navigation;
- load testing popular-slot searches and simultaneous confirmations.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Locations, services, staff, resources | Constraint and authorization tests; usable admin CRUD |
| 2 | Weekly availability and exceptions | Zone/DST decision table and generation tests |
| 3 | Slot search | Intersection property tests and bounded query measurement |
| 4 | Holds and atomic booking | Deterministic last-slot concurrency evidence |
| 5 | Appointment lifecycle | Exhaustive state-machine and idempotency tests |
| 6 | Rescheduling and cancellation policy | Atomic swap, fake-clock boundaries, audit history |
| 7 | Customer and operator React flows | Accessible calendar/slot tests and conflict recovery |
| 8 | Reminders and wait list | Retry, dedupe, expiry, and race evidence |
| 9 | Calendar export and reports | Privacy review, stable contract, query plans |
| 10 | Security, operations, deployment | Threat model, graceful drain, observability and rollback |
| 11 | Maintenance change | Add group appointments or variable duration compatibly |
| 12 | Release incident | Simulate zone misconfiguration; report, repair, and demo |

## Stretch features

- Group appointments with capacity and participant cancellation.
- Multi-part appointments requiring resources at different stages.
- Deposits through a fake payment-provider adapter.
- Travel time between locations and mobile providers.
- External calendar two-way synchronization and conflict resolution.

## Completion defense

Demonstrate booking during a DST transition, two customers competing for one
slot, atomic rescheduling failure, hold expiration racing confirmation, and a
reminder retry. Explain the interval representation, database protection, time
zone decisions, and which consistency assumptions fail across multiple regions.

