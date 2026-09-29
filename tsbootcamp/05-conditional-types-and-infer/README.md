# 05 · Conditional Types & infer

**This is the hard module. Do it after module 04, not before.** Every
other module in this track types code you could have written by hand;
this one writes types that compute. `Exclude`, `ReturnType`, `Awaited`,
the string manipulation behind a typed router, the autocomplete on
`t('errors.auth.expired')` — all of it is four ideas (a question, a
capture, a recursion, a union split) stacked on top of each other. Once
you can read them you stop being scared of the `node_modules` type that
went red, and you can build the two or three helpers that make a whole
codebase's API feel typed instead of stringly-typed.

The exercises are type-challenges style: mostly no runtime code at all.
Your grade is `tsc` going quiet.

## The mental model

**1. `extends` is a question about assignability, not inheritance.**
`T extends U ? A : B` asks the exact question an assignment asks — "could
I put a T where a U is wanted?" — and picks a branch. Nothing is being
subclassed; a string literal "extends" `string` because it fits there.

```ts
type IsString<T> = T extends string ? true : false;
type A = IsString<'hi'>;      // true  — 'hi' fits where string is wanted
type B = IsString<number>;    // false
```

**2. `infer` declares a type variable inside the question.**
It is a capture group. You describe a SHAPE with a hole in it, and if the
checked type fits that shape, the hole gets a name you can use in the
true branch — and only there.

```ts
type Unwrap<T> = T extends Promise<infer V> ? V : T;
type C = Unwrap<Promise<number>>;   // number
type D = Unwrap<string>;            // string — no match, false branch
```

**3. Recursion is the loop; the false branch is the base case.**
A conditional type may name itself. Each pass must hand the recursive
call something strictly smaller (a shorter tuple, a shorter string, one
promise less), and the branch where the pattern stops matching is where
you return. When you need a counter or a running result, add a parameter
with a default — that accumulator is the loop variable of type land.

```ts
type Flatten<T> = T extends readonly (infer E)[] ? Flatten<E> : T;
type E = Flatten<number[][][]>;     // number  — three passes, then stop

type Len<S extends string, Acc extends unknown[] = []> =
  S extends `${string}${infer R}` ? Len<R, [...Acc, unknown]> : Acc['length'];
type F = Len<'hello'>;              // 5 — the tuple did the counting
```

**4. A conditional on a naked type parameter DISTRIBUTES over unions.**
If the checked type is a bare `T` (not `[T]`, not `T[]`) and the argument
is a union, tsc runs the conditional once per member and unions the
answers. That is why `Exclude` is a one-liner: returning `never` deletes
a member, because `never` disappears from a union. Wrap both sides in a
1-tuple to switch it off and judge the union as one type.

```ts
type MyExclude<T, U> = T extends U ? never : T;
type G = MyExclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'

type Loose<T> = T extends string ? true : false;
type Exact<T> = [T] extends [string] ? true : false;
type H = Loose<string | number>;                 // boolean  (true | false)
type I = Exact<string | number>;                 // false
```

## The details that bite

1. **Distribution needs a NAKED parameter.** `T extends U ? …`
   distributes; `[T] extends [U] ? …`, `T[] extends …`, and a concrete
   type on the left do not. This is a silent behaviour change, not an
   error.
   ```ts
   type X = ([string | number] extends [string] ? 1 : 0);   // 0, no split
   ```
2. **`never` is the empty union, so distributing over it yields
   `never`.** Your conditional never runs — you get no `false`, you get
   nothing.
   ```ts
   type Y = IsString<never>;                                // never (!)
   ```
3. **That is why `IsNever` needs brackets.** `T extends never` is useless:
   never is assignable to everything, and distributes to nothing. Ask
   `[T] extends [never]` instead — and note it answers `true` for
   `[never] extends [string]` too, because never fits anywhere.
4. **`boolean` is `true | false`.** A distributed conditional on it takes
   BOTH branches, which is where a surprise `boolean` result comes from.
   ```ts
   type Z = boolean extends true ? 1 : 0;   // 0, but If<boolean,…> gives both
   ```
5. **`any` takes both branches too.** A conditional on `any` returns the
   union of them — one more reason `any` in a type helper poisons
   everything downstream.
   ```ts
   type W = (any extends string ? 'yes' : 'no');            // 'yes' | 'no'
   ```
6. **Recursion has a ceiling.** Tail-recursive conditional types (the
   recursive call IS the whole branch) get a dedicated fast path worth
   ~1000 steps; anything else — a recursive call nested inside a tuple or
   template, like `[...Reverse<R>, H]` — blows up far sooner with
   `TS2589: Type instantiation is excessively deep and possibly
   infinite`. If you see TS2589, you either lost your base case or you
   are recursing over something unbounded (`string`, `number[]`) instead
   of a literal.
7. **A `never` hole makes the whole template `never`.** Handy — empty
   branches contribute nothing to a path union — and lethal if it was an
   accident.
   ```ts
   type P = `a.${never}`;                                   // never
   ```
8. **The empty string does NOT match `` `${infer A}${infer B}` ``.** Two
   adjacent holes force the first to take exactly one character, so `''`
   falls to the false branch. That's your base case for free — and the
   reason a delimiter of `''` behaves differently from any other.
