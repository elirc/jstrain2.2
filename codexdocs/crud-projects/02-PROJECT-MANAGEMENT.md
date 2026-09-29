# 02 — Multi-tenant project management platform

## Product objective

Build a collaboration system where organizations manage members, projects,
boards, columns, tasks, comments, labels, attachments, saved views, and
notifications. The main challenges are tenant isolation, fine-grained access,
interactive ordering, concurrent edits, and maintaining useful activity history.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Organization owner | Billing-free tenant settings, ownership transfer, all membership actions |
| Organization admin | Manage members, roles, projects, templates, and integrations |
| Project manager | Configure one project, boards, workflows, and member access |
| Contributor | Create and update tasks, comments, attachments, and assigned work |
| Guest | Access only explicitly shared projects and restricted task fields |
| Viewer | Read permitted projects without mutation |

Users may belong to several organizations. Every request must resolve the
organization from membership and verify project-level access. Guests must not
discover other projects, members, attachments, or search results.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization | Tenant root, settings, slug, membership policy |
| User and membership | User identity plus organization role and state |
| Project | Organization, key, visibility, archived state, memberships |
| Board and column | Ordered workflow surface; column may define WIP limit |
| Task | Project key/number, title, description, state, version, rank, dates |
| Task assignment | Many-to-many users and tasks with assignment history |
| Label and task label | Project-scoped categorization |
| Comment | Author, task, body, edited/deleted timestamps, visibility |
| Attachment | Metadata, object key, checksum, size, uploader, scan state |
| Activity event | Immutable actor/action/resource summary and safe metadata |
| Saved view | Owner/team visibility, filters, columns, sort specification |
| Notification | Recipient, event, channel, read/delivery state, dedupe key |

Use stable opaque IDs externally and a human-friendly project key plus task
number for URLs. Define whether archived resources appear in lookup and search.

## Required workflows

### Organizations and membership

- Create an organization and initial owner atomically.
- Invite members with expiring single-use tokens and explicit role.
- Accept, revoke, resend, suspend, and remove memberships.
- Prevent removal of the final owner and define ownership transfer.
- Switching organizations must invalidate cached data from the previous tenant.

### Projects and boards

- Create, edit, archive, restore, search, filter, and paginate projects.
- Configure boards and ordered columns with unique names per board.
- Reorder columns and tasks using sparse ranks or another documented strategy.
- Enforce optional WIP limits atomically during moves.
- Provide a project template that copies intended configuration but not history.

### Tasks and collaboration

- Create and edit tasks with title, description, assignees, labels, priority,
  due date, and column/state.
- Support optimistic version checks and merge-friendly conflict messaging.
- Add, edit, and soft-delete comments while preserving audit history.
- Upload bounded files through a storage adapter and track scan status.
- Mention authorized members and generate deduplicated notifications.
- Record activity for meaningful changes without leaking private before-values.

### Search and views

- Filter by assignee, label, state, priority, due range, creator, and text.
- Use deterministic pagination and encode sharable filters in the URL.
- Save personal or project-visible views with authorization checks.
- Dashboard shows assigned, overdue, recently updated, and blocked work.
- Export a filtered project snapshot with a manifest and stable schema.

## API and UI requirements

Provide APIs for organizations, memberships, invitations, projects, boards,
columns, tasks, assignments, labels, comments, attachments, activities, saved
views, and notifications. Bulk moves and reorders need explicit contracts and
version/conflict behavior.

The React application needs:

- an organization switcher that clears or namespaces client caches;
- list and board views sharing the same canonical task data;
- accessible drag-and-drop plus complete keyboard move controls;
- task details addressable by URL and usable without losing board context;
- optimistic edits with rollback and visible concurrent-change conflicts;
- a filter builder, saved views, notification center, and activity timeline;
- permission and archived states that remain understandable from deep links.

## Critical rules and failure cases

- All tenant-owned rows carry or derive an organization ID, and queries cannot
  accidentally omit the tenant boundary.
- Project keys and task numbers are unique within the intended scope.
- Rank collisions and concurrent moves resolve deterministically.
- WIP limits cannot be bypassed by concurrent writes or a bulk move.
- Users cannot assign, mention, invite, or expose attachments to unauthorized users.
- Retried invitations, uploads, notifications, and reorder commands are safe.
- Archived tasks remain auditable but cannot accept ordinary mutation.

## Background work and integrations

- Notification fan-out with per-user preferences, deduplication, and batching.
- Attachment scanning simulation with quarantined/clean/failed states.
- Due-date reminders using recipient time zones and idempotent job keys.
- Signed outbound webhooks with delivery attempts, retries, and dead letters.
- Search indexing or materialized dashboard refresh with replay/rebuild support.

## Required tests

Apply the shared standard and emphasize:

- a generated authorization matrix across organizations, projects, roles, and guests;
- randomized tenant-isolation tests over repository query methods;
- forced concurrent task moves, edits, and WIP-limit attempts;
- accessible pointer and keyboard board interactions;
- stale cache tests during organization switching and permission revocation;
- webhook and notification idempotency tests;
- attachment authorization, size, type, traversal, and scan-state tests;
- query-plan checks for task search and dashboard workload.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Organizations, users, memberships | Tenant-scoped repository contract and isolation tests |
| 2 | Projects and project permissions | Deep-link denial behavior and authorization matrix |
| 3 | Boards, columns, tasks | Complete vertical CRUD flow with accessible forms |
| 4 | Ordering, moves, WIP limits | Deterministic race tests and keyboard movement |
| 5 | Assignment, labels, comments | Activity history and cross-project denial tests |
| 6 | Filters, pagination, saved views | Stable result/query-plan and URL-state evidence |
| 7 | Optimistic edits and conflicts | Out-of-order and stale-version UI tests |
| 8 | Attachments and notifications | Scan/retry/deduplication and authorization evidence |
| 9 | Webhooks and background jobs | Signed delivery, backoff, replay, and dead letters |
| 10 | Observability, security, deployment | Threat model, tenant-safe logs, shutdown and rollback |
| 11 | Maintenance request | Compatible addition of custom fields or guest restrictions |
| 12 | Release and incident | Permission-revocation incident, report, demo, defense |

## Stretch features

- Configurable custom fields with typed values and indexed search.
- Task dependencies and cycle detection.
- Offline-capable board operations with synchronization conflicts.
- Organization audit export and retention policies.
- Real-time updates through server-sent events or WebSockets.

## Completion defense

Demonstrate two tenants with overlapping names and IDs, a guest with restricted
visibility, concurrent movement into a WIP-limited column, an edit conflict,
and revocation while a session is active. Explain how every query maintains
tenant isolation and how ordering behaves under sustained concurrent changes.

