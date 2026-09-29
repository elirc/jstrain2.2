# 05 — Learning management system — requirement coaching

Companion to [the build brief](../05-LEARNING-MANAGEMENT.md). It gives every enumerated actor, entity, workflow, interface, invariant, job, test, increment, and stretch problem four explanations: engineering intent, acceptance evidence, failure to avoid, and implementation guidance.

## Actors and permissions

This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility.

#### R001 — Platform/organization administrator — Users, catalogs, policies, reporting, support elevation

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Platform/organization administrator — Users, catalogs, policies, reporting, support elevation
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R002 — Course owner — Course settings, collaborators, publishing, archive, enrollment rules

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Course owner — Course settings, collaborators, publishing, archive, enrollment rules
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R003 — Instructor — Author assigned content, grade, message enrolled learners

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Instructor — Author assigned content, grade, message enrolled learners
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R004 — Teaching assistant — Grade permitted sections without publishing or ownership changes

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Teaching assistant — Grade permitted sections without publishing or ownership changes
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R005 — Learner — Access enrolled published content, submit work, view released feedback

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Learner — Access enrolled published content, submit work, view released feedback
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

#### R006 — Catalog viewer — Discover public offerings without accessing protected lessons

- **Engineering intent:** This identifies who may perform or observe behavior. It prevents authorization from being reduced to login or UI visibility. This requirement makes that concrete through: Catalog viewer — Discover public offerings without accessing protected lessons
- **Acceptance evidence:** Turn it into positive and negative actor × resource × action cases, including cross-tenant and stale-membership behavior.
- **Failure to avoid:** The typical failure is a coarse role check, a client-supplied tenant identifier, or a read projection that exposes fields the actor does not need. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Centralize policy decisions around trusted identity plus loaded resource context, then shape the response through an allow-listed projection for that audience.

## Core data model

This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced.

#### R007 — Organization and user — Tenant and identity roots

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Organization and user — Tenant and identity roots
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R008 — Course — Stable identity, metadata, owner, lifecycle, current published revision

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Course — Stable identity, metadata, owner, lifecycle, current published revision
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R009 — Course revision — Draft/published snapshot and source revision

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Course revision — Draft/published snapshot and source revision
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R010 — Module and lesson revision — Ordered hierarchy, content blocks, release rules

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Module and lesson revision — Ordered hierarchy, content blocks, release rules
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R011 — Cohort/offering — Course revision, dates, instructors, enrollment policy

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Cohort/offering — Course revision, dates, instructors, enrollment policy
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R012 — Enrollment — Learner, offering, active/completed/withdrawn state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Enrollment — Learner, offering, active/completed/withdrawn state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R013 — Assessment and question — Versioned configuration, attempts, scoring policy

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Assessment and question — Versioned configuration, attempts, scoring policy
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R014 — Attempt and answer — Learner responses, timestamps, selected question snapshot

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Attempt and answer — Learner responses, timestamps, selected question snapshot
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R015 — Assignment and submission — Due policy, files/text, revision history, grading state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Assignment and submission — Due policy, files/text, revision history, grading state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R016 — Grade and feedback — Score, rubric results, grader, draft/released state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Grade and feedback — Score, rubric results, grader, draft/released state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter.

#### R017 — Progress event/projection — Completion evidence and derived offering progress

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Progress event/projection — Completion evidence and derived offering progress
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R018 — Announcement — Audience, publication time, delivery state

- **Engineering intent:** This establishes ownership, cardinality, historical truth, and the durable place where invariants can be enforced. This requirement makes that concrete through: Announcement — Audience, publication time, delivery state
- **Acceptance evidence:** Create representative valid and invalid rows, enforce durable invariants with constraints where possible, and test repository semantics against the real database. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is modeling only the happy object shape while omitting uniqueness, effective dates, history, cardinality, and concurrent ownership. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Write invariants and lifecycle first, map them to keys and constraints, and keep domain behavior independent of a particular storage adapter. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

## Required workflows

This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits.

### Authoring and publishing