9. **`readonly` arrays don't match `(infer E)[]`.** Write
   `readonly (infer E)[]` if you want both; otherwise a readonly input
   silently falls through to the false branch.
10. **Functions are objects.** `T extends object` is true for
    `() => void`, and mapping over a function keeps its (zero) properties
    while dropping the call signature. Check the function case FIRST.
11. **You must prove a key before indexing.** `T[K]` is an error until
    tsc knows `K extends keyof T`, which is why deep-path types are
    always two nested conditionals.
12. **Repeating an `infer` name unions or intersects.** Same name in
    covariant positions → union of the candidates; in parameter
    (contravariant) positions → intersection.
    ```ts
    type Q<T> = T extends { a: infer U; b: infer U } ? U : never;
    type R = Q<{ a: string; b: number }>;                   // string | number
    ```

## Cheat table — patterns worth memorising

| pattern | matches | binds |
| --- | --- | --- |
| `T extends U ? A : B` | "is T assignable to U?" | — |
| `[T] extends [U] ? A : B` | same, without distributing | — |
| `T extends (infer E)[]` | mutable array | element |
| `T extends readonly (infer E)[]` | any array or tuple | element |
| `T extends [infer H, ...infer R]` | non-empty tuple | head, rest |
| `T extends [...infer R, infer L]` | non-empty tuple | init, last |
| `T extends Promise<infer V>` | a promise | resolved type |
| `T extends (...args: infer P) => infer R` | any function | params tuple, return |
| `` S extends `${infer H}${D}${infer T}` `` | string containing D | before, after |
| `` S extends `${infer C}${infer R}` `` | non-empty string | first char, rest |
| `` S extends `${infer R}${' '}` `` | string ending in a space | everything before |
| `infer H extends string` | narrows the captured type | usable in `${H}` |
| `{ [K in keyof T]: X }[keyof T]` | mapped type → union of values | — |
| `Acc extends unknown[] = []` | the accumulator / loop variable | — |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-conditional-basics.ts` | ★★☆ | `IsString`, `If`, `Flatten1` — extends as a question |
| 02 | `02-infer-first-steps.ts` | ★★☆ | `UnwrapArray`, `UnwrapPromise`, `ElementOf` — one peel |
| 03 | `03-return-and-parameters.ts` | ★★☆ | `MyReturnType`, `MyParameters` from scratch |
| 04 | `04-first-and-last.ts` | ★★☆ | `First`/`Last` on tuples, `FirstArg`/`LastArg` on functions |
| 05 | `05-distributive-conditionals.ts` | ★★★ | `MyExclude`/`MyExtract`/`MyNonNullable` + the `[T]` trick |
| 06 | `06-recursive-conditionals.ts` | ★★★ | `DeepAwaited`, `Flatten` — recursion with a base case |
| 07 | `07-deep-readonly.ts` | ★★★ | `DeepReadonly` — recursive mapped type, stops at functions |
| 08 | `08-tuple-manipulation.ts` | ★★★ | `Push`/`Pop`/`Shift`/`Unshift`/`Reverse` |
| 09 | `09-split-and-trim-left.ts` | ★★★ | `Split<S, D>`, `TrimLeft` — template literal recursion |
| 10 | `10-join-and-trim.ts` | ★★★ | `Join<T, D>`, `TrimRight`, `Trim` — building strings back up |
| 11 | `11-string-to-union.ts` | ★★★ | `StringToUnion`, `LengthOfString` with an accumulator |
| 12 | `12-camel-case.ts` | ★★★ | `CamelCase`, `PascalCase` — recursive rename |
| 13 | `13-path-keys.ts` | ★★★ | `PathKeys<T>` — every dot-path of a nested object type |
| 14 | `14-get-by-path.ts` | ★★★ | **capstone**: `Get<T, P>` + `get(obj, 'a.b.c')` typed by it |

Do 01–04 in order; they are the core and everything later leans on them.
05–14 are stretch, and also in dependency order — 09 feeds 10, 13 feeds
14 — so working straight through is the shortest path even if you skip
around elsewhere in the bootcamp.

## Workflow

```
cd tsbootcamp/05-conditional-types-and-infer
node ../run.js exercises/01-conditional-basics.ts
```

The type errors print first and they ARE the todo list: every
`Type 'false' does not satisfy the constraint 'true'` is one
`Expect<Equal<…>>` that your type answers wrongly. Work top to bottom
until tsc says `types clean`, then check the tests are green.

Two rules that keep you honest:

- **Don't cheat with `any`.** Each file has `@ts-expect-error` probes —
  lines that MUST fail to compile once your types are precise. Make a
  type too loose and tsc reports `Unused '@ts-expect-error' directive`,
  which is itself an error. `any` cannot pass this module.
- **Read the error, not the code.** When an `Expect<Equal<X, Y>>` fails,
  hover `X` (or paste it into a scratch `type Debug = X` and hover that)
  and compare it to `Y` character by character. `readonly`, `?`, and
  labelled tuple elements all count.

Stuck more than ten minutes? Open the solution, read the walkthrough —
each one traces the recursion pass by pass, showing what `infer` binds on
every step — then close it and rewrite the type from memory.

---

**Stuck?** `cheatsheets/typescript.md` (Mapped, conditional, and `infer` — the eight recipes) · **Self-check:** `quizzes/11-typescript.md` · **Next:** `tsbootcamp/06-typing-real-code`

Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
