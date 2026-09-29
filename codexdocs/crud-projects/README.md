# Production-shaped CRUD project briefs

These eight briefs turn familiar CRUD domains into portfolio projects that
exercise mid-level engineering judgment. The goal is not to build eight large
applications. Build one primary project deeply, then use selected increments
from one or two others to target weaknesses.

## Recommended choice

Start with **Inventory and order management**. It has the widest useful mix of
transactions, concurrency, authorization, reporting, imports, background
work, and operational failure modes. Choose scheduling if time and race
conditions are your largest weakness; choose project management if React state
and multi-tenant authorization are the priority.

## Project index

| # | Project | Strongest learning areas | Relative difficulty |
| --- | --- | --- | --- |
| 01 | [Inventory and order management](01-INVENTORY-AND-ORDERS.md) | Transactions, stock invariants, concurrency, reports | High |
| 02 | [Multi-tenant project management](02-PROJECT-MANAGEMENT.md) | Tenant isolation, React interactions, ordering, permissions | High |
| 03 | [Appointment and resource scheduling](03-APPOINTMENT-SCHEDULING.md) | Time zones, overlap prevention, recurrence, races | Very high |
| 04 | [Help desk and incident management](04-HELP-DESK.md) | Workflow, SLAs, queues, ingestion, metrics | High |
| 05 | [Learning management system](05-LEARNING-MANAGEMENT.md) | Hierarchies, publishing, grading, progress | Medium-high |
| 06 | [Expense and approval platform](06-EXPENSE-APPROVALS.md) | Money, auditability, configurable workflows | High |
| 07 | [Property maintenance platform](07-PROPERTY-MAINTENANCE.md) | Cross-role workflows, files, scheduling, vendors | Medium-high |
| 08 | [E-commerce operations platform](08-ECOMMERCE-OPERATIONS.md) | Idempotency, payments, inventory, webhooks | Very high |

Read [the shared delivery standard](00-SHARED-DELIVERY-STANDARD.md) before a
brief. It defines the stack-neutral quality bar that applies to every project.
Use [PORTFOLIO-ROUTE.md](PORTFOLIO-ROUTE.md) to select a project and sequence
the work, and [PROGRESS.md](PROGRESS.md) to track evidence.

The [explained-requirements index](explanations/README.md) adds four coaching
layers to every enumerated project problem: engineering intent, acceptance
evidence, the failure to avoid, and implementation guidance. Use those notes
while turning a brief into tickets, after first deciding what you think the
requirement means.

## How to use a brief

1. Write assumptions for every unclear requirement; do not silently invent
   behavior.
2. Deliver increments in order. Each increment must produce a working vertical
   slice, not unfinished layers.
3. Create a small pull request or reviewable diff for every increment.
4. Complete required tests and operational evidence before stretch features.
5. Keep an ADR, learning log, and AI decision log throughout.
6. Demo the project as a user, engineer, reviewer, and operator.

If one study format prevents progress, use the
[project-learning adaptations](../learning-modes/PROJECT-ADAPTATIONS.md) to
enter through examples, visuals, teach-back, challenges, structure,
collaboration, or capacity-sized slices while preserving the same engineering
requirements.

## Scope rule

The required scope is intentionally larger than a tutorial but smaller than a
commercial product. When time is limited, preserve domain correctness,
security, tests, and operational behavior. Cut decorative dashboards, complex
animations, and unnecessary integrations first.
