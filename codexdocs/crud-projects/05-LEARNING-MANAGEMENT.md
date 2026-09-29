# 05 — Learning management system

## Product objective

Build a platform where instructors author versioned courses, learners enroll
and progress through lessons and assessments, instructors grade submissions,
and administrators report completion. The key challenges are hierarchical
content, draft/published versions, derived progress, assessment integrity,
authorization, files, and long-running grading/report work.

## Actors and permissions

| Actor | Required capabilities |
| --- | --- |
| Platform/organization administrator | Users, catalogs, policies, reporting, support elevation |
| Course owner | Course settings, collaborators, publishing, archive, enrollment rules |
| Instructor | Author assigned content, grade, message enrolled learners |
| Teaching assistant | Grade permitted sections without publishing or ownership changes |
| Learner | Access enrolled published content, submit work, view released feedback |
| Catalog viewer | Discover public offerings without accessing protected lessons |

Authorization must account for organization, course collaboration, enrollment
state, cohort, publication state, and feedback-release state.

## Core data model

| Entity | Important fields and relationships |
| --- | --- |
| Organization and user | Tenant and identity roots |
| Course | Stable identity, metadata, owner, lifecycle, current published revision |
| Course revision | Draft/published snapshot and source revision |
| Module and lesson revision | Ordered hierarchy, content blocks, release rules |
| Cohort/offering | Course revision, dates, instructors, enrollment policy |
| Enrollment | Learner, offering, active/completed/withdrawn state |
| Assessment and question | Versioned configuration, attempts, scoring policy |
| Attempt and answer | Learner responses, timestamps, selected question snapshot |
| Assignment and submission | Due policy, files/text, revision history, grading state |
| Grade and feedback | Score, rubric results, grader, draft/released state |
| Progress event/projection | Completion evidence and derived offering progress |
| Announcement | Audience, publication time, delivery state |

Published learning content and assessment questions must be snapshots. Editing
a new draft cannot silently change what an active learner already attempted.

## Required workflows

### Authoring and publishing

- Create, edit, clone, archive, and restore courses.
- Build ordered modules and lessons from typed content blocks.
- Create a draft from the latest published revision and preview it as a learner.
- Validate required structure, broken references, assessment configuration, and
  accessibility metadata before publishing.
- Publishing atomically creates an immutable revision and records an audit event.
- Define whether active offerings remain pinned or explicitly upgrade revisions.

### Offerings and enrollment

- Schedule an offering/cohort with enrollment window, capacity, instructors, and zone.
- Invite, approve, self-enroll, withdraw, suspend, and complete enrollments.
- Enforce capacity under concurrent enrollment and optionally maintain a wait list.
- Release lessons by date, prerequisite completion, or instructor action.
- Prevent enrollment removal from erasing submission and grade history.

### Learning and progress

- Render permitted lessons and record meaningful completion events idempotently.
- Resume from last position without treating page views alone as mastery.
- Calculate progress from required lessons and assessments using a documented rule.
- Show learner and instructor views of progress with appropriate privacy.
- Rebuild the progress projection from events to verify derived state.

### Assessment, submission, and grading

- Support a bounded initial set: multiple choice, short answer, and file/text assignment.
- Create attempt snapshots with question order, options, points, and time policy.
- Enforce attempt limits and deadlines using server time; define late-submission behavior.
- Autosave draft answers idempotently without submitting the attempt.
- Submit exactly once, auto-grade objective questions, and queue manual grading.
- Grade using rubric criteria, save drafts, release feedback, and record changes.
- Regrade through a traceable operation rather than rewriting historical scores silently.

### Reporting

- Enrollment, completion, progress distribution, assessment performance, and overdue grading.
- Exports use stable documented schemas and respect learner privacy.
- Course owners can identify difficult questions without exposing individual answers broadly.

## API and UI requirements

Provide APIs for course drafts/revisions, modules, lessons, offerings, enrollment,
release rules, attempts, submissions, grading, progress, announcements, files,
and reports. Publishing, submission, feedback release, and regrade are explicit
commands rather than generic state updates.

The React application needs:

- course outline editor with accessible reorder controls and unsaved-change protection;
- learner preview clearly separated from actual enrollment state;
- catalog/enrollment flows with full/cutoff/wait-list states;
- lesson player with progress navigation and accessible content structure;
- assessment UI that survives refresh, network interruption, and duplicate submission;
- grading queue, rubric editor, autosaved draft, and deliberate feedback release;
- learner progress and feedback views with transparent calculation rules.

## Critical rules and failure cases

- Published revisions are immutable and offerings identify their content revision.
- Learners cannot access draft, unreleased, unenrolled, or other-learner resources.
- Capacity and attempt limits hold under concurrency.
- Autosave after submission cannot reopen or alter a submitted attempt.
- Score calculations use fixed precision and validate maximum/earned points.
- Feedback is invisible until explicitly released.
- File access uses authorized indirect identifiers and bounded type/size rules.
- Progress updates are idempotent and reconstructable.

## Background work and integrations

- File scanning and safe preview generation through adapters.
- Objective grading and progress-projection worker.
- Announcement, due-date, and feedback-release notifications with deduplication.
- Large report/export jobs with progress and expiring download access.
- Projection rebuild and integrity comparison command.

## Required tests

Apply the shared standard and emphasize:

- publication snapshot and old/new revision compatibility tests;
- authorization matrix across roles, offering state, release state, and learner ownership;
- concurrent capacity, wait-list promotion, attempt-limit, and submission tests;
- fake-clock deadline, late policy, timed attempt, and release-rule boundaries;
- grading arithmetic and property tests around points and rubric totals;
- progress rebuild equivalence and duplicate-event tests;
- file security and feedback-visibility tests;
- accessible course authoring and assessment keyboard flows.

## Delivery plan

| Increment | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 | Identity, courses, draft outline | Tenant/role tests and usable course CRUD |
| 2 | Revision preview and publishing | Immutable snapshot and validation evidence |
| 3 | Offerings and enrollment | Concurrent capacity and lifecycle tests |
| 4 | Lesson access and progress | Release authorization and rebuild equivalence |
| 5 | Objective assessments | Attempt snapshot, autosave, submit, grading tests |
| 6 | Assignments and files | Ownership, scanning state, deadline behavior |
| 7 | Grading and feedback release | Rubric arithmetic, draft/release permissions |
| 8 | React learner/instructor surfaces | Accessibility and interrupted-network recovery |
| 9 | Notifications and reports | Dedupe, privacy, query-plan, export evidence |
| 10 | Operations, security, deployment | Threat model, restore, shutdown, observability |
| 11 | Maintenance request | Add prerequisites or revision upgrade safely |
| 12 | Release incident | Projection corruption drill, rebuild, report, defense |

## Stretch features

- Question pools with deterministic randomized attempt snapshots.
- Peer review with anonymization and conflict handling.
- Standards-based content import through a constrained adapter.
- Certificates with verifiable public identifiers and revocation.
- Offline lesson reading with explicit synchronization limits.

## Completion defense

Demonstrate editing a draft without changing an active attempt, two learners
competing for final capacity, interrupted autosave and duplicate submission,
private versus released feedback, and progress reconstruction. Explain content
versioning, assessment integrity, authorization, and projection tradeoffs.

