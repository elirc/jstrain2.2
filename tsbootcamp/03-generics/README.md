# 03 · Generics

Generics are where TypeScript stops describing values and starts
computing types. Every library you have ever used runs on them —
`Array<T>`, `Promise<T>`, `Map<K, V>`, `useState<S>`, `Repository<Entity>`
— and every codebase that gave up on them has the same tell: a wall of
`any`, a wall of casts, and a runtime bug that a five-character type
parameter would have caught. The good news is that there is exactly one
idea here, and you already know it from functions.

## The mental model

**1. A generic is a function over types.** `<T>` declares a parameter,
the call site supplies an argument, the body uses it. Same shape as a
value-level function, one level up.

```ts
function identity<T>(value: T): T { return value; }
//                ^ parameter      ^ used twice: in and out
identity(5);          // T = number,  result number
identity<string>('a') // T pinned by hand
```

The payoff is the LINK. `(value: any) => any` runs identically and tells
the compiler nothing; `<T>(value: T) => T` says the thing that comes out
is the thing that went in.

**2. Constraints are parameter types for types.** `T extends { length:
number }` restricts what may come in — and, inside the body, unlocks
what you may do with it. An unconstrained `T` has no members at all.

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return b.length > a.length ? b : a;   // .length is legal now
}
longest('hello', 'hi');   // ok
longest(1, 2);            // ✘ number has no .length
```

Note what a constraint is NOT: it is not the parameter type. Write
`longest(a: { length: number })` and the call still compiles but the
RESULT is `{ length: number }` — the caller's `string` is gone. The
constraint restricts what may come in; the type parameter remembers what
actually did.

**3. Inference flows from the arguments — annotate the data, not the
call.** You almost never write `<>` at a call site. TS collects a
candidate for each type parameter from each argument and solves.

```ts
const users = [{ id: 1, name: 'Ada' }];
pluck(users, 'name');          // T from users, K from 'name' → string[]
pluck<User, 'name'>(users, 'name');  // same thing, typed by hand, noise
```

The corollary is the whole workflow of this module: if a result comes
out wrong, fix the SIGNATURE or annotate the input — do not paper over
it with an explicit type argument at one call site.

**4. `keyof` and `T[K]` make property access computable.** `keyof T` is
the union of T's key names; `T[K]` is the type stored at key K. Two
parameters, one constrained by the other, and a property read becomes
type-safe:

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
getProp(user, 'id');     // number
getProp(user, 'email');  // ✘ not a key of user
```

**5. Classes fix T once; methods can add their own.** A class parameter
is chosen at `new` and every member shares it. A method parameter is
fresh per call — which is how a pipeline changes type as it flows:

```ts
class Chain<T> {
  map<U>(fn: (item: T) => U): Chain<U> { /* … */ }
}
chain([1, 2]).map(String);   // Chain<number> → Chain<string>
```

## The details that bite

1. **Over-constraining.** The rule of thumb: a type parameter that
   appears only ONCE in a signature is usually a mistake — it should
   have been a plain annotation.
   ```ts
   function log<T extends string>(msg: T): void {}  // T buys nothing
   function log(msg: string): void {}               // say this instead
   ```
2. **`extends object` vs `{}` vs `Record<string, unknown>`.** They are
   three different things and people reach for the wrong one weekly.
   `{}` means "anything except null/undefined" (a number passes!),
   `object` means "not a primitive", `Record<string, unknown>` demands
   an index signature — which INTERFACES do not get implicitly.
   ```ts
   declare function f<T extends {}>(x: T): void;
   f(42);   // ✅ compiles — {} is not "an object"
   ```
3. **Literals survive only when T is bare in the return type.** This
   surprises everyone once.
   ```ts
   identity('go');    // 'go'              T sits bare in the return type
   pair('go', 1);     // [string, number]  T is nested → widened
   ```
4. **Multiple candidates do not become a union — usually.** Two
   arguments feeding one T must agree; TS picks a common supertype and
   errors if there is none. The exception: literal candidates that share
   a base type DO union, which is why `longest('abc', 'de')` is
   `'abc' | 'de'`.
   ```ts
   same(1, 'one');   // ✘ Argument of type 'string' is not assignable…
   ```
5. **An uninferrable T falls back to its constraint, then `unknown`** —
   silently. `emptyArrayOf()` is `unknown[]`; `new TypedStack()` is
   `TypedStack<unknown>`. Give the parameter a default or instantiate it
   explicitly.
6. **A default is not a constraint.** `<Meta = Record<string, unknown>>`
   still accepts `LogEntry<number>`. Write `<Meta extends object =
   Record<string, unknown>>` when the fallback is also the rule.
7. **`as const` happens at the argument, not in the signature** — unless
   you use a `const` type parameter (TS 5). `makeEnum(['a','b'])` gives
   `{ [x: string]: string }`; `makeEnum(['a','b'] as const)` and
   `enumFrom(['a','b'])` (declared `<const T …>`) give `{ a: 'a'; b: 'b' }`.
   And `const` cannot un-widen a variable that was already widened.
8. **Generic arrows are ambiguous in `.tsx`.** `const f = <T>(x: T) => x`
   parses as JSX in a `.tsx` file. Write `<T,>(x: T) => x` or
   `<T extends unknown>(x: T) => x`. In a plain `.ts` file it is fine.
9. **`readonly T[]` accepts more and promises less.** `T[]` is
   assignable to `readonly T[]`, never the reverse. Default every
   parameter you do not mutate to `readonly`.
10. **Arrays are covariant and it is unsound.** `Dog[]` passes as
    `Animal[]`, and then someone pushes a cat into your dog array.
    `readonly Animal[]` is the sound version of the same convenience.