#### R019 — Create, edit, clone, archive, and restore courses

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create, edit, clone, archive, and restore courses.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R020 — Build ordered modules and lessons from typed content blocks

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Build ordered modules and lessons from typed content blocks.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R021 — Create a draft from the latest published revision and preview it as a learner

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create a draft from the latest published revision and preview it as a learner.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R022 — Validate required structure, broken references, assessment configuration, and

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Validate required structure, broken references, assessment configuration, and
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R023 — Publishing atomically creates an immutable revision and records an audit event

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Publishing atomically creates an immutable revision and records an audit event.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A database transaction cannot roll back an external side effect, and code outside its awaited scope may escape the guarantee.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. List every write and crash point, then inject failure between steps and prove the invariant observes all-or-nothing state. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R024 — Define whether active offerings remain pinned or explicitly upgrade revisions

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Define whether active offerings remain pinned or explicitly upgrade revisions.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Offerings and enrollment

#### R025 — Schedule an offering/cohort with enrollment window, capacity, instructors, and zone

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Schedule an offering/cohort with enrollment window, capacity, instructors, and zone.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R026 — Invite, approve, self-enroll, withdraw, suspend, and complete enrollments

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Invite, approve, self-enroll, withdraw, suspend, and complete enrollments.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R027 — Enforce capacity under concurrent enrollment and optionally maintain a wait list

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Enforce capacity under concurrent enrollment and optionally maintain a wait list.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

#### R028 — Release lessons by date, prerequisite completion, or instructor action

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Release lessons by date, prerequisite completion, or instructor action.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R029 — Prevent enrollment removal from erasing submission and grade history

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Prevent enrollment removal from erasing submission and grade history.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

### Learning and progress

#### R030 — Render permitted lessons and record meaningful completion events idempotently

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Render permitted lessons and record meaningful completion events idempotently.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

#### R031 — Resume from last position without treating page views alone as mastery

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Resume from last position without treating page views alone as mastery.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R032 — Calculate progress from required lessons and assessments using a documented rule

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Calculate progress from required lessons and assessments using a documented rule.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R033 — Show learner and instructor views of progress with appropriate privacy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Show learner and instructor views of progress with appropriate privacy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R034 — Rebuild the progress projection from events to verify derived state

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Rebuild the progress projection from events to verify derived state.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states. Define event payload, ordering, reentrancy, subscription ownership, and removal; test duplicate listeners and failure isolation.

### Assessment, submission, and grading

#### R035 — Support a bounded initial set: multiple choice, short answer, and file/text assignment

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Support a bounded initial set: multiple choice, short answer, and file/text assignment.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R036 — Create attempt snapshots with question order, options, points, and time policy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Create attempt snapshots with question order, options, points, and time policy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R037 — Enforce attempt limits and deadlines using server time; define late-submission behavior

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Enforce attempt limits and deadlines using server time; define late-submission behavior.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R038 — Autosave draft answers idempotently without submitting the attempt

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Autosave draft answers idempotently without submitting the attempt.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout.

#### R039 — Submit exactly once, auto-grade objective questions, and queue manual grading

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Submit exactly once, auto-grade objective questions, and queue manual grading.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R040 — Grade using rubric criteria, save drafts, release feedback, and record changes

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Grade using rubric criteria, save drafts, release feedback, and record changes.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R041 — Regrade through a traceable operation rather than rewriting historical scores silently

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Regrade through a traceable operation rather than rewriting historical scores silently.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof.

### Reporting

#### R042 — Enrollment, completion, progress distribution, assessment performance, and overdue grading

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Enrollment, completion, progress distribution, assessment performance, and overdue grading.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes.

#### R043 — Exports use stable documented schemas and respect learner privacy

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Exports use stable documented schemas and respect learner privacy.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R044 — Course owners can identify difficult questions without exposing individual answers broadly

- **Engineering intent:** This is user-visible product behavior, including the negative and repeated paths that basic CRUD usually omits. This requirement makes that concrete through: Course owners can identify difficult questions without exposing individual answers broadly.
- **Acceptance evidence:** Write a happy path, a rejection path, a repeat/timeout path, and a concurrent path where the operation can conflict. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is generic CRUD or unrestricted status updates that permit illegal transitions, partial writes, duplicates, and ambiguous retries. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Represent meaningful actions as commands with preconditions, one transaction boundary, idempotency where necessary, audit output, and explicit outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

