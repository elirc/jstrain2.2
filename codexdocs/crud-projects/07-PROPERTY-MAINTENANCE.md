# 07 — Property maintenance platform

## Product objective

Build a system connecting tenants, property managers, technicians, and external
vendors from maintenance request through triage, estimate, scheduling, work,
inspection, invoice, and closure. The project emphasizes cross-role data
visibility, workflow, files, scheduling, vendor access, cost approval, and a
complete communication/audit trail.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Portfolio administrator | Organizations, properties, members, vendors, policies |
| Property manager | Units, occupants, requests, assignments, estimates, invoices |
| Tenant/occupant | Own-unit requests, public updates, appointments, completion feedback |
| Internal technician | Assigned work orders, schedule, notes, parts, completion evidence |
| Vendor coordinator | Vendor users, assignment acceptance, estimates, invoices |
| Vendor worker | Only explicitly assigned work and vendor-visible communication |
| Finance viewer | Approved costs, invoices, exports; limited tenant details |

Tenant contact/access instructions and internal property notes are separate
projections. Vendor users cannot browse other properties, units, occupants,
work orders, bids, or internal comments.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Portfolio/organization | Tenant root and settings |
| Property and unit | Address, zone, manager, active state, unit identifiers |
| Occupancy | User/tenant, unit, effective interval, contact/access preferences |
| Maintenance request | Reporter, unit, category, urgency, description, version |
| Work order | Request, state, priority, assignee/vendor, target dates, costs |
| Work-order event | Immutable state, assignment, communication, and cost history |
| Comment | Tenant-visible, vendor-visible, or internal visibility |
| Attachment | Evidence metadata, uploader, visibility, scan state |
| Appointment window | Work order, local interval/zone, participants, state |
| Estimate | Vendor, line items, amount, expiry, submitted/approved/rejected state |
| Invoice | Work performed, line items, amount, review/payment-export state |
| Asset | Optional appliance/system in a unit with service history |
| Vendor | Services, coverage, insurance expiry, active/suspended state |

Occupancy is effective-dated so historical requests retain the correct party
without granting former occupants current access.

## Required workflows

### Property and access setup

- Manage properties, units, occupancy periods, managers, assets, and vendors.
- Prevent overlapping active occupancy where the selected domain disallows it.
- Invite tenant/vendor users through expiring, scoped invitations.
- Suspend vendor access without deleting work history.
- Alert on vendor insurance/certification expiry and prevent new assignment by policy.

### Intake and triage

- Tenant creates a request with category, description, access permission, preferred
  times, and bounded photos/video metadata.
- Detect likely duplicate open requests for the same unit/asset and let a manager link them.
- Triage urgency and responsibility; emergency paths show explicit safety instructions.
- Convert an accepted request to a work order exactly once.
- Reject or merge requests while preserving tenant-visible reasoning and history.

### Assignment, estimate, and approval

- Assign an internal technician or invite one or more permitted vendors to estimate.
- Vendor accepts/declines without gaining broader property access.
- Submit versioned estimate line items and supporting files.
- Auto-approve below a configured threshold; route larger estimates for approval.
- Choose an estimate, reject alternatives, and preserve all bids for audit.
- Reassignment records reason and handles scheduled appointments explicitly.

### Scheduling and execution

- Offer appointment windows consistent with property zone, occupancy preferences,
  assignee availability, and required notice.
- Prevent assignee overlap and resolve concurrent slot acceptance.
- Check in, start, pause, complete, and reopen work through explicit transitions.
- Record labor, parts, notes, before/after evidence, and tenant-visible summaries.
- Require completion fields by category and optionally manager inspection.

### Invoicing and closure

- Create invoice from approved estimate/work with documented variance rules.
- Require approval when invoice exceeds estimate tolerance.
- Mark export/paid status through an idempotent accounting adapter simulation.
- Tenant confirms resolution or reopens within a configured window.
- Close only when required work, approval, communication, and invoice conditions hold.

