# 06 — Expense and approval platform

## Product objective

Build a multi-organization system where employees record expenses and receipts,
submit reports through configurable approval chains, finance reviews policy and
duplicates, and approved reports become reimbursement batches. The central
challenges are exact money, immutable audit history, policy versions, dynamic
workflow, sensitive files, and idempotent external processing.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Organization administrator | Members, roles, cost centers, policies, currencies |
| Employee | Own draft expenses/reports, submission, correction, status viewing |
| Manager approver | Review reports routed to them; approve, reject, request changes |
| Finance reviewer | Policy exceptions, final approval, batches, exports, reconciliation |
| Auditor | Read immutable records and evidence without workflow mutation |

An approver cannot approve their own report unless an explicit exceptional
policy permits it. Delegation has effective dates, scope, and audit history.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization, user, membership | Tenant, role, manager relationship |
| Cost center and project code | Active accounting dimensions and owner |
| Expense | Date, merchant, category, amount/currency, purpose, allocation, version |
| Receipt | Object metadata, checksum, scan/extraction state, linked expense |
| Expense report | Owner, title, state, totals, policy snapshot, submission version |
| Policy and revision | Effective range, limits, receipt rules, approval definition |
| Policy finding | Rule, severity, evidence, waived-by/reason |
| Approval step | Sequence/parallel group, assigned approver, decision, timestamps |
| Delegation | Approver, delegate, scope, effective interval |
| Reimbursement batch | Currency/entity, included reports, export and settlement state |
| Audit event | Append-only actor/action/resource and safe before/after summary |
| Exchange rate | Currency pair, date/source, decimal rate, locked snapshot |

Store original amount/currency, conversion rate snapshot, and reimbursable base
amount. Never recalculate historical reports from the latest rate.

## Required workflows

### Expense capture

- Create, edit, split, copy, delete, categorize, search, filter, and paginate draft expenses.
- Upload receipt images/PDFs with scan state and duplicate checksum warning.
- Optionally simulate OCR extraction; user must confirm extracted values.
- Allocate an expense across cost centers/projects while preserving exact total.
- Detect likely duplicates using amount, date, merchant, owner, and receipt checksum;
  warning does not silently delete either expense.

### Reports and policy evaluation

- Group eligible draft expenses into one currency-aware report.
- Evaluate receipt requirements, category limits, age, weekend, duplicate, allocation,
  and required-field rules against a versioned policy.
- Findings distinguish blocking error, warning, and approval-required exception.
- Submission freezes relevant expense values and policy/rate snapshots.
- Request-changes returns the report to an editable revision while preserving the
  prior submission and decisions.

### Approval workflow

- Generate approval steps from amount, cost center, manager hierarchy, and findings.
- Support sequential steps and one bounded parallel-approval case.
- Resolve delegations at assignment time and retain original/delegated identities.
- Approve, reject, request changes, reassign administratively, and record comments.
- Concurrent decisions settle once and return a conflict for stale actions.
- Policy/workflow changes affect new submissions, not in-flight reports, unless
  an explicit migration operation is performed.

### Reimbursement and reconciliation

- Finance selects approved reports into a currency/entity-specific batch.
- Batch locking prevents a report entering two active reimbursements.
- Generate a deterministic provider export and checksum through an adapter.
- Import or simulate settlement results idempotently, including partial failures.
- Reconcile batch totals with member reports and preserve correction entries.

### Reporting

- Spend by period, category, cost center, project, employee, and policy finding.
- Approval aging and bottleneck analysis.
- Outstanding liabilities and reimbursement status.
- Audit export with redaction policy and access logging.

## API and UI requirements

Provide APIs for policies/revisions, dimensions, expenses, receipts, reports,
submissions, findings, approval commands, delegations, batches, settlement,
audit, and reports. Monetary fields use documented strings or integer minor
units across JSON; never binary floating-point calculations.

The React application needs:

- rapid expense entry and accessible split/allocation editing;
- receipt upload with scan progress, preview authorization, and failure recovery;
- report builder showing totals, excluded expenses, findings, and exact rounding;
- approver inbox with delegation context, evidence, history, and conflict state;
- finance batch builder with locked totals and partial-settlement handling;
- employee status timeline and clear request-changes workflow;
- report filters in URLs and privacy-aware export controls.

## Critical rules and failure cases

- Expense allocations sum exactly to the expense base amount using a documented
  remainder rule.
- Submitted values, rates, policies, and approval plans are immutable snapshots.
- Self-approval, cross-tenant access, and unauthorized receipt download are denied.
- A report cannot be submitted with an expense already on another submitted report.
- Approval and settlement commands are versioned and idempotent.
- Reject/request-changes/approve transitions are exhaustive and auditable.
- Batch totals equal included immutable report totals; corrections use new entries.
- Logs and exports minimize personal, merchant, and receipt data.

## Background work and integrations

- Receipt scan/OCR simulation with quarantine and bounded retry.
- Daily exchange-rate import with source validation and missing-rate visibility.
- Approval reminders and escalation with delegation awareness.
- Reimbursement export/settlement provider adapter with durable idempotency.
- Retention job for rejected uploads and expired exports.

## Required tests

Apply the shared standard and emphasize:

- property tests for money allocation, summation, conversion, and rounding;
- policy decision tables at thresholds, dates, currencies, and missing receipts;
- generated authorization matrix and self-approval negative tests;
- concurrent submission, decision, delegation, and batch-inclusion tests;
- immutable snapshot tests across policy and exchange-rate changes;
- idempotent partial settlement and reconciliation tests;
- receipt upload/access/malware-state security tests;
- migration tests for policy evolution and exact historical totals.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Identity, dimensions, expense CRUD | Tenant ownership and exact-money tests |
| 2 | Receipts and allocations | File authorization and allocation properties |
| 3 | Reports and versioned submission | Snapshot and duplicate-membership evidence |
| 4 | Policy rules and findings | Boundary decision tables and explainable outcomes |
| 5 | Approval workflow and delegation | Self-approval denial and concurrent-decision tests |
| 6 | Request changes and resubmission | Complete historical revisions and audit projection |
| 7 | Reimbursement batches | Exclusive inclusion, deterministic export, checksum |
| 8 | Settlement and reconciliation | Idempotent partial-result recovery |
| 9 | React workflows and reports | Accessibility, privacy, query plans, conflict UX |
| 10 | Security, operations, deployment | Threat model, redaction, restore and shutdown |
| 11 | Maintenance request | Add parallel approvals or new currency compatibility |
| 12 | Release incident | Duplicate-settlement drill, recovery, report, defense |

## Stretch features

- Per-diem and mileage claims with effective-dated rates.
- Corporate-card transaction matching.
- Multi-entity intercompany allocation.
- Budget warning and approval routing.
- Privacy-aware anomaly scoring with explainable signals.

## Completion defense

Demonstrate a precisely allocated multi-currency expense, a policy change after
submission, delegated approval without self-approval, competing batch inclusion,
and duplicate settlement delivery. Explain money representation, snapshotting,
workflow generation, auditability, and provider recovery.