## API and UI requirements

This turns domain behavior into stable server contracts and honest, accessible client states.

#### R045 — course outline editor with accessible reorder controls and unsaved-change protection;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: course outline editor with accessible reorder controls and unsaved-change protection;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R046 — learner preview clearly separated from actual enrollment state;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: learner preview clearly separated from actual enrollment state;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R047 — catalog/enrollment flows with full/cutoff/wait-list states;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: catalog/enrollment flows with full/cutoff/wait-list states;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

#### R048 — lesson player with progress navigation and accessible content structure;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: lesson player with progress navigation and accessible content structure;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R049 — assessment UI that survives refresh, network interruption, and duplicate submission;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: assessment UI that survives refresh, network interruption, and duplicate submission;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R050 — grading queue, rubric editor, autosaved draft, and deliberate feedback release;

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: grading queue, rubric editor, autosaved draft, and deliberate feedback release;
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly. Name the dominant operations and invariants, estimate time/space before measuring, and include adversarial sizes and shapes.

#### R051 — learner progress and feedback views with transparent calculation rules

- **Engineering intent:** This turns domain behavior into stable server contracts and honest, accessible client states. This requirement makes that concrete through: learner progress and feedback views with transparent calculation rules.
- **Acceptance evidence:** Verify the wire contract and user-visible behavior together, including accessibility, validation, loading, empty, stale, error, conflict, and recovery states.
- **Failure to avoid:** The typical failure is an API shaped around tables and a UI shaped around success, with inconsistent errors and no honest stale, denied, or conflict state. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Define the wire contract and failure taxonomy before components, then make React render and recover from every meaningful server state accessibly.

## Critical rules and failure cases

This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users.

#### R052 — Published revisions are immutable and offerings identify their content revision

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Published revisions are immutable and offerings identify their content revision.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R053 — Learners cannot access draft, unreleased, unenrolled, or other-learner resources

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Learners cannot access draft, unreleased, unenrolled, or other-learner resources.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R054 — Capacity and attempt limits hold under concurrency

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Capacity and attempt limits hold under concurrency.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R055 — Autosave after submission cannot reopen or alter a submitted attempt

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Autosave after submission cannot reopen or alter a submitted attempt.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R056 — Score calculations use fixed precision and validate maximum/earned points

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Score calculations use fixed precision and validate maximum/earned points.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R057 — Feedback is invisible until explicitly released

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Feedback is invisible until explicitly released.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes.

#### R058 — File access uses authorized indirect identifiers and bounded type/size rules

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: File access uses authorized indirect identifiers and bounded type/size rules.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R059 — Progress updates are idempotent and reconstructable

- **Engineering intent:** This is a non-negotiable invariant or failure contract whose violation would corrupt data, leak access, or mislead users. This requirement makes that concrete through: Progress updates are idempotent and reconstructable.
- **Acceptance evidence:** Make the rule executable as a domain/database guard and first create a regression test that demonstrates the exact prohibited state. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is documenting the invariant without enforcing it atomically at the earliest authoritative domain or database boundary. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Choose the strongest practical enforcement layer, make competing writes participate in it, and translate violations into stable domain/API outcomes. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

## Background work and integrations

This moves work beyond one request while preserving ownership, retry safety, observability, and recovery.

#### R060 — File scanning and safe preview generation through adapters

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: File scanning and safe preview generation through adapters.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R061 — Objective grading and progress-projection worker

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Objective grading and progress-projection worker.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Forcing process exit can discard output and partial work; background success is incomplete until handles and children are owned and drained.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Specify startup, message, cancellation, error, timeout, and termination contracts, then verify no handles or partial work survive shutdown.

#### R062 — Announcement, due-date, and feedback-release notifications with deduplication

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Announcement, due-date, and feedback-release notifications with deduplication.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R063 — Large report/export jobs with progress and expiring download access

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Large report/export jobs with progress and expiring download access.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers. Use isolated temporary data, bounded input, safe path handling, atomic writes where required, and cleanup tests for every failure stage.

