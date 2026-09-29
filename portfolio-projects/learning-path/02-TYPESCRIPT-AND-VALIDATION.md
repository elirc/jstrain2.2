# TypeScript and runtime validation

## The essential distinction

TypeScript checks code while it is being built. HTTP JSON, environment variables, database rows, CSV cells, and decoded tokens arrive at runtime. They are `unknown` even if a developer writes `as SomeType`.

```ts
const body = req.body as CreateTask; // assertion: no runtime evidence
const body = TaskCreate.parse(req.body); // parser: rejects invalid runtime data
```

An assertion changes what the compiler believes. A parser changes what the program permits.

## Read the contract packages

Compare the three contract files:

- [inventory contracts](../01-inventory-orders/packages/contracts/src/index.ts)
- [project-management contracts](../02-project-management/packages/contracts/src/index.ts)
- [scheduling contracts](../03-appointment-scheduling/packages/contracts/src/index.ts)

Notice four recurring techniques:

1. `.strict()` rejects unknown fields instead of silently accepting client-controlled surprises.
2. Bounds limit memory/work: page size, text length, file size, and date ranges.
3. Transformations normalize values, such as uppercasing SKU.
4. Cross-field refinements reject combinations that individual field types cannot express.

Project management’s `TaskMove` shows the last category: each anchor can be valid independently, while providing both anchors is invalid as a command.

## Exact optional properties

With `exactOptionalPropertyTypes`, these are different:

```ts
type Input = { price?: number };
const omitted: Input = {};
// { price: undefined } is not equivalent unless undefined is explicitly allowed.
```

This catches accidental propagation of undefined into SQL or JSON. At a boundary, deliberately omit an optional property or explicitly model `number | undefined`.

## Database row narrowing

SQLite libraries return broad row shapes. The code often narrows after a parameterized query:

```ts
const row = statement.get(id, orgId) as Row | undefined;
if (!row) throw new NotFound();
```

The cast is not validation; it is a promise tied to the selected SQL columns. Keep the query and row type adjacent, test the repository against a real database, and avoid exporting guessed row shapes across layers.

## Configuration is input too

Read scheduling’s [`config.ts`](../03-appointment-scheduling/apps/api/src/config.ts). It parses port, path, environment, and secret. It adds a semantic production rule: the safe local default is forbidden in production. This is stronger than merely checking that the secret is a string.

## Socratic questions

- Why does `z.coerce.number()` make sense for query strings but deserve caution in JSON bodies?
- What happens when a client sends `pageSize=1000000`?
- Why should a slot token be decoded and checked even though it has a TypeScript payload type?
- Which validations belong in Zod, which in domain code, and which in SQL constraints?

## Hands-on exercise

Add a boundary case to one contract. First write a test that sends the hostile input through HTTP and expects the project’s stable validation envelope. Good candidates:

- inventory SKU containing only whitespace;
- project attachment filename containing `../`;
- scheduling date range longer than 31 days.

Run parser/unit tests, then the HTTP integration test, then typecheck. Explain why each proves something different.

## Teach-back

Without using the words “type safe,” explain how a value moves from untrusted JSON to a SQL parameter and name every check along the path.
