# 02 · Narrowing

A union type is a promise that a value is *one of these*. Narrowing is how
you cash it in. Every `if`, `switch`, `typeof` and `instanceof` you already
write for runtime correctness is also read by the compiler as a statement
about types — so the same code that protects you at 3am is what unlocks
`.toFixed()` on the line below. This is the module where TypeScript stops
being annotation and starts being analysis: the compiler follows your
control flow, and where it can't follow you, your types quietly go back to
being wide. Learn where it follows and where it gives up and most "why is
this possibly undefined" arguments end.

## The mental model

**1 · The compiler follows your ifs.**

Control-flow analysis walks your function top to bottom and keeps a running
type for every reference. A check that JS understands at runtime is a check
TypeScript understands at compile time.

```ts
function len(x: string | string[]): number {
  if (typeof x === 'string') return x.length; // x is string here
  return x.length;                            // x is string[] here
}
```

Nothing was cast. Each branch just has a smaller type than the parameter
did. The built-in narrowing questions are `typeof`, `instanceof`, `in`,
`===`/`!==` against a literal, truthiness, and `Array.isArray`.

**2 · A discriminant is a literal tag.**

The workhorse. Give every variant of a union the same property name holding
a *different literal type*, and checking that one property resolves the
whole object.

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(s: Shape): number {
  return s.kind === 'circle' ? Math.PI * s.radius ** 2 : s.width * s.height;
}
```

`kind: string` would compile and narrow *nothing* — `string` can't be told
apart from `string`. Literal types exist so that this works.

**3 · Guards move a runtime check into the type system.**

When the check is yours, say so in the return type. `x is T` (a predicate)
answers a question; `asserts x is T` ends it.

```ts
function isFish(pet: Fish | Bird): pet is Fish { return 'swim' in pet; }
pets.filter(isFish);            // Fish[], not (Fish | Bird)[]