#### R064 — Projection rebuild and integrity comparison command

- **Engineering intent:** This moves work beyond one request while preserving ownership, retry safety, observability, and recovery. This requirement makes that concrete through: Projection rebuild and integrity comparison command.
- **Acceptance evidence:** Model queued, running, succeeded, retryable, permanently failed, cancelled, and recovered states; test with controlled time and deterministic dependency failures. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is fire-and-forget work, infinite retry, or treating request acceptance as proof that the eventual side effect succeeded. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Persist work before acknowledging it, give each job durable identity and bounded attempts, and expose state plus an operator recovery action. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Required tests

This supplies independent evidence against a named risk rather than measuring activity or line execution.

#### R065 — publication snapshot and old/new revision compatibility tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: publication snapshot and old/new revision compatibility tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change.

#### R066 — authorization matrix across roles, offering state, release state, and learner ownership;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: authorization matrix across roles, offering state, release state, and learner ownership;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R067 — concurrent capacity, wait-list promotion, attempt-limit, and submission tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: concurrent capacity, wait-list promotion, attempt-limit, and submission tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R068 — fake-clock deadline, late policy, timed attempt, and release-rule boundaries;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: fake-clock deadline, late policy, timed attempt, and release-rule boundaries;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Server-local time, fixed offsets, and real sleeps create environment-dependent behavior and fail around future civil-time changes.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R069 — grading arithmetic and property tests around points and rubric totals;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: grading arithmetic and property tests around points and rubric totals;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Use exact representation, declare rounding and allocation rules, and preserve the historical inputs needed to reproduce every total.

#### R070 — progress rebuild equivalence and duplicate-event tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: progress rebuild equivalence and duplicate-event tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. An in-memory key or check-then-write sequence fails across crashes and competing workers; identity and result must be durable and atomic.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Define a durable operation identity, the stored first result, retryable versus permanent failure, and behavior after an ambiguous timeout. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R071 — file security and feedback-visibility tests;

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: file security and feedback-visibility tests;
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.

#### R072 — accessible course authoring and assessment keyboard flows

- **Engineering intent:** This supplies independent evidence against a named risk rather than measuring activity or line execution. This requirement makes that concrete through: accessible course authoring and assessment keyboard flows.
- **Acceptance evidence:** Show red against a plausible broken implementation and green after the smallest correction; keep the defect statement beside the test. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is testing implementation choreography or only happy examples, producing green results that do not reject the named production defect. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Start from the risk and counterexample, choose the cheapest realistic boundary, control nondeterminism, and prove red against the intended defect. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Delivery plan

This keeps the project shippable through vertical increments with concrete exit evidence.

#### R073 — 1 — Identity, courses, draft outline; Tenant/role tests and usable course CRUD

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 1 — Identity, courses, draft outline; Tenant/role tests and usable course CRUD
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R074 — 2 — Revision preview and publishing; Immutable snapshot and validation evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 2 — Revision preview and publishing; Immutable snapshot and validation evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment.

#### R075 — 3 — Offerings and enrollment; Concurrent capacity and lifecycle tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 3 — Offerings and enrollment; Concurrent capacity and lifecycle tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Do not use sleeps or repeated runs as the main proof, and do not confuse JavaScript scheduling with database isolation.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Control the dangerous interleaving with deferred operations or database coordination; repeated timing-based tests are not sufficient proof. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R076 — 4 — Lesson access and progress; Release authorization and rebuild equivalence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 4 — Lesson access and progress; Release authorization and rebuild equivalence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R077 — 5 — Objective assessments; Attempt snapshot, autosave, submit, grading tests

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 5 — Objective assessments; Attempt snapshot, autosave, submit, grading tests
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Coverage and snapshot size can rise while discrimination stays low; inspect which wrong behaviors survive.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. State the bug the test would catch, choose the cheapest realistic boundary, and confirm the assertion fails for the intended reason.

