# 04 · Utility and Mapped Types

This is the module where TypeScript stops being annotations and starts
being a language. Everything here — `Partial`, `Pick`, `Record`,
`ReturnType`, the `on${Capitalize<K>}` trick a router or a form library
pulls on you — is built from one construct: a loop over keys. Sixteen
drills: use the builtins the way a working codebase uses them, then
rebuild each of them from scratch, then go past them into key remapping,
value filtering and template literal parsing, and finish by modelling a
form state system that stays keyed to its data forever.

The payoff is not cleverness. It is that a derived type cannot drift.
Hand-write `PublicUser` next to `User` and one of them goes stale; write
`Omit<User, 'passwordHash'>` and it cannot.

Run any file:

```
node ../run.js exercises/01-partial-patch.ts   # type errors, then todos
node ../run.js solutions/01-partial-patch.ts   # clean types, all green
```

## The mental model

**1. A mapped type is a for-loop over keys.** `keyof T` is the union of
T's keys; `[K in keyof T]` iterates it; `T[K]` looks the value back up.
The identity mapped type copies an object and does nothing else:

```ts
type Loop<T> = { [K in keyof T]: T[K] };   // Loop<X> is X
```

Everything else is that line plus a change. Change the value type and you
get `Record`. Add a modifier and you get `Partial` / `Readonly`. Loop over
a different key union and you get `Pick`.

```ts
type Partial<T>  = { [K in keyof T]?: T[K] };        // add ?
type Required<T> = { [K in keyof T]-?: T[K] };       // subtract ?
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };
```

**2. `as` renames the key mid-loop — and `never` deletes it.** The `as`
clause rewrites each key while the loop still knows which key it came
from, so the value can keep referring to `T[K]`.

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
// { name: string } → { getName: () => string }

