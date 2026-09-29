# Foundations sprint

Duration: three days to two weeks, selected by the diagnostic. This is the
only drill-heavy part of the course.

## Completion rule

Do not complete a module because it exists. Complete a set because it repairs
a diagnostic weakness. Stop when you can pass the exit task cold and explain
the mechanism.

## Block 1 — values, functions, and transformations

Required concepts:

- nullish values, coercion, equality, and number boundaries;
- value versus reference behavior and shallow copying;
- closures, callback contracts, and `this` at call time;
- non-mutating array transformations and stable ordering;
- explicit input and output contracts.

Suggested work:

- `bootcamp/01-language-core`: 03–11, 19–24, 29–35.
- `bootcamp/02-functions-and-closures`: 06–10, 14–21, 24–26, 40.
- `bootcamp/03-arrays-and-objects`: 05–15, 31–35, 39–48.

Exit task: from raw ticket-like objects, validate required fields, group valid
records by status, sort within each status without mutating the input, and
return rejected-record diagnostics. Write the contract and tests first.

## Block 2 — errors and asynchronous work

Required concepts:

- expected domain failures versus programmer or infrastructure failures;
- preserving error context and cleaning up in `finally`;
- event-loop ordering and promise error propagation;
- sequential versus concurrent work;
- timeouts, cancellation, retries, and bounded concurrency.

Suggested work:

- `bootcamp/06-errors-and-robustness`: 01–10, 14–17, 26, 29.
- `bootcamp/07-async-mastery`: 01–03, 10–28, 35, 41–45, 50–52.
- Read `guides/01-the-event-loop-all-the-way-down.md`.

Exit task: implement a function that loads ticket details with a concurrency
limit, supports cancellation, preserves input order, and reports individual
failures without discarding successful results.

## Block 3 — practical TypeScript

Required concepts:

- inference, literal unions, readonly values, and object shapes;
- `unknown` at untrusted boundaries;
- discriminated unions and exhaustive branching;
- useful generics and constraints;
- type assertions as claims that need runtime proof;
- keeping domain, transport, and persistence types distinct.

Suggested work:

- All of `tsbootcamp/02-narrowing`.
- `tsbootcamp/01-types-and-annotations`: 02–10, 12–18.
- `tsbootcamp/03-generics`: 01–15.
- `tsbootcamp/06-typing-real-code`: 01–13.

Exit task: model a ticket lifecycle as a discriminated union, parse an
`unknown` API payload into it, and make illegal transitions fail either at
compile time or through a deliberate domain error.

## Block 4 — Git and test fundamentals

You must be able to:

- create a branch and make small, descriptive commits;
- read a diff before committing;
- restore one file without destroying unrelated work;
- distinguish unit, integration, contract, and end-to-end tests;
- state what failure a test is meant to diagnose;
- use a fake clock or injected dependency instead of waiting in tests.

Suggested work:

- `bootcamp/20-testing-and-quality`: 01–09, 12–16.
- `bootcamp/29-write-the-test`.

Practice commit sequence:

1. Add a failing test that names a behavior.
2. Add the smallest implementation that passes.
3. Refactor while green.
4. Review the diff and improve the commit message.

Exit task: take one solved exercise, introduce a boundary bug on a branch,
write the failing test in a separate commit, fix it in the next commit, and
write a five-sentence PR description using `templates/PR.md`.

## Foundation gate review

Without notes, explain:

1. Why `Promise.all` can be correct and still be the wrong product behavior.
2. Why a TypeScript type does not validate JSON.
3. What a closure retains and how stale closures occur in React.
4. Why a unit test should not prove a SQL transaction works.
5. How a test can pass while validating the wrong contract.

If an answer is vague, perform the smallest routed exercise set and answer
again. Then begin the application even if some advanced material remains.

