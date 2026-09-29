# 02 — Multi-tenant project management platform — requirement coaching

Companion to [the build brief](../02-PROJECT-MANAGEMENT.md). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.

## Actors and permissions

This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.

#### R001 — Organization owner — Billing-free tenant settings, ownership transfer, all membership actions

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Organization owner — Billing-free tenant settings, ownership transfer, all membership actions
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R002 — Organization admin — Manage members, roles, projects, templates, and integrations

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Organization admin — Manage members, roles, projects, templates, and integrations
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R003 — Project manager — Configure one project, boards, workflows, and member access

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Project manager — Configure one project, boards, workflows, and member access
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R004 — Contributor — Create and update tasks, comments, attachments, and assigned work

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Contributor — Create and update tasks, comments, attachments, and assigned work
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R005 — Guest — Access only explicitly shared projects and restricted task fields

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Guest — Access only explicitly shared projects and restricted task fields
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R006 — Viewer — Read permitted projects without mutation

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Viewer — Read permitted projects without mutation
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

## Core data model

This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.

#### R007 — Organization — Tenant root, settings, slug, membership policy

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Organization — Tenant root, settings, slug, membership policy
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R008 — User and membership — User identity plus organization role and state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: User and membership — User identity plus organization role and state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R009 — Project — Organization, key, visibility, archived state, memberships

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Project — Organization, key, visibility, archived state, memberships
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R010 — Board and column — Ordered workflow surface; column may define WIP limit

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Board and column — Ordered workflow surface; column may define WIP limit
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R011 — Task — Project key/number, title, description, state, version, rank, dates

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Task — Project key/number, title, description, state, version, rank, dates
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R012 — Task assignment — Many-to-many users and tasks with assignment history

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Task assignment — Many-to-many users and tasks with assignment history
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R013 — Label and task label — Project-scoped categorization

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Label and task label — Project-scoped categorization
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R014 — Comment — Author, task, body, edited/deleted timestamps, visibility

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Comment — Author, task, body, edited/deleted timestamps, visibility
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R015 — Attachment — Metadata, object key, checksum, size, uploader, scan state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Attachment — Metadata, object key, checksum, size, uploader, scan state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R016 — Activity event — Immutable actor/action/resource summary and safe metadata

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Activity event — Immutable actor/action/resource summary and safe metadata
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R017 — Saved view — Owner/team visibility, filters, columns, sort specification

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Saved view — Owner/team visibility, filters, columns, sort specification
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R018 — Notification — Recipient, event, channel, read/delivery state, dedupe key

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Notification — Recipient, event, channel, read/delivery state, dedupe key
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

## Required workflows

This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.

### Organizations and membership

#### R019 — Create an organization and initial owner atomically

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create an organization and initial owner atomically.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R020 — Invite members with expiring single-use tokens and explicit role

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Invite members with expiring single-use tokens and explicit role.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R021 — Accept, revoke, resend, suspend, and remove memberships

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Accept, revoke, resend, suspend, and remove memberships.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R022 — Prevent removal of the final owner and define ownership transfer

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Prevent removal of the final owner and define ownership transfer.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R023 — Switching organizations must invalidate cached data from the previous tenant

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Switching organizations must invalidate cached data from the previous tenant.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

### Projects and boards

#### R024 — Create, edit, archive, restore, search, filter, and paginate projects

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create, edit, archive, restore, search, filter, and paginate projects.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R025 — Configure boards and ordered columns with unique names per board

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Configure boards and ordered columns with unique names per board.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R026 — Reorder columns and tasks using sparse ranks or another documented strategy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Reorder columns and tasks using sparse ranks or another documented strategy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R027 — Enforce optional WIP limits atomically during moves

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Enforce optional WIP limits atomically during moves.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R028 — Provide a project template that copies intended configuration but not history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Provide a project template that copies intended configuration but not history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Tasks and collaboration

#### R029 — Create and edit tasks with title, description, assignees, labels, priority,

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create and edit tasks with title, description, assignees, labels, priority,
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R030 — Support optimistic version checks and merge-friendly conflict messaging

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Support optimistic version checks and merge-friendly conflict messaging.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.