### Reporting

- Open work by age, property, category, urgency, assignee, and vendor.
- Response/completion time, reopen rate, vendor acceptance, estimate variance, cost by asset.
- Separate calendar and business-time metrics with documented definitions.
- Export only fields permitted for the operator's portfolio role.

## API and UI requirements

Provide APIs for properties, units, occupancies, assets, vendors, requests,
triage commands, work orders, assignments, estimates, appointments, work logs,
attachments, invoices, feedback, and reports.

The React application needs:

- mobile-first tenant intake with upload recovery and emergency guidance;
- manager queues with URL filters, bulk assignment, age indicators, and conflicts;
- separate internal, vendor, and tenant communication composers with strong visibility cues;
- vendor portal exposing only assigned work, estimates, appointments, and invoices;
- accessible calendar/list scheduling and zone display;
- technician mobile workflow tolerant of temporary network loss without claiming full offline sync;
- cost/estimate/invoice comparison and approval history;
- tenant timeline containing only public events and authorized files.

## Critical rules and failure cases

- Every read and mutation verifies portfolio/property/unit relationship and current role.
- Visibility is allow-listed; internal content never reaches tenant/vendor projections.
- State transitions and reopen rules are exhaustive.
- A request converts to at most one primary work order unless an explicit split is recorded.
- Estimate/invoice money is exact and approved snapshots are immutable.
- Appointment allocation prevents overlap and handles zone/DST boundaries.
- Duplicate invitations, assignment responses, accounting results, and uploads are idempotent.
- Former occupants lose current access but retain legally required historical access policy.

## Background work and integrations

- Attachment scan/thumbnail simulation with quarantine.
- Appointment reminders and overdue escalation with dedupe.
- Vendor credential-expiry and SLA-warning jobs.
- Accounting export/result adapter with retries and reconciliation.
- Maintenance history export and retention/redaction jobs.

## Required tests

Apply the shared standard and emphasize:

- visibility projection tests across tenant, former tenant, vendor, technician, manager, finance;
- effective-dated occupancy and invitation authorization tests;
- concurrent request conversion, estimate approval, scheduling, and invoice result tests;
- exact-money estimate/invoice variance decision tables;
- time-zone, notice-window, and overlap tests;
- file ownership, visibility, type, size, scan, and expired-access tests;
- workflow property tests or exhaustive transition tables;
- mobile-width accessibility and interrupted-upload/update recovery.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Properties, units, occupancy, roles | Effective-date and cross-role authorization tests |
| 2 | Tenant requests and files | Mobile accessible flow and private-file protection |
| 3 | Triage and work-order conversion | Idempotency, duplicate linking, transition evidence |
| 4 | Assignment and vendor portal | Narrow projection and revoked-vendor tests |
| 5 | Estimates and approval | Exact totals, thresholds, concurrent-decision tests |
| 6 | Scheduling | Zone/notice/overlap and last-slot race evidence |
| 7 | Work execution and communication | Visibility matrix and completion requirements |
| 8 | Invoice and closure | Variance, reopening, idempotent export tests |
| 9 | Reports and operational jobs | Aggregate/query-plan and dedupe/dead-letter evidence |
| 10 | Security, deployment, recovery | Threat model, redaction, restore and shutdown |
| 11 | Maintenance request | Add assets/preventive work without breaking histories |
| 12 | Release incident | Private-note exposure drill, repair, report, defense |

## Stretch features

- Preventive maintenance generated from asset schedules.
- Vendor bidding deadline and blinded bid comparison.
- Parts inventory linked to work orders.
- Map-based technician routing behind an external adapter.
- Limited offline outbox with explicit merge/conflict behavior.

## Completion defense

Demonstrate former-tenant access behavior, vendor isolation, a private/public
comment boundary, concurrent appointment acceptance, estimate/invoice variance,
and duplicate accounting delivery. Explain effective-dated permissions, file
security, workflow history, and how an exposure incident is detected.

