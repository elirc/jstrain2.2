# Module 01 — JavaScript runtime and contracts

Pair with: foundations and RelayDesk increments 1–2.

## Why this matters

TypeScript can describe intended values, but JavaScript still performs the
work. Most production defects in typed applications are runtime defects:
aliasing, unexpected coercion, mutation, closure lifetime, exception flow, and
untrusted values that entered through a boundary.

The key mid-level habit is to reason from a contract and a concrete value,
not from syntax that looks familiar.

## Mental model 1 — bindings point to values

Primitives behave like independent values. Objects and arrays are referenced
through identities. Copying an object binding copies access to that identity;
spreading creates one new outer object but retains nested identities.

```ts
const original = { owner: { id: 'u1' }, tags: ['urgent'] };
const copy = { ...original };
copy.owner.id = 'u2';

// original.owner.id is now 'u2' because owner was not cloned.
```

“Immutable” is not a property TypeScript automatically gives an object. It is
an ownership rule enforced by APIs, readonly types, conventions, and tests.

## Mental model 2 — coercion is an implicit branch

Whenever code accepts more than one runtime shape, coercion creates hidden
behavior. `||` treats all falsy values as absent; `??` treats only `null` and
`undefined` as absent. `Number('')` is zero. Invalid numeric calculations can
produce `NaN`, which is a number by `typeof`.

At system boundaries, prefer explicit parsing that returns either a domain
value or structured problems. Do not make the domain repeatedly rediscover
whether `''`, `'0'`, `0`, and `undefined` mean the same thing.

## Mental model 3 — closures retain bindings

A closure retains access to bindings from its creation environment. This is
useful for encapsulated state and dependency injection. It also creates stale
state bugs when a callback captures a value from an earlier render or request
and is invoked later.

Ask two questions for every callback stored beyond the current call:

1. Which bindings does it retain?
2. When it eventually runs, should it use the captured value or the latest
   value?

## Mental model 4 — contracts include failure and side effects

The contract of a function is more than argument and return types. It includes
mutation, I/O, ordering, error behavior, cancellation, and ownership.

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

A result is useful for an expected alternative the caller should handle. An
exception is useful when ordinary continuation is impossible or a dependency
violates its contract. Neither choice is universally correct; inconsistency is
the real enemy.

## Common failure patterns

- Using spread as though it were a deep clone.
- Treating `0`, `false`, or an empty collection as missing.
- Sorting an array owned by a caller.
- Catching an exception and removing its cause or useful context.
- Returning a mutable internal collection.
- Capturing request or render state in a callback that outlives it.
- Letting transport-shaped optional fields leak into domain decisions.

## Exercise 1 — ownership map (core)

Given a nested ticket with requester, tags, and comment objects, draw the
object identities before and after these operations: assignment, outer spread,
array spread, `map` replacing one item, and `structuredClone`.

Constraints:

- Predict every affected identity before running code.
- Include one function or date value and document how cloning treats it.

Proof: a test table comparing identities with `Object.is` and values with deep
equality.

Debrief: which operation gives the minimum copy needed for a single immutable
comment update? Why might a full deep clone be worse?

AI level: 0.

## Exercise 2 — parse a page request (core)

Implement `parsePageQuery(value: unknown)` that accepts an object-like query
and returns either `{ limit, cursor }` or structured field errors.

Constraints:

- Limit is an integer from 1–100 with a default of 25.
- Missing and empty values are different decisions.
- Booleans, arrays, whitespace, `NaN`, floats, and numeric prefixes are tested.
- The returned value contains no unvalidated strings except the opaque cursor.

Proof: a table-driven test containing at least twelve boundary cases.

Debrief: where did JavaScript coercion almost produce an unintended accepted
value?

AI level: 1.

## Exercise 3 — immutable ticket update (applied)

Implement an update that changes one comment body while preserving every
unaffected object identity.

Constraints:

- Missing comment ID returns a domain failure.
- Input objects are frozen during tests.
- Only the ticket, comments array, and changed comment receive new identities.
- No JSON round-trip cloning.

Proof: value assertions plus identity assertions for changed and unchanged
branches.

Debrief: why can identity be part of observable performance behavior in React?

AI level: 1.

## Exercise 4 — callback lifetime bug (review)

Create a minimal stale-closure bug in a polling or subscription function. Write
a deterministic test that proves an old value is used after configuration
changes, then fix it without making configuration global.

Constraints:

- No real-time waits.
- The test must fail because of the stale value, not call-count timing.
- Cleanup must unregister the exact registered callback.

Proof: red test, minimal fix, green test, and a short timeline showing captured
versus current values.

Debrief: when is capturing the original value actually the correct contract?

AI level: 2, review only.

## Exercise 5 — preserve failure context (applied)

Wrap a repository operation with ticket-specific context while preserving the
original error as its cause. Expected duplicate-title behavior must remain a
domain result; infrastructure failure must remain exceptional.

Constraints:

- Never turn every error into “ticket failed.”
- Logs and client messages have different detail.
- A thrown non-`Error` value is normalized safely.

Proof: tests for expected failure, database exception, and non-Error throw.

Debrief: what information belongs in logs, in the exception chain, and in the
HTTP response?

AI level: 1.

## Exercise 6 — contract review (review)

Review a 30–60 line function from your RelayDesk project. Write its real
contract under these headings: accepted inputs, output, mutation, I/O,
ordering, errors, cancellation, ownership, and security assumptions.

Then find one item not represented by its TypeScript signature and either add
a test, clarify documentation, or improve the interface.

Proof: before/after contract and the smallest supporting diff.

Debrief: what did the type signature make easy to overlook?

AI level: 2; AI may challenge the contract after your first draft.

## Project transfer

Apply these ideas to RD-103, RD-202, and RD-303. The expected output is not a
generic utility library. It is clearer ownership and validation at RelayDesk
boundaries.