function invariant(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
invariant(user !== null, 'no user');
user.name;                      // narrowed from here down
```

The compiler checks the *shape* of the claim and then trusts the body. A
guard with a wrong body compiles fine and lies to every caller — this is
the one place you owe the type system an honest check.

**4 · `never` means "this cannot happen — prove it".**

`never` is the empty type: no value is assignable to it. So a function
taking `never` type-checks only where the compiler has already proved there
is nothing left.

```ts
function assertNever(x: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(x)}`);
}
// in a switch's default: compiles iff every variant was handled
```

Add a variant next sprint and the build breaks on that line, naming the
case you forgot. This is the closest TypeScript gets to a compile-time
coverage checker, and it costs one function.

## The details that bite

1. **Truthiness is not nullish-ness.** `if (x)` also rejects `0`, `''`,
   `NaN` and `false`. It narrows correctly and computes the wrong answer.
   `if (x != null)` is the check you almost always meant.
   ```ts
   const label = count || 'none';   // 0 → 'none'   ✘
   const label = count ?? 'none';   // 0 → 0        ✔
   ```

2. **`typeof null === 'object'`.** Every hand-written object guard needs
   the second half, or `null` walks straight through it.
   ```ts
   typeof value === 'object' && value !== null
   ```

3. **Narrowing dies in callbacks.** A *property*, or a `let` that a nested
   function can reassign, is re-widened inside every callback — the
   compiler does not model when a callback runs, even a `.map` that runs
   immediately. Copy the narrowed value into a `const` (exercise 16).
   ```ts
   if (job.retries !== null) {
     const r = job.retries;              // ✔ const keeps `number`
     return () => r.toFixed(0);          // ✘ if you use job.retries here
   }
   ```
   Since TS 5.4 a plain `let` read *after its last assignment* does keep
   its narrowing in a closure — so the case that still bites is properties
   and variables some other callback can write.

4. **`filter(Boolean)` narrows nothing.** `Boolean` is typed
   `(value?: any) => boolean`, not as a predicate, so `(string | null)[]`
   comes back out unchanged — and at runtime it eats your zeros. Use a
   typed `isPresent` guard (exercise 11).

5. **Optional members need the `undefined` branch.** In a guard,
   `typeof v.email === 'string'` quietly makes `email` required. The
   correct test is `v.email === undefined || typeof v.email === 'string'`.

6. **`any` erases narrowing rather than helping it.** With `any` every
   branch "works", which is why every exercise here carries a
   `@ts-expect-error`: cheat with `any` and the directive goes unused,
   which is itself an error.

7. **Order matters for `instanceof`.** A subclass is also an instance of
   its base, so `error instanceof Error` first swallows every subclass
   branch below it — at runtime only, with no compiler complaint.

8. **Excess property checks only fire on fresh object literals.** A literal
   mixing two variants of a union is rejected; the same object assigned via
   a variable first is not.

## Cheat table

| you write | it narrows | good for |
| --- | --- | --- |
| `typeof x === 'string'` | primitives | `string`/`number`/`boolean`/`function` |
| `x instanceof Foo` | classes + subclasses | errors, `Date`, DOM nodes |
| `'fly' in pet` | unions by member | shapes with no tag |
| `x.kind === 'circle'` | discriminated unions | anything you designed yourself |
| `x != null` | drops null+undefined | optional values |
| `Array.isArray(x)` | `T \| T[]` | overloaded inputs |
| `isFish(pet)` | your predicate | reusable checks, `filter` |
| `invariant(cond, msg)` | your assertion | preconditions, no nesting |
| `assertNever(x)` | nothing — it proves | exhaustiveness |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-typeof-format.ts` | ★☆☆ | `format` over `string \| number \| boolean` via `typeof` |
| 02 | `02-truthiness-trap.ts` | ★★☆ | `renderField` / `withDefault` — where `if (x)` ships a bug |
| 03 | `03-equality-narrowing.ts` | ★☆☆ | `===` on a literal union; `null` vs `undefined` |
| 04 | `04-in-operator.ts` | ★☆☆ | `Bird \| Fish` narrowed by member with `in` |
| 05 | `05-instanceof-routing.ts` | ★★☆ | error subclasses → HTTP codes; `Date \| string \| number` |
| 06 | `06-shape-area.ts` | ★★☆ | the `Shape` discriminated union and `area()` |
| 07 | `07-api-result.ts` | ★★☆ | generic `ApiResult<T>` with `unwrapOr` / `mapResult` |
| 08 | `08-action-reducer.ts` | ★★★ | a Redux-style action union and a pure reducer |
| 09 | `09-exhaustive-never.ts` | ★★☆ | `assertNever` and compile-time exhaustiveness |
| 10 | `10-type-predicates.ts` | ★★☆ | `isFish`, `isNonEmpty`, guards inside `filter` |
| 11 | `11-filter-boolean.ts` | ★★★ | `isPresent` / `compact` — fixing `filter(Boolean)` |
| 12 | `12-narrowing-unknown.ts` | ★★★ | `unknown` at the boundary; parse, don't validate |
| 13 | `13-assertion-functions.ts` | ★★★ | `asserts cond` and `asserts x is User` |
| 14 | `14-satisfies-config.ts` | ★★☆ | a routes map checked by `satisfies`, literals intact |
| 15 | `15-as-const-actions.ts` | ★★☆ | `as const` + `typeof arr[number]` as one source of truth |
| 16 | `16-narrowing-dies.ts` | ★★★ | where control-flow analysis gives up, and the fix |

Do the warm-ups and core in order. Stretch if time allows.

06 → 07 → 08 → 09 is one arc: build a discriminated union, make it generic,
put it to work, then make the compiler police it. Do those four together
even if you skip around elsewhere.

## Workflow

From this directory:

```
node ../run.js exercises/01-typeof-format.ts
```

Type errors print first, then the tests. In a fresh exercise **the type
errors are the todo list** — every `TODO` placeholder, every failing
`Expect<Equal<...>>`, and every `@ts-expect-error` sitting on a line that
does not (yet) error. You are done with a file when tsc is silent and the
tests are green. Compare with `solutions/` only after you have made tsc
quiet on your own.

---

**Stuck?** `cheatsheets/typescript.md` (The narrowing toolbox) · **Self-check:** `quizzes/11-typescript.md` · **Next:** `tsbootcamp/03-generics`

The runtime `typeof` quirks these guards stand on were drilled in `bootcamp/01-language-core`. Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
