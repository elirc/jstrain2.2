# Interview and job readiness

Interview preparation begins after RelayDesk has real behavior to discuss.
Before that, memorized stories will sound memorized because they are.

## Portfolio package

The final repository should contain:

- a one-paragraph product explanation;
- a screenshot or short demo;
- architecture and data-flow diagram;
- local setup and one-command checks;
- deployment URL and demo access instructions;
- three important ADRs;
- test-strategy summary;
- threat model and authorization matrix;
- one incident report;
- known limitations and next steps.

Never describe RelayDesk as “production ready.” Describe the production-shaped
practices you implemented and the limits you know remain.

## Technical story bank

Prepare six evidence-backed stories:

1. Ambiguous requirement you clarified.
2. Difficult bug you diagnosed systematically.
3. Tradeoff you recorded and later revisited.
4. Security or data-integrity risk you prevented.
5. Review feedback you accepted, modified, or rejected.
6. Incident or performance problem you measured and fixed.

Use situation, constraints, actions, evidence, result, and reflection. Be able
to answer what you would do differently.

## Coding preparation

Prioritize ordinary engineering transformations:

- group/filter/sort data;
- parse and validate `unknown` input;
- implement a small state machine;
- bounded async mapping;
- retry or timeout wrapper;
- pagination and cursor logic;
- tree or graph traversal at the practical level;
- write a test that exposes a boundary bug.

Use `bootcamp/21-interleaved-drills`, selected module 24 hunts, and
`quizzes/14-mixed-gauntlet.md`. Do not let hard algorithm preparation consume
time needed for APIs, SQL, debugging, or communication unless target roles
explicitly require it.

## JavaScript and TypeScript verbal bar

Explain with an example:

- value versus reference and shallow copying;
- closure lifetime and stale closures;
- `this` binding;
- task versus microtask ordering;
- error propagation through promises;
- cancellation versus ignoring a result;
- `unknown` versus `any`;
- narrowing and discriminated unions;
- structural typing and the limits of compile-time types;
- when a generic improves a contract and when it obscures one.

## React verbal bar

- State ownership and lifting state.
- Controlled inputs and validation.
- Effects as synchronization, not general computation.
- Dependencies, cleanup, races, and Strict Mode behavior.
- Keys and identity.
- Derived state versus stored state.
- Accessibility-driven markup and testing.
- Performance measurement before memoization.

## Backend and data verbal bar

- HTTP method/status/error semantics.
- Middleware ordering and central error handling.
- Authentication versus authorization.
- Validation at trust boundaries.
- Transactions and database constraints.
- Keyset versus offset pagination.
- N+1 queries and query-plan evidence.
- Timeouts, retries, jitter, idempotency, and partial failure.
- Liveness, readiness, graceful shutdown, and structured logs.

## System-design-lite format

Use this order for a 30–45 minute design conversation:

1. Clarify users, operations, scale, consistency, and non-goals.
2. State the critical data model and invariants.
3. Draw one end-to-end request path.
4. Define APIs and failure semantics.
5. Identify the first bottleneck and security boundary.
6. Discuss observability, rollout, and recovery.
7. Revisit tradeoffs if constraints change.

Practice with RelayDesk extensions: attachments, full-text search, email
ingestion, audit export, or multi-region read availability. Do not implement
them for the portfolio unless they close a rubric gap.

## Mock interview cadence

- Week 6: one JS/TS verbal and one debugging session.
- Week 8: one API/SQL design and one code review.
- Week 10: one behavioral and one system-design-lite session.
- Week 12: two complete loops with different questions.

After each session, record:

- incorrect answer;
- correct but unclear answer;
- missing example;
- time lost through poor structure;
- one practice action.

## Ready-to-apply gate

Begin serious applications when you can:

- demo the application reliably;
- explain three meaningful tradeoffs;
- solve ordinary transformation/debugging tasks without AI;
- write a reasonable test before implementation;
- discuss HTTP, SQL, React state, security, and failure behavior concretely;
- present at least four real stories from the project;
- state honestly where you still need support.

Do not wait for perfection or every rubric score to become 3. Independent
level-2 performance across the board is enough to seek roles where team
experience can compound the rest.

