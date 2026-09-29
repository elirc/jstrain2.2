# 01 · Types and Annotations

TypeScript is a description language for JavaScript values. You are not
learning a new runtime — every one of these files runs as plain JavaScript once
the types are stripped — you are learning to describe, precisely, the values
your code already moves around. Do that well and whole categories of bug stop
being possible: the misspelled property, the string that was supposed to be a
number, the object that was missing a field on one code path out of five. Do it
badly — `any` everywhere, annotations that repeat what the compiler already
knew — and you get the ceremony without the safety.

This module is the vocabulary. Everything later (narrowing, generics, mapped
types) is built out of these pieces.

Read this page first (about 10 minutes), then work through the exercises in
order.

---

## The mental model

### 1. A type is a set of values, not a class

`string` is the set of all strings. `'GET'` is a set with one member. `'GET' |
'POST'` is a set with two. `boolean` is really `true | false`. Assignability is
just the subset question: can every value on the right also be found on the
left?

```ts
let m: 'GET' | 'POST' = 'GET';   // fine — 'GET' is in the set
let s: string = m;               // fine — the set of two is inside string
```

That is why unions cost nothing to create, why `never` (the empty set) vanishes
inside a union, and why `unknown` (the set of everything) accepts any value but
lets you do nothing with it.

### 2. Structural, not nominal

There is no `implements` requirement anywhere in this module. Two types written
by two people who never met are the same type if they have the same members —
and a type with extra members is usable wherever the smaller one is wanted.

```ts
type Named = { name: string };
const employee = { name: 'Ada', salary: 100 };
const named: Named = employee;   // no conversion, no declaration, no import
```

Ask "does this shape have what I need?", never "is this the right class?".

### 3. Inference first; annotate the boundaries

The compiler already knows the type of everything you write down. Annotations
are for the places it cannot see: parameters, and anywhere the inferred type is
wrong for the job.

```ts
const port = 5432;               // 5432    — inference is right
let mode = 'dark';               // string  — inference is right
let method: 'GET' | 'POST' = 'GET';  // annotation: inference would say string
function total(scores: readonly number[]): number { … }  // params always
```

The rule of thumb: annotate what crosses a boundary (exported functions,
parameters, public data shapes), let everything inside a function infer. An
annotation that merely repeats the initializer is noise that will one day drift
out of date and be believed.

### 4. Types are erased — with one exception

Types have no runtime existence. You cannot ask "is this value a `User`" at
runtime, because by then there are no `User`s, only objects. Every check you
write at runtime — `typeof`, `Array.isArray`, `'key' in obj` — is ordinary
JavaScript that the compiler happens to read as evidence.

The exception is `enum`, which emits a real object. That is exactly why the
as-const alternative in exercise 12 exists.

---

## The details that bite

1. **`const` keeps the literal, `let` widens it.** Mutability decides.
   ```ts
   const a = 'dark';   // 'dark'      let b = 'dark';   // string
   ```
2. **Properties widen even inside a `const` object.** The object is const; the
   properties are not.
   ```ts
   const t = { name: 'dark' };  // { name: string } — not { name: 'dark' }
   ```
3. **`as const` stops all of it at once** — literals stay literal and every
   property (and array element) becomes readonly.
4. **An empty array literal has nothing to infer from.** `const xs = []` starts
   as an *evolving* `any[]` that TypeScript tries to settle from later pushes;
   when it cannot, you get an implicit-any error (TS7034). Annotate it.
   ```ts
   const xs: string[] = [];          // say it once, here
   ```
5. **Excess property checks only fire on FRESH object literals.** The same
   object assigned through a variable sails through — which is why a typo is
   caught inline and invisible one line later.
   ```ts
   const n: Named = { name: 'Ada', naem: 'Ada' };  // error
   const raw = { name: 'Ada', naem: 'Ada' };
   const m: Named = raw;                          // no error
   ```
6. **`?` and `| undefined` are different.** `email?: string` may be omitted;
   `email: string | undefined` must be written, possibly as `undefined`.
7. **`readonly` blocks reassignment, not copying.** `{ ...order, status }` is
   how you "change" a readonly field, and it type-checks.
8. **A `readonly T[]` is not a `T[]`.** Assignment flows one way only, so
   taking `readonly` parameters accepts more callers, not fewer.
9. **A tuple is not an array.** `[number, number]` is assignable to `number[]`;
   `number[]` is not assignable back — the compiler has no idea how many
   elements are in there.
10. **`any` is contagious and bidirectional.** Anything an `any` touches
    becomes `any`, silently, all the way down the call chain. `unknown` is the
    same permissiveness at the input with none of the leak at the output.
11. **An assertion is a claim, not a check.** `raw as User` and `map.get(k)!`
    run no code; if you are wrong, `undefined` walks straight through a
    non-optional type.
12. **An index signature answers for keys that were never there.**
    `counts['banana']` is typed `number` and is `undefined` at runtime. Use
    `?? 0` at the read site (or turn on `noUncheckedIndexedAccess`).
13. **`typeof x` in a type position is not the runtime `typeof`.** One yields a
    type, the other a string. `keyof typeof x` is the everyday combination.
14. **`typeof x` reports the NARROWED type at that spot.** After `const flag:
    boolean = false`, `typeof flag` at module scope is `false`; inside a
    function body the declared `boolean` comes back. (Several exercises put
    their assertion inside `_typeTests` for exactly this reason.)
15. **Enum members are nominal — the one un-structural corner of the
    language.** `Color.Red` is assignable to `string`, but the string `'red'`
    is not assignable to `Color`. Every value from JSON needs converting.