11. **Method syntax is bivariant, function properties are not.** Under
    `strictFunctionTypes`, `{ compare: (a: T, b: T) => number }` is
    checked contravariantly while `{ compare(a: T, b: T): number }` is
    not. The same members, two different rules — worth knowing before a
    "cosmetic" refactor lights up red.
12. **`Object.keys` is `string[]`, forever.** An object can carry keys
    beyond its type at runtime, so TS refuses to promise `(keyof T)[]`.
    Cast once, at the boundary, with a comment — not at every call site.
13. **`any` fails the grader.** These files test types with
    `Expect<Equal<…>>` and `@ts-expect-error`. If you type everything
    `any`, the negative tests stop failing and tsc reports "Unused
    '@ts-expect-error' directive" — which is itself an error. Precision
    is the only way out.

## Cheat table

| you write | it means |
| --- | --- |
| `<T>` | a type parameter, filled in per call |
| `<T extends C>` | T must be assignable to C; T's members are C's |
| `<T = D>` | fall back to D when nothing else supplies T |
| `<T extends C = D>` | both: constrained AND defaulted |
| `<const T>` | infer the argument as if it were `as const` |
| `<A extends unknown[]>` + `(...args: A)` | capture a whole parameter list |
| `keyof T` | union of T's key names |
| `T[K]` | the type stored at key K (indexed access) |
| `{ [K in keyof T]: R }` | same keys as T, every value retyped to R |
| `x is T` (return type) | a type guard: narrows the caller's variable |
| `readonly T[]` | an array you may read but not mutate |

| inference source | what T becomes |
| --- | --- |
| `f(5)` where `f<T>(x: T): T` | `5` — literal kept, T is bare in the return |
| `f(5)` where `f<T>(x: T): T[]` | `number` — T is nested, so it widens |
| `f(1, 'a')` where `f<T>(a: T, b: T)` | error — one T, two disagreeing candidates |
| `f()` with no arguments | the default, else the constraint, else `unknown` |
| `f(['a'])` where `f<const T>(x: T)` | `readonly ['a']` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-identity.ts` | ★☆☆ | `identity` and `same` — one parameter, used once and twice |
| 02 | `02-pair.ts` | ★☆☆ | `pair`, `swapPair`, `firstOfPair` over `[A, B]` tuples |
| 03 | `03-wrap-in-array.ts` | ★☆☆ | `wrapInArray`, `repeat`, and the one case that needs explicit instantiation |
| 04 | `04-constrained-longest.ts` | ★★☆ | `longest<T extends { length: number }>` and what an unconstrained T cannot do |
| 05 | `05-clamp-comparable.ts` | ★★☆ | `clamp` on a union constraint, `clampBy` with an injected comparator |
| 06 | `06-get-prop.ts` | ★★☆ | `getProp<T, K extends keyof T>` and a typed `keysOf` |
| 07 | `07-pluck-and-set-prop.ts` | ★★☆ | `pluck` down a column, `setProp` immutably — `T[K]` in both directions |
| 08 | `08-box-and-result.ts` | ★★☆ | `Box<T>`, `Result<T, E = Error>`, `ok`/`err`, and an `isOk` type guard |
| 09 | `09-generic-classes.ts` | ★★☆ | `TypedStack<T>` with an honest `T \| undefined`, plus a `Registry<T>` |
| 10 | `10-default-type-params.ts` | ★★☆ | `LogEntry<Meta = …>` — exactly when a default kicks in |
| 11 | `11-zip-and-map-object.ts` | ★★★ | `zip<A, B>` and `mapObject<T, R>` returning `{ [K in keyof T]: R }` |
| 12 | `12-typed-hofs.ts` | ★★★ | `compose2<A, B, C>`, a signature-preserving `once`, and `tap` |
| 13 | `13-memoize.ts` | ★★★ | `memoize` that keeps the exact wrapped signature, proved by `Expect<Equal>` |
| 14 | `14-pick-and-omit.ts` | ★★★ | `pick`/`omit` as functions whose return types are computed from the keys |
| 15 | `15-store-and-enum.ts` | ★★★ | `createStore<S>` factory, `makeEnum` from an `as const` tuple |
| 16 | `16-readonly-and-variance.ts` | ★★★ | `readonly T[]` params, array covariance, method vs property variance |
| 17 | `17-const-type-params.ts` | ★★★ | `<const T>` — literal tuples with no `as const` at the call site |
| 18 | `18-chain-capstone.ts` | ★★★ | `chain(items).map().filter().take().toArray()`, retyped at every step |

Do the warm-ups and core in order — they build on each other (04 sets up
05, 06 sets up 07 and 14, 15 sets up 17, and 18 uses everything).
Stretch if time allows.

Run one file at a time, from this directory:

```
node ../run.js exercises/01-identity.ts
```

You get graded twice. Types first — **the type errors are the todo
list** — then the runtime tests. A fresh exercise starts with red types
and `☐ todo` tests; you are done when the header says `✔ types clean`
and the footer says `all tests green!`.

Two conventions you will see in every file:

- `type TODO = any;` marks each type you have to supply. Delete the alias
  when nothing references it any more.
- Type tests live under their own divider. `Expect<Equal<A, B>>` is a
  compile-time assertion; the probes inside `function _typeTests()` are
  never called, they only type-check — which is why an `@ts-expect-error`
  line in there is a test that something must NOT compile.

Stuck for more than ten minutes? Read the matching file in `solutions/`
— the walkthrough at the top explains the types, not just the code —
then close it and write it again from memory.

---

**Stuck?** `cheatsheets/typescript.md` (Syntax quick reference → Generics) · **Self-check:** `quizzes/11-typescript.md` · **Next:** `tsbootcamp/04-utility-and-mapped-types`

Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
