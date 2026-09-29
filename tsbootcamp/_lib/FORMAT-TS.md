# TS track authoring format — the contract

The TypeScript track mirrors `bootcamp/_lib/FORMAT.md` (read that first —
tone, difficulty stars, README lesson structure, prompt style all apply).
This file covers only what is DIFFERENT for TypeScript.

## The two graders

Every exercise is judged twice:

1. **Types** — `tsc --strict` (invoked by `run.js`/`verify.js`) must end
   with zero errors. In a fresh exercise the type errors ARE the todo
   list.
2. **Tests** — the same runtime harness as the JS track, ported to
   `_lib/check.ts`. `throw new Error('TODO')` still reports as todo.

Student workflow, from a module directory:

```
node ../run.js exercises/03-narrowing.ts
```

prints the type errors first, then the test results.

## Module layout

```
tsbootcamp/NN-topic-name/
├── README.md
├── exercises/NN-short-name.ts
└── solutions/NN-short-name.ts
```

## Exercise file template

```ts
// ─────────────────────────────────────────────────────────────────────────
//  04 · firstOrDefault                                     ★★☆ core
//  concepts: generics · type parameters
//  run: node ../../run.js exercises/04-first-or-default.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Prompt with concrete examples, exactly like the JS track.
//
//  hint: one type parameter is enough

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function firstOrDefault(arr: TODO, fallback: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('returns the first element when there is one', () => {
  eq(firstOrDefault([1, 2, 3], 0), 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof firstOrDefault<string>>, string>>;

function _typeTests() {
  const n: number = firstOrDefault([1, 2], 0);
  use(n);

  // @ts-expect-error — a string[] with a number fallback must not compile
  firstOrDefault(['a', 'b'], 1);
}
use(_typeTests);
```

Rules on top of the JS contract:

1. **The `TODO` type alias.** Starters declare `type TODO = any;` once and
   use `TODO` wherever the student must supply a type. For pure type-level
   exercises the placeholder is the whole definition:
   `export type MyPartial<T> = TODO;`
2. **Type tests come AFTER runtime tests**, under their own divider.
   Two forms, use both where they fit:
   - `type _name = Expect<Equal<Actual, Expected>>;` at top level
     (type-only — never executes).
   - Value-level probes inside a `function _typeTests() { ... }` that is
     referenced with `use(_typeTests)` but NEVER called — anything inside
     it type-checks but never runs. ALL expression-level type probes must
     live inside such a function (a bare call at top level would execute
     at runtime and crash the todo-state file).
3. **`@ts-expect-error` is a weapon**: a line under it must fail to
   compile once the student's types are correct-and-precise. If their
   types are too loose (`any` everywhere), tsc reports "Unused
   '@ts-expect-error' directive" — which is an error, so any-cheating
   fails the type grader. Every exercise with meaningful types should
   include at least one. Always put a `— reason` comment on the same line.
4. **The todo state**: a fresh exercise MUST have ≥1 tsc error (the
   `TODO = any` placeholders + `Expect<Equal<...>>` assertions guarantee
   this) and MUST NOT have syntax errors (error codes TS1xxx) or runtime
   failures (only `todo` results). The solution MUST have ZERO tsc errors
   and all-green tests.
5. Solutions delete the `type TODO = any;` line entirely (nothing should
   reference it) and carry a `Walkthrough:` comment like the JS track —
   explaining the TYPES (why this constraint, what inference does), not
   just the runtime code.
6. Runtime code may be shared/trivial where the exercise is about types;
   for pure type-level exercises (mapped/conditional types) 1–2 token
   runtime tests are fine (e.g. a function returning a typed literal), and
   the type tests carry the weight — but never zero runtime tests, the
   harness needs at least one `test()` so verify sees a `#done` line.
7. Imports: always `../../_lib/check.ts` and `../../_lib/type-assert.ts`
   with the `.ts` extension. `import type`/inline `type` specifiers for
   type-only imports.

## Debug modules (dir name contains `-debug`)

Same inversion as the JS track (see `bootcamp/_lib/FORMAT.md`), with the
TS twist that makes it worth doing twice:

- The exercise ships **complete, fully typed code that compiles clean**
  under `tsc --strict` — zero type errors, no `TODO` alias — and is still
  wrong at runtime: ≥1 failing test, 0 todos. `verify.js` enforces it; a
  debug exercise that already passes has no bug to find.
- That's the lesson: types narrow the search, they don't close it. Plant
  defects tsc cannot see — a swapped comparator, a widened `as`, an
  `unknown` parsed too eagerly, a mutated readonly-in-name-only array.
- Prompt states correct behaviour and symptom; it never names the bug.
- Solution is the minimal fix plus a `Walkthrough:` naming the bug class,
  and — where the fix is a type change — why the compiler was quiet.
- `progress.js` shows a still-red debug exercise as 🐛, not ✘.

## Verification (mandatory before you finish)

From the repo root:

```
node tsbootcamp/verify.js NN
```

must report **0 broken** — solutions: tsc clean + tests green; exercises:
no syntax errors, runtime all-todo, type errors allowed (they're counted
as "type todos"). Also sanity-run one exercise through
`node tsbootcamp/run.js <file>` to see the student experience.
