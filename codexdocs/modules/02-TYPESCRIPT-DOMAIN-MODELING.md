# Module 02 — TypeScript domain modeling

Pair with: RelayDesk increments 1–3.

## Why this matters

Weak TypeScript annotates JavaScript. Strong TypeScript changes which invalid
programs can be expressed while staying honest about runtime uncertainty.

The goal is not maximum type cleverness. The goal is a small vocabulary that
makes domain states, transitions, and boundaries obvious to the next engineer.

## Types are sets of possible values

Thinking in sets makes unions and narrowing concrete. A `TicketStatus` union
is the set of four accepted strings. `unknown` is the set of all possible
values with no permitted operations until evidence narrows it. `never` is an
empty set and therefore useful for checking that every union member was
handled.

```ts
type TicketState =
  | { status: 'open'; assigneeId: null }
  | { status: 'in_progress'; assigneeId: string }
  | { status: 'resolved'; assigneeId: string; resolvedAt: string }
  | { status: 'closed'; assigneeId: string; closedAt: string };
```

This may be more precise than a bag of optionals, but precision has a cost. Use
it where invalid combinations matter and remain stable enough to justify the
model.

## Compile-time claims stop at runtime boundaries

An HTTP body, database result, environment variable, local-storage entry, and
third-party response are not trusted because a generic says they are.

```ts
const body: unknown = await readJson(request);
const command = parseCreateTicket(body); // runtime proof happens here
```

An assertion such as `body as CreateTicket` skips proof. Assertions are
occasionally needed at framework seams, but every assertion should have a
nearby reason and trustworthy evidence.

## Domain, transport, and persistence are different models

- Transport models reflect API compatibility and serialization.
- Domain models protect business invariants.
- Persistence models reflect columns, joins, nulls, and storage constraints.

They may look similar without being interchangeable. Deliberate mapping makes
ownership and validation visible, and prevents a database column or PATCH
optional from weakening the domain.

## Generics express relationships

A useful generic connects inputs and outputs: the key belongs to the object,
the result contains the selected value, or success and error types travel
together. A generic that merely replaces a concrete name with `T` may add
complexity without adding safety.

## Common failure patterns

- `any` infecting callers through a shared helper.
- `Record<string, T>` claiming every key exists.
- Assertions used instead of parsers.
- Optional properties representing several incompatible states.
- One “Ticket” interface reused for rows, domain values, patches, and JSON.
- A generic so broad that inference returns `unknown` or a misleading union.
- Exhaustive switches without a `never` check.

## Exercise 1 — illegal states inventory (core)

Model ticket assignment and lifecycle first as one interface with optional
fields, then as a discriminated union.

Constraints:

- List every invalid combination each model permits.
- Include reopened and unassigned states.
- Do not assume the most precise model is automatically the best API model.

Proof: compile-time examples using `@ts-expect-error` plus runtime examples at
the parsing boundary.

Debrief: where should the precise union live, and where might a flatter DTO be
easier to evolve?

AI level: 0.

## Exercise 2 — parse unknown without casts (core)

Implement a parser for a create-ticket request containing title, description,
priority, and optional labels.

Constraints:

- Input remains `unknown` until checks justify each operation.
- Return all useful field problems, not just the first.
- Unknown keys are dropped or rejected according to a documented policy.
- The parser never throws for ordinary invalid input.

Proof: type tests and runtime tests for objects, arrays, null, inherited
properties, wrong primitives, empty strings, and excessive lengths.

Debrief: which checks were runtime evidence, and which were only TypeScript
convenience?

AI level: 1.

## Exercise 3 — type a PATCH command (applied)

Design separate transport and domain representations for updating a ticket.
Distinguish missing fields from explicit `null` and empty strings.

Constraints:

- Server-owned fields cannot appear in the accepted command.
- An empty patch receives deliberate behavior.
- Assignee removal is possible without making every field nullable.

Proof: examples of accepted/rejected payloads and a mapping function with no
unchecked assertion.

Debrief: why is `Partial<Ticket>` an attractive but dangerous PATCH type?

AI level: 1.

## Exercise 4 — exhaustive event handler (core)

Create a discriminated union for ticket-created, assigned, commented,
resolved, and reopened activity. Implement a human-readable formatter and a
webhook mapper.

Constraints:

- Adding a new event must cause both functions to fail typechecking until
  handled.
- Event-specific data is not optional on unrelated members.
- Serialized output has a stable version field.

Proof: compile-time exhaustive check and runtime fixtures for every event.

Debrief: how would you evolve stored version-1 events after adding a field?

AI level: 1.

## Exercise 5 — audit a type lie (review)

Find or introduce one of these lies: unchecked assertion, over-broad index
signature, `Promise<void>` hiding dropped work, mutable readonly alias, or
optional field masking a state machine.

Constraints:

- Code must compile before the fix.
- A runtime or type-level test must expose the lie.
- The fix must not replace the lie with `any` or a larger assertion.

Proof: failing evidence, fixed contract, and explanation of why strict mode did
not protect the original.

Debrief: what evidence would a reviewer need to catch this without running the
system?

AI level: 2.

## Exercise 6 — generic API review (review)

Design a typed repository `findBy` operation or event-emitter interface in two
forms: one simple/concrete and one generic. Compare call-site inference, error
messages, illegal calls, implementation complexity, and future evolution.

Constraints:

- No conditional or recursive type unless a real requirement needs it.
- Include one incorrect call that each design should reject.
- Choose one design and document the rejected complexity.

Proof: working prototypes and a short ADR.

Debrief: what relationship did the generic express that overloads or concrete
functions could not?

AI level: 2 after both prototypes exist.

## Project transfer

Apply these decisions to RD-103, RD-202, RD-301, and RD-303. Revisit the model
after the first API evolution; types that only survive the first draft are not
yet proven maintainable.