type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
// a key mapped to `never` is dropped — that is how you filter
```

**3. Template literal types are string concatenation for types**, and
`infer` inside one is pattern matching.

```ts
type Length = `${number}px` | `${number}rem`;     // '12px' ✔  '12em' ✘
type Tail<S> = S extends `data_${infer Rest}` ? Rest : S;
// Tail<'data_id'> → 'id'
```

Placeholders can be `string`, `number`, `bigint`, `boolean`, or any
literal union — and a union placeholder distributes, so
`` `${'a'|'b'}-${1|2}` `` is four literal types, not one.

**4. The builtins are one-liners; know how they are spelled.** Not to
avoid importing them — you cannot, they are global — but because the
variant you actually need next week (`PartialBy`, `Mutable`, a stricter
`Omit`, `PickByValue`) is not in the standard library, and it is always
one of these with a word changed.

## The details that bite

1. **Homomorphic mapped types preserve modifiers; other loops destroy
   them.** A loop is homomorphic when its source is `keyof T` — or a type
   parameter `K extends keyof T`, which is why `Pick` qualifies. Those
   copy `readonly` and `?` through. Rebuild the same object any other way
   and you silently lose them.
   ```ts
   Partial<{ readonly a: string }>                    // { readonly a?: string } ✔
   Record<keyof { readonly a?: string }, string>      // { a: string }  — both gone
   ```
2. **`-?` removes `undefined` from the value type, not just the question
   mark.** That is the whole point: after `Required`, `config.port` is
   `number` and needs no `?? 8080`. (It removes only `undefined` — an
   explicit `| null` survives.)
3. **`string & K` before you concatenate.** `keyof T` can contain symbols
   and numbers, and a template literal type cannot interpolate a symbol,
   so `` `get${Capitalize<K>}` `` fails to compile over a generic T.
   `string & K` narrows each key to its string part; symbol keys
   intersect to `never` and drop out.
4. **`keyof` on an index signature is wider than you expect.**
   ```ts
   keyof { [k: string]: number }   // string | number  — not string
   ```
   A numeric key is a valid string key at runtime, so tsc includes it.
   Loops over such a type give you an index signature back, not fixed keys.
5. **A filter's `extends` is assignability, not equality.** An optional
   `b?: string` has type `string | undefined`, which does NOT extend
   `string`, so `PickByValue<{ b?: string }, string>` is `{}`. Same for a
   `string | number` column. Use `NonNullable<T[K]> extends V` if you meant
   "could be a string".
6. **Remapping two keys onto one name silently unions their values.**
   `RenameKeys<{ a: string; b: number }, { a: 'x'; b: 'x' }>` is
   `{ x: string | number }`. No warning, and the union surfaces three files
   away.
7. **`A & B` is not "B wins".** For an overlapping key it produces
   `A[K] & B[K]`, and `{ a: number } & { a: string }` has `a: never` — a
   property nothing can be assigned to. A spread's real semantics are
   `Omit<A, keyof B> & B`.
8. **An intersection is not identical to the flat object.** It behaves the
   same and reads horribly, and strict `Equal<>` checks reject it. Wrap it
   in the no-op loop — `type Prettify<T> = { [K in keyof T]: T[K] }` — to
   collapse it.
9. **The standard `Omit` accepts keys that do not exist.** Its constraint
   is `K extends keyof any`, so `Omit<User, 'passwrod'>` compiles and omits
   nothing. `K extends keyof T` is the version that catches the typo.
10. **Pick is an allow-list, Omit is a deny-list.** For anything leaving
    the process, prefer Pick: add a `resetToken` column tomorrow and Omit
    publishes it while Pick drops it.
11. **`readonly` is compile-time only, and shallow.** It stops your code,
    not a JS caller (`Object.freeze` does that), and
    `Readonly<{ inner: { n: number } }>` leaves `inner.n` writable.
12. **Homomorphic loops follow arrays and tuples into their elements.**
    ```ts
    Partial<string[]>    // (string | undefined)[]  — not { 0?: string, ... }
    Readonly<string[]>   // readonly string[]
    ```
13. **`${number}` is a shape check, not a validator.** `'1e3px'` and
    `'0x10px'` are valid `` `${number}px` `` literals, and no template
    literal type proves anything about a string that came off the network.

## Built-in utilities cheat table

| Utility | Gives you | Spelled |
| --- | --- | --- |
| `Partial<T>` | every key optional | `{ [K in keyof T]?: T[K] }` |
| `Required<T>` | every key present | `{ [K in keyof T]-?: T[K] }` |
| `Readonly<T>` | every key locked | `{ readonly [K in keyof T]: T[K] }` |
| *`Mutable<T>`* (not builtin) | every key writable | `{ -readonly [K in keyof T]: T[K] }` |
| `Pick<T, K extends keyof T>` | the named keys | `{ [P in K]: T[P] }` |
| `Record<K extends PropertyKey, V>` | a keyed dictionary | `{ [P in K]: V }` |
| `Omit<T, K extends keyof any>` | everything but K | `Pick<T, Exclude<keyof T, K>>` |
| `Exclude<T, U>` | union minus union | `T extends U ? never : T` |
| `Extract<T, U>` | union overlap | `T extends U ? T : never` |
| `NonNullable<T>` | no null/undefined | `T & {}` |
| `Parameters<F>` | argument tuple | `F extends (...a: infer P) => any ? P : never` |
| `ReturnType<F>` | result type | `F extends (...a: any) => infer R ? R : never` |
| `Awaited<T>` | settled value | `T extends PromiseLike<infer U> ? Awaited<U> : T` |
| `InstanceType<C>` | what `new C()` gives | `C extends new (...a: any) => infer R ? R : never` |
| `Capitalize<S>` etc. | cased string type | compiler intrinsic — no TS spelling |

`Exclude`, `Extract` and friends are conditional types; module 05 builds
those. Here you may use them as builtins.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-partial-patch.ts` | ★☆☆ | `Partial` for a settings patch, and the merge that treats explicit `undefined` as "no change" |
| 02 | `02-readonly-required.ts` | ★☆☆ | `Required` + `Readonly` at a config boundary: resolve defaults once, hand out a frozen result |
| 03 | `03-pick-omit-dto.ts` | ★★☆ | public / summary / credentials views of one `User` with `Pick` and `Omit` |
| 04 | `04-record-wrappers.ts` | ★★☆ | `Record` permission table, a `logged` wrapper typed with `Parameters`/`ReturnType`, `Awaited` on an async result |
| 05 | `05-my-partial-required.ts` | ★★☆ | `MyPartial` and `MyRequired` from scratch (`?` and `-?`) |
| 06 | `06-my-readonly-mutable.ts` | ★★☆ | `MyReadonly` and `Mutable` (`readonly` and `-readonly`) |
| 07 | `07-my-pick-record.ts` | ★★☆ | `MyPick` and `MyRecord`, constraints included |
| 08 | `08-my-omit.ts` | ★★★ | `MyOmit` via keyof exclusion — stricter than the real one |
| 09 | `09-getters.ts` | ★★★ | `Getters<T>` with an `as` clause + `Capitalize`, and the runtime that matches |
| 10 | `10-rename-keys.ts` | ★★★ | `RemovePrefix` (`infer` in a template) and `RenameKeys` (mapping lookup) |
| 11 | `11-pick-by-value.ts` | ★★★ | `PickByValue` / `OmitByValue` — filtering keys by their value type |
| 12 | `12-event-names.ts` | ★★☆ | `on${Capitalize<K>}` handler slots, plus typed `on()` and `emit()` |
| 13 | `13-css-units.ts` | ★★☆ | `` `${number}px` `` and friends, parsed back into number + unit |
| 14 | `14-route-params.ts` | ★★★ | `Params<'/users/:id/posts/:postId'>` → `'id' \| 'postId'`, with a matching extractor |
| 15 | `15-partial-by-merge.ts` | ★★★ | `PartialBy`, `RequiredBy`, `Nullable`, and a `Merge` with honest overwrite semantics |
| 16 | `16-form-state.ts` | ★★★ | capstone: `FormState<T>` (values / errors / touched) with a typed `setField` |

Do the warm-ups and core in order — 05 through 08 are the ones that make
the rest obvious, so do not skip them even if you already use `Partial`
daily. Stretch if time allows; 16 is worth it even if you cherry-pick.

## Workflow

`node ../run.js exercises/NN-name.ts` prints the type errors first, then
the test results. **The type errors are the todo list.** A fresh exercise
declares `type TODO = any;` and uses `TODO` wherever a type is missing;
your job is to delete every `TODO` and get tsc quiet, then make the
runtime tests green.

Do not "solve" the type errors with `any`. Every exercise carries
`@ts-expect-error` probes — lines that MUST fail to compile once your
types are right. Loosen your types and those lines start compiling, tsc
reports `Unused '@ts-expect-error' directive`, and you are red again.
That is deliberate: it is the only way a type exercise can grade
precision rather than mere compilation.

`node ../progress.js 04` scores the module; an exercise counts as done
only when its types are clean AND its tests pass.

---

**Stuck?** `cheatsheets/typescript.md` (Utility types; Mapped, conditional, and `infer`) · **Self-check:** `quizzes/11-typescript.md` · **Next:** `tsbootcamp/05-conditional-types-and-infer`

Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