#### R078 — 6 — Assignments and files; Ownership, scanning state, deadline behavior

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 6 — Assignments and files; Ownership, scanning state, deadline behavior
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation. Inject time, state the zone and interval convention, and test exact boundaries plus daylight-saving gaps or repetitions where relevant.

#### R079 — 7 — Grading and feedback release; Rubric arithmetic, draft/release permissions

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 7 — Grading and feedback release; Rubric arithmetic, draft/release permissions
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A role check alone is insufficient: authorization must include the target resource, tenant, action, and current membership state.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Build an actor × resource × action matrix and test denials at the server boundary; hidden UI is only presentation.

#### R080 — 8 — React learner/instructor surfaces; Accessibility and interrupted-network recovery

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 8 — React learner/instructor surfaces; Accessibility and interrupted-network recovery
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R081 — 9 — Notifications and reports; Dedupe, privacy, query-plan, export evidence

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 9 — Notifications and reports; Dedupe, privacy, query-plan, export evidence
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Happy-path fixtures hide null, zero-child, duplicate-child, and skewed-cardinality defects; an ORM does not remove those semantics.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Use minimal counterexample fixtures for correctness and realistic skewed data for plans; constraints should enforce durable invariants where possible. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R082 — 10 — Operations, security, deployment; Threat model, restore, shutdown, observability

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 10 — Operations, security, deployment; Threat model, restore, shutdown, observability
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. A migration proven only on an empty database says little about dirty historical data or old and new application versions overlapping.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test blank, upgrade, repeated, and mixed-version paths; describe expand/backfill/contract sequencing and rollback before destructive change. Trace untrusted data across every interpreter and trust boundary, demonstrate the exploit safely, and place defense at the earliest authoritative boundary.

#### R083 — 11 — Maintenance request; Add prerequisites or revision upgrade safely

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 11 — Maintenance request; Add prerequisites or revision upgrade safely
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R084 — 12 — Release incident; Projection corruption drill, rebuild, report, defense

- **Engineering intent:** This keeps the project shippable through vertical increments with concrete exit evidence. This requirement makes that concrete through: 12 — Release incident; Projection corruption drill, rebuild, report, defense
- **Acceptance evidence:** Treat the exit evidence as a release gate: demonstrate the vertical behavior from a clean setup and attach commands, test output, and one operational observation. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is completing horizontal layers or a large unreviewable diff without a runnable user outcome, migration path, or operational proof. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Slice database, domain, API, UI, test, and observability together; release the smallest useful behavior and widen verification before the next increment. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

## Stretch features

This adds complexity only after the core system is correct and provides a deliberate specialization challenge.

#### R085 — Question pools with deterministic randomized attempt snapshots

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Question pools with deterministic randomized attempt snapshots.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. Component internals and mouse-only success are weak evidence; verify what keyboard, screen-reader, slow-network, and denied users observe.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Test through user-observable behavior, including keyboard/focus semantics and loading, empty, error, stale, conflict, and recovery states.

#### R086 — Peer review with anonymization and conflict handling

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Peer review with anonymization and conflict handling.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R087 — Standards-based content import through a constrained adapter

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Standards-based content import through a constrained adapter.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended. Draw dependency direction and the intended public surface; test consumer-visible behavior without reaching into private helpers.

#### R088 — Certificates with verifiable public identifiers and revocation

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Certificates with verifiable public identifiers and revocation.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.

#### R089 — Offline lesson reading with explicit synchronization limits

- **Engineering intent:** This adds complexity only after the core system is correct and provides a deliberate specialization challenge. This requirement makes that concrete through: Offline lesson reading with explicit synchronization limits.
- **Acceptance evidence:** Write an ADR and thin acceptance slice first; proceed only when the feature exercises a real weakness and does not weaken core guarantees.
- **Failure to avoid:** The typical failure is adding novelty before core guarantees are proven, increasing surface area while authorization, recovery, and tests remain weak. The common trap is satisfying the visible example while leaving ownership, boundary inputs, or failure behavior undefined.
- **Implementation guidance:** Use a short spike to expose uncertainty, record an ADR, and ship a thin end-to-end slice behind a boundary that can be removed or extended.
