# Shared delivery standard

This standard applies to all eight projects. A project is complete only when
another engineer can run it, understand it, change it, and diagnose common
failures.

## Suggested technical baseline

- TypeScript with strict compiler settings and no unexplained `any`.
- React client with accessible semantic HTML and user-focused tests.
- Node HTTP API with explicit route, service/domain, and repository boundaries.
- PostgreSQL for deployed work; SQLite is acceptable for the first increment.
- Runtime validation for configuration and all untrusted inputs.
- Database migrations and repeatable seed data.
- A background worker or independently runnable job process.
- Containerized or scripted local dependencies and a documented deployment.

Libraries are choices, not requirements. Select maintained tools, document why
they fit, commit a lockfile, and avoid hiding core learning behind excessive
framework magic.

## Required cross-cutting behavior

### Identity and authorization

- Users authenticate through a secure session or standards-based token flow.
- Every protected operation authorizes the action against the target resource.
- Multi-tenant projects derive tenant context from trusted identity, never a
  client-supplied tenant ID alone.
- Denials do not reveal private resource existence.
- Administrative actions are audited.

### API contracts

- Use consistent resource shapes, status codes, timestamps, identifiers, and
  error envelopes.
- Separate malformed input, failed validation, authorization denial, missing
  resources, conflicts, rate limits, and unexpected failures.
- List endpoints have bounded page size, deterministic ordering, filters, and
  documented cursor or offset behavior.
- Mutations vulnerable to duplicate delivery use idempotency keys or an
  equivalent durable mechanism.
- Updates that can overwrite concurrent work use version checks or another
  explicit concurrency policy.

### Data integrity

- Put durable invariants in database constraints where practical.
- Wrap multi-write state changes in transactions.
- Store money as integer minor units or a documented decimal representation.
- Store instants consistently, normally UTC; retain the relevant local zone
  when future civil time matters.
- Migrations work against both empty and realistic older databases.
- Destructive changes have a backup, rollout, and rollback strategy.

### React experience

- Every async surface intentionally handles initial, loading, empty, success,
  stale, validation-error, permission-error, and retryable-failure states.
- Forms preserve useful input after failure and connect errors accessibly to
  fields.
- URLs represent navigable filters and selected resources where appropriate.
- Mutations prevent accidental duplicate submission.
- Optimistic behavior has honest rollback or conflict handling.
- Keyboard navigation, focus management, labels, and announcements are tested.

### Reliability and operations

- Structured logs include severity, event name, correlation ID, and safe
  context without secrets or unnecessary personal data.
- Readiness and liveness behavior reflects actual dependency state.
- The service handles termination signals, stops accepting work, drains within
  a deadline, and closes dependencies.
- Jobs retry only transient failures with bounded exponential backoff and
  jitter; permanent failures become visible dead-letter or failed records.
- Essential workflows expose useful metrics such as duration, result, queue
  depth, and error category.
- Restore, recovery, and common incident steps are documented and rehearsed.

## Required test portfolio

Do not chase a coverage percentage without a risk model. Every project needs:

- pure unit tests for domain rules and state transitions;
- repository contract tests against real database behavior;
- API integration tests using a real listening server and database;
- authorization matrix tests with positive and negative cases;
- concurrency tests that force dangerous interleavings deterministically;
- job tests for retries, idempotency, poison input, and recovery;
- React behavior tests for user-visible outcomes and accessibility;
- at least three end-to-end critical-path tests;
- migration tests from realistic previous-version fixtures;
- one load or performance investigation with a written conclusion;
- regression tests created during two unfamiliar-code debug hunts.

## Repository and delivery requirements

Include:

```text
apps/web                 React application
apps/api                 Node HTTP application
apps/worker              background worker or scheduled jobs
packages/domain          domain types and pure rules
packages/contracts       API schemas/types with controlled dependencies
packages/testing         fixture builders and test helpers
migrations               ordered database changes
docs/adr                  architecture decision records
docs/runbooks             operational procedures
```

Equivalent structures are acceptable when dependency direction is explicit.
Add commands for install, development, typecheck, lint, unit tests, integration
tests, end-to-end tests, migrations, seeding, build, and production start.

CI must run from a clean checkout and enforce formatting or linting, strict
typecheck, tests, production build, migration verification, and a minimal
security/dependency check. Protect the main branch or simulate review with
small branches and self-review notes.

## Evidence required at completion

- Product README with screenshots, demo account, setup, and limitations.
- Architecture diagram showing boundaries and important data flows.
- Data model diagram with constraints and cardinalities.
- API contract or generated reference with examples.
- At least three ADRs that compare credible alternatives.
- Threat model and authorization matrix.
- Test strategy mapped to the five largest risks.
- Deployment and rollback instructions.
- Incident report from an intentionally injected failure.
- Performance report containing hypothesis, measurement, change, and result.
- Five-to-ten-minute demonstration and ten-minute technical defense.

## AI usage standard

Use the course [AI protocol](../05-AI-PROTOCOL.md). Record assistance level on
each ticket. Before accepting an AI-generated change:

1. State the contract and likely failure modes yourself.
2. Inspect every changed line and dependency.
3. Add or improve tests that would reject a plausible wrong implementation.
4. Run the relevant widening verification rings.
5. Explain the change without AI and name one alternative.

At least one substantial feature and two debug hunts must be completed without
AI implementation assistance. AI can still act as an interviewer afterward.