#### R031 — Add, edit, and soft-delete comments while preserving audit history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Add, edit, and soft-delete comments while preserving audit history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R032 — Upload bounded files through a storage adapter and track scan status

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Upload bounded files through a storage adapter and track scan status.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Treating every failure as 400 or 500 erases retry and conflict semantics; types also do not validate bytes received over the wire.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Write the wire contract first: method, path, headers, status, body, error, retry, and disconnect behavior; verify it through a real server boundary. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R033 — Mention authorized members and generate deduplicated notifications

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Mention authorized members and generate deduplicated notifications.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R034 — Record activity for meaningful changes without leaking private before-values

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Record activity for meaningful changes without leaking private before-values.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Search and views

#### R035 — Filter by assignee, label, state, priority, due range, creator, and text

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Filter by assignee, label, state, priority, due range, creator, and text.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R036 — Use deterministic pagination and encode sharable filters in the URL

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Use deterministic pagination and encode sharable filters in the URL.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R037 — Save personal or project-visible views with authorization checks

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Save personal or project-visible views with authorization checks.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R038 — Dashboard shows assigned, overdue, recently updated, and blocked work

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Dashboard shows assigned, overdue, recently updated, and blocked work.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R039 — Export a filtered project snapshot with a manifest and stable schema

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Export a filtered project snapshot with a manifest and stable schema.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

## API and UI requirements

This turns domain behavior into stable server contracts and honest, accessible client states.

#### R040 — an organization switcher that clears or namespaces client caches;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: an organization switcher that clears or namespaces client caches;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. A single loading flag or blanket invalidation usually hides request identity, freshness, rollback, and concurrent mutation semantics.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Define freshness and ownership, force out-of-order completion or conflict, and make invalidation and rollback visible to the user.

#### R041 — list and board views sharing the same canonical task data;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: list and board views sharing the same canonical task data;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R042 — accessible drag-and-drop plus complete keyboard move controls;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: accessible drag-and-drop plus complete keyboard move controls;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R043 — task details addressable by URL and usable without losing board context;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: task details addressable by URL and usable without losing board context;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R044 — optimistic edits with rollback and visible concurrent-change conflicts;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: optimistic edits with rollback and visible concurrent-change conflicts;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R045 — a filter builder, saved views, notification center, and activity timeline;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: a filter builder, saved views, notification center, and activity timeline;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R046 — permission and archived states that remain understandable from deep links

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: permission and archived states that remain understandable from deep links.
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

## Critical rules and failure cases

This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.

#### R047 — All tenant-owned rows carry or derive an organization ID, and queries cannot

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: All tenant-owned rows carry or derive an organization ID, and queries cannot
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R048 — Project keys and task numbers are unique within the intended scope

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Project keys and task numbers are unique within the intended scope.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R049 — Rank collisions and concurrent moves resolve deterministically

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Rank collisions and concurrent moves resolve deterministically.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R050 — WIP limits cannot be bypassed by concurrent writes or a bulk move

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: WIP limits cannot be bypassed by concurrent writes or a bulk move.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R051 — Users cannot assign, mention, invite, or expose attachments to unauthorized users

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Users cannot assign, mention, invite, or expose attachments to unauthorized users.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R052 — Retried invitations, uploads, notifications, and reorder commands are safe

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Retried invitations, uploads, notifications, and reorder commands are safe.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R053 — Archived tasks remain auditable but cannot accept ordinary mutation

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Archived tasks remain auditable but cannot accept ordinary mutation.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

## Background work and integrations

This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.

#### R054 — Notification fan-out with per-user preferences, deduplication, and batching

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Notification fan-out with per-user preferences, deduplication, and batching.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R055 — Attachment scanning simulation with quarantined/clean/failed states

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Attachment scanning simulation with quarantined/clean/failed states.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action.

