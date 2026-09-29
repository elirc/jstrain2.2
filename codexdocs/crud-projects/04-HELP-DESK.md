# 04 — Help desk and incident management

## Product objective

Build a multi-organization support platform for incoming requests, ticket
queues, assignment, public and internal communication, service-level targets,
escalations, incidents, knowledge articles, and operational reporting. The
project emphasizes workflow, authorization, inbound integration, deadlines,
search, and evidence-rich operations.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Platform administrator | Cross-tenant operational support with audited elevation only |
| Organization administrator | Members, teams, roles, forms, SLA policies, integrations |
| Support manager | Queues, assignment rules, escalation, reports, quality review |
| Agent | Work assigned/permitted tickets, internal notes, responses, incidents |
| Requester | Create and view own/organization-visible tickets and public replies |
| Knowledge editor | Draft, review, publish, archive articles |

Requester organizations may choose whether colleagues can see shared tickets.
Internal notes, audit metadata, other customers, and security fields must never
appear in requester responses or search.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization, user, membership | Tenant root, role, team memberships |
| Team and queue | Agent groups, routing configuration, operating schedule |
| Ticket | Number, requester, subject, status, priority, type, assignee, version |
| Ticket message | Public reply or internal note, author, channel, attachments |
| Ticket event | Immutable lifecycle, assignment, field-change, and SLA history |
| SLA policy | Conditions, response/resolution targets, business calendar |
| SLA instance | Ticket target instants, pause intervals, breach state |
| Tag and custom field | Organization-scoped categorization and configured values |
| Incident | Severity, commander, timeline, impacted services, linked tickets |
| Knowledge article | Draft/published revisions, audience, category, author/reviewer |
| Inbound message | Provider ID, raw-reference metadata, parse/link/dedupe state |
| Webhook delivery | Subscription, event, attempt, signature, state |

Ticket events should support reconstruction of significant history without
forcing every read to replay the full stream.

## Required workflows

### Ticket intake and triage

- Create tickets through the application, authenticated API, and simulated email ingestion.
- Normalize channel-specific input into one command while retaining safe source metadata.
- Deduplicate inbound messages by provider identity and content/message identifiers.
- Apply configurable defaults and simple assignment rules by type, priority, or tags.
- Search, filter, sort, paginate, bulk-assign, and bulk-tag with bounded operations.

### Ticket lifecycle and communication

- Support new, open, pending-customer, pending-internal, resolved, closed, and
  reopened states through named transitions.
- Add public replies and internal notes with visibly distinct UI and permission checks.
- Assign/reassign teams and agents while recording actor, reason, and timestamps.
- Prevent lost edits using versions; merge append-only replies naturally.
- Link duplicates, parent/child work, related incidents, and knowledge articles.
- Reopening and closure follow explicit policy and retain the complete history.

### SLA and escalation

- Select an SLA policy from ticket attributes at creation or defined recalculation points.
- Compute first-response and resolution targets using business hours, holidays, and zone.
- Pause only for configured statuses and preserve accumulated elapsed time.
- Escalate approaching and breached targets exactly once per threshold.
- Policy edits must not silently rewrite historical targets unless explicitly recalculated.

### Incidents and knowledge

- Declare an incident, assign roles/severity, maintain a timestamped timeline, and link tickets.
- Post internal updates and sanitized requester-facing status updates.
- Draft, review, publish, revise, search, and archive knowledge articles.
- Published URLs retain stable identity while revisions remain auditable.
- Suggest relevant articles during intake without exposing restricted content.

### Reporting

- Queue age, first response, resolution time, reopen rate, backlog, and SLA breach rate.
- Report definitions state whether time is calendar or business time and how percentiles work.
- Saved filters and CSV exports honor the requesting user's authorization.
- Operational dashboard distinguishes delayed ingestion from truly low volume.

## API and UI requirements

Provide APIs for memberships, teams, queues, tickets, messages, transitions,
assignment, bulk commands, SLAs, incidents, knowledge, ingestion, webhooks, and
reports. External events use stable event IDs and documented versioned payloads.

The React application needs:

- queue view with URL-addressable filters, pagination, selection, and bulk actions;
- split ticket workspace with history, public reply, internal note, and requester context;
- conspicuous visibility indicators and confirmation for sensitive message types;
- SLA clocks that state their basis and do not rely on client time for enforcement;
- optimistic assignment with conflict recovery;
- incident command view and accessible timeline;
- knowledge editor with draft/published preview and revision comparison;
- requester portal exposing only the permitted public projection.

## Critical rules and failure cases

- Ticket numbers are unique per organization and cannot be reassigned.
- Public and internal projections are separately constructed and tested.
- SLA target calculation is deterministic from policy, calendar, and recorded events.
- Duplicate inbound delivery never creates duplicate tickets or messages.
- Replies received after closure follow a defined reopen-or-append policy.
- Bulk actions authorize every target and define atomic versus partial-success behavior.
- Concurrent assignment or resolution produces explicit conflict rather than silent overwrite.
- Webhook payloads and logs exclude internal/private content unless the subscription permits it.

## Background work and integrations

- Inbound email/message parser with quarantine for malformed or oversized input.
- SLA threshold scheduler and escalation notification worker.
- Signed outbound webhooks with durable delivery attempts and replay controls.
- Search index/update worker with a full rebuild path.
- Scheduled report exports and retention/anonymization jobs.

## Required tests

Apply the shared standard and emphasize:

- projection tests proving internal notes never reach requester/API/search/webhooks;
- business-calendar tests across weekends, holidays, DST, pause, reopen, and policy changes;
- duplicate and out-of-order inbound-message tests;
- authorization matrices for role, team, requester organization, and ticket visibility;
- forced conflicts for assignment, status, bulk operations, and append-only messages;
- webhook signature, retry, event-version, and redaction tests;
- report fixtures guarding percentile definitions and join multiplication;
- an incident-load scenario with ingestion lag and queue growth.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Organizations, users, teams, ticket intake | Tenant isolation and complete create/read slice |
| 2 | Queue filtering and assignment | Stable pagination, query plan, version conflicts |
| 3 | Lifecycle, replies, internal notes | State and projection security tests |
| 4 | Requester portal and attachments | Cross-role authorization and accessible flows |
| 5 | SLA policies and calendars | Boundary decision table and deterministic target tests |
| 6 | Escalation worker | Fake-clock, dedupe, retry, dead-letter evidence |
| 7 | Email ingestion | Duplicate, malformed, reply-linking, quarantine tests |
| 8 | Incidents and knowledge | Revision/audience permissions and timeline evidence |
| 9 | Reports and webhooks | Aggregate correctness, signatures, versioning, replay |
| 10 | Security, observability, deployment | Threat model, redaction audit, shutdown and restore |
| 11 | Ambiguous change | Add shared requester visibility or custom fields safely |
| 12 | Release incident | Simulate ingestion backlog; diagnose, recover, and report |

## Stretch features

- Skills-based or load-aware automatic assignment.
- Collision presence and real-time ticket updates.
- Configurable forms and typed custom fields.
- Customer satisfaction surveys with privacy controls.
- Incident public status page with controlled publication.

## Completion defense

Demonstrate duplicate inbound messages, requester/internal projections, a
business-hours SLA crossing a holiday, concurrent reassignment, a webhook
retry, and an ingestion backlog incident. Explain the audit model, deadline
calculation, privacy boundaries, and recovery strategy.