16. **Numeric enums carry a reverse map; string enums don't.** `Level[0]` is
    `'Debug'`, so `Object.keys(Level)` returns eight entries for four members.
    A numeric enum also used to accept any number — since TS 5.0 it doesn't.
17. **`void` is not `undefined`.** It means "ignore whatever comes back", which
    is why a `() => void` slot accepts a function that returns a value.
18. **A function that always throws returns `never`,** and `never` disappears
    from a union — which is what makes `Number(x) || fail('bad')` a `number`.

---

## Cheat table

| you want | write | note |
|---|---|---|
| array | `T[]` or `Array<T>` | identical |
| unmodifiable array | `readonly T[]` | prefer for parameters you only read |
| fixed pair | `[x: number, y: number]` | labels are documentation |
| optional / rest element | `[a: string, b?: number]`, `[s: string, ...n: number[]]` | `['length']` becomes a union |
| optional property | `name?: string` | may be omitted entirely |
| assign-once property | `readonly id: string` | copying is still fine |
| closed set of strings | `'GET' \| 'POST'` | the workhorse |
| open dictionary | `Record<string, number>` | same as `{ [k: string]: number }` |
| fixed-key dictionary | `Record<'a' \| 'b', boolean>` | demands both keys |
| callback | `type Fn = (v: number) => string` | gives the callback its param types |
| returns nothing | `: void` | not `undefined` |
| never returns | `: never` | always throws / never ends |
| any value, honestly | `unknown` | narrow before use |
| the type of a value | `typeof defaults` | value world → type world |
| its keys | `keyof typeof defaults` | typeof first, then keyof |
| one property's type | `Config['port']` | indexed access takes a type |
| a function's result | `ReturnType<typeof make>` | the most-used pair in real code |
| freeze a literal | `{ … } as const` | literal types + readonly |
| "trust me" | `value as T` | no runtime check |
| "not null here" | `value!` | no runtime check |

---

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-primitive-annotations.ts` | ★☆☆ | five config bindings — decide annotate vs infer, three of them by deleting |
| 02 | `02-inference-and-widening.ts` | ★☆☆ | `const` vs `let` vs property widening, and the one annotation that earns its place |
| 03 | `03-arrays-and-readonly.ts` | ★☆☆ | `T[]`, `number[][]`, and `readonly` parameters that accept more callers |
| 04 | `04-tuples.ts` | ★☆☆ | `Point` and `Entry` — fixed positions, labels, destructuring |
| 05 | `05-object-shapes.ts` | ★☆☆ | a `User` modelled from a spec: optional, readonly, nested |
| 06 | `06-tuple-rest-and-optional.ts` | ★★☆ | `Route`, `Row`, `Rgb` — optional and rest elements, readonly tuples |
| 07 | `07-function-annotations.ts` | ★★☆ | default vs optional parameters, and what `void` really returns |
| 08 | `08-function-types.ts` | ★★☆ | `Formatter`/`Listener` aliases, contextual typing, `fail(): never` |
| 09 | `09-union-literals.ts` | ★★☆ | `Method`, `Direction`, `Id` — and an exhaustive `switch` that needs no default |
| 10 | `10-type-vs-interface.ts` | ★★☆ | the same shape both ways, `extends` vs `&`, declaration merging |
| 11 | `11-enums.ts` | ★★☆ | a numeric enum and a string enum, reverse mapping, the nominal quirk |
| 12 | `12-as-const-objects.ts` | ★★☆ | the same levels without an enum: `as const` + `keyof typeof` |
| 13 | `13-unknown-vs-any.ts` | ★★☆ | `safePrint(value: unknown)` — narrow before use, with an any-cheat detector |
| 14 | `14-type-assertions.ts` | ★★☆ | `as` on a JSON payload, `!` on a Map lookup, `as const` on an origin list |
| 15 | `15-index-signatures.ts` | ★★☆ | open `Counts` vs closed `Record<'darkMode' \| 'beta', boolean>` |
| 16 | `16-typeof-operator.ts` | ★★★ | derive `Config`, `ConfigKey`, `Port` and `Client` from one value |
| 17 | `17-structural-typing.ts` | ★★★ | width subtyping and the excess property check, side by side |
| 18 | `18-order-domain.ts` | ★★★ | an `Order` domain: status union, readonly id, readonly items, immutable updates |

Five warm-ups (★☆☆), ten core (★★☆), three stretch (★★★) — 81 runtime tests
and 132 type assertions (77 `Expect<Equal<…>>`, 55 `@ts-expect-error`).

Do the warm-ups and core in order. Stretch if time allows.

---

## Working an exercise

From this directory:

```
node ../run.js exercises/01-primitive-annotations.ts   # types, then tests
node ../progress.js 01                                 # how far you are
```

`run.js` prints the type errors first and the test results second. **Both
graders must go green.** In a fresh exercise every `TODO` is `any`, so the type
errors ARE the todo list — work down them until tsc is quiet, then make the
tests pass.

Two things to know about the type tests at the bottom of each file:

- `type _1 = Expect<Equal<A, B>>;` fails to compile when your type is not
  *exactly* B. Close is not equal: `readonly`, `?` and literal-vs-widened all
  count.
- A line under `// @ts-expect-error` must FAIL to compile once your types are
  right. If you paper over an exercise with `any`, that line starts compiling
  and tsc reports an unused directive — which is itself an error. There is no
  way to `any` your way to green.

Stuck for more than ten minutes? Read the matching file in `solutions/` — every
one opens with a walkthrough explaining the types, not just the code.

---

**Stuck?** `cheatsheets/typescript.md` (Syntax quick reference → Annotations; `satisfies` vs annotation vs `as`) · **Self-check:** `quizzes/11-typescript.md` · **Next:** `tsbootcamp/02-narrowing`

Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