#### R056 — Due-date reminders using recipient time zones and idempotent job keys

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Due-date reminders using recipient time zones and idempotent job keys.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R057 — Signed outbound webhooks with delivery attempts, retries, and dead letters

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Signed outbound webhooks with delivery attempts, retries, and dead letters.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R058 — Search indexing or materialized dashboard refresh with replay/rebuild support

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Search indexing or materialized dashboard refresh with replay/rebuild support.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Required tests

This supplies independent evidence against a named risk rather than measuring activity or line execution.

#### R059 — a generated authorization matrix across organizations, projects, roles, and guests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: a generated authorization matrix across organizations, projects, roles, and guests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R060 — randomized tenant-isolation tests over repository query methods;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: randomized tenant-isolation tests over repository query methods;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R061 — forced concurrent task moves, edits, and WIP-limit attempts;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: forced concurrent task moves, edits, and WIP-limit attempts;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R062 — accessible pointer and keyboard board interactions;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: accessible pointer and keyboard board interactions;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R063 — stale cache tests during organization switching and permission revocation;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: stale cache tests during organization switching and permission revocation;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R064 — webhook and notification idempotency tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: webhook and notification idempotency tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R065 — attachment authorization, size, type, traversal, and scan-state tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: attachment authorization, size, type, traversal, and scan-state tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R066 — query-plan checks for task search and dashboard workload

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: query-plan checks for task search and dashboard workload.
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

## Delivery plan

This keeps the project shippable through vertical increments with concrete exit evidence.

#### R067 — 1 — Organizations, users, memberships; Tenant-scoped repository contract and isolation tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 1 — Organizations, users, memberships; Tenant-scoped repository contract and isolation tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R068 — 2 — Projects and project permissions; Deep-link denial behavior and authorization matrix

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 2 — Projects and project permissions; Deep-link denial behavior and authorization matrix
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R069 — 3 — Boards, columns, tasks; Complete vertical CRUD flow with accessible forms

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 3 — Boards, columns, tasks; Complete vertical CRUD flow with accessible forms
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R070 — 4 — Ordering, moves, WIP limits; Deterministic race tests and keyboard movement

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 4 — Ordering, moves, WIP limits; Deterministic race tests and keyboard movement
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R071 — 5 — Assignment, labels, comments; Activity history and cross-project denial tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 5 — Assignment, labels, comments; Activity history and cross-project denial tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R072 — 6 — Filters, pagination, saved views; Stable result/query-plan and URL-state evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 6 — Filters, pagination, saved views; Stable result/query-plan and URL-state evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible.

#### R073 — 7 — Optimistic edits and conflicts; Out-of-order and stale-version UI tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 7 — Optimistic edits and conflicts; Out-of-order and stale-version UI tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R074 — 8 — Attachments and notifications; Scan/retry/deduplication and authorization evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 8 — Attachments and notifications; Scan/retry/deduplication and authorization evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R075 — 9 — Webhooks and background jobs; Signed delivery, backoff, replay, and dead letters

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 9 — Webhooks and background jobs; Signed delivery, backoff, replay, and dead letters
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R076 — 10 — Observability, security, deployment; Threat model, tenant-safe logs, shutdown and rollback

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 10 — Observability, security, deployment; Threat model, tenant-safe logs, shutdown and rollback
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state.

#### R077 — 11 — Maintenance request; Compatible addition of custom fields or guest restrictions

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 11 — Maintenance request; Compatible addition of custom fields or guest restrictions
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R078 — 12 — Release and incident; Permission-revocation incident, report, demo, defense

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 12 — Release and incident; Permission-revocation incident, report, demo, defense
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

## Stretch features

This adds complexity only after the core system is correct and provides a deliberate specialization challenge.

#### R079 — Configurable custom fields with typed values and indexed search

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Configurable custom fields with typed values and indexed search.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R080 — Task dependencies and cycle detection

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Task dependencies and cycle detection.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R081 — Offline-capable board operations with synchronization conflicts

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Offline-capable board operations with synchronization conflicts.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R082 — Organization audit export and retention policies

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Organization audit export and retention policies.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R083 — Real-time updates through server-sent events or WebSockets

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Real-time updates through server-sent events or WebSockets.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
