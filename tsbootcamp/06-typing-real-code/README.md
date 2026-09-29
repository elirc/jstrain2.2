# 06 · Typing Real Code

Modules 01–05 taught you the type system. This one is about the job. Almost
nothing you type at work is a clever conditional type — it is a util someone
wrote in JS three years ago, an API client, an event bus, a config map, a
test double. What separates a codebase that is pleasant in TypeScript from
one that fights you is not exotic types; it is a handful of habits applied
at the right places. Put one source of truth in a map. Derive everything
else from it. Take the widest honest input, return the narrowest honest
output. Quarantine the unavoidable `as` at the boundary where data enters.
This module is sixteen chances to build that reflex.

Do this module after 03 (generics). 04 (utility & mapped types) and 05
(conditional types & `infer`) help — exercises 05, 10, 13 and 15 lean on
them — but most files here need nothing beyond generics and `keyof`.

## The mental model

**1. Types are your API contract, and the error message is the API.**
Every signature is a promise to callers and a constraint on you. Two
encodings can be equally "correct" and wildly different to use, because what
a caller actually experiences is the squiggle. Design for that.

```ts
// same intent, different experience
function build(): Config | undefined     // caller: "why undefined? when?"
build(...guard: Ready extends Set ? [] : [missing: 'host' | 'port']): Config
// caller: Expected 1 arguments, but got 0 — and it names what is missing
```

Ask of every type you write: *what does the wrong call look like?*

**2. Make illegal states unrepresentable.**
If a value cannot be constructed, it cannot be mishandled. This applies to
data (a discriminated union instead of `{ ok: boolean; value?: T; error?: E }`)
and equally to call sequences (a builder with no `build` until the required
keys are set).

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
if (r.ok) r.value;        // narrowing works
else      r.error;        // and the other branch is a compile error
```

The `boolean` version compiles too — and narrows nothing, forever.

**3. Annotations at boundaries, inference inside.**
Annotate where values enter and leave: exported signatures, module edges,
the line where `unknown` becomes `User[]`. Everywhere else let inference do
it — a local annotation is a place two things can disagree.

```ts
export function createClient(fetcher: Fetcher): Client { ... }  // annotate
const users = await client.request('GET /users', { query: {} }); // infer
```

The single `as ResponseOf<E>` inside `request` is the whole trust boundary.
One named place to add a schema check later, instead of `any` in fifty call
sites.

**4. Maps, overloads and evolving type params are why libraries feel magic.**
Every "how does it *know*?" API is one of a small number of tricks:

```ts
interface Endpoints { 'GET /users': { response: User[] } }  // a key map
type ResponseOf<E extends Endpoint> = Endpoints[E]['response'];   // derive
function parseNum(t: string): number;                       // overloads
function parseNum(t: string, o: { nullable: true }): number | null;
set<K extends keyof Config>(k: K, v: Config[K]): Builder<Set | K>; // evolve
```

A map plus `keyof` plus indexed access covers most of it. Learn to see it
and you can build it.

## The details that bite

1. **A `catch` binding is `unknown`, not `Error`** — has been since TS 4.4
   under `strict`. JS can `throw` anything, so normalise once at the top.
   ```ts
   catch (e) { e.message }              // error TS18046
   catch (e) { toError(e).message }     // ✔
   ```
2. **Overloads resolve top to bottom, first fit wins.** Put the most
   specific signature first, or a broader one swallows it.
   ```ts
   toList<T>(v: T): T[]; toList<T>(v: readonly T[]): T[];  // wrong order
   toList([1, 2])   // → number[][], silently
   ```
3. **`ReturnType` of an overloaded function sees only the LAST overload.**
   Same for `Parameters`. There is no built-in "union of all overloads".
   ```ts
   ReturnType<typeof parseNum>   // number | null, never number
   ```
4. **The implementation signature is not callable.** It exists to satisfy
   the compiler, so `parseNum('x', { nullable: false })` is an error even
   though the implementation would accept it.
5. **`satisfies` checks and keeps; `as` claims and flattens; an annotation
   checks and flattens.** For config maps you almost always want the first.
   ```ts
   const r = { '/a': h } satisfies Record<string, Handler>;
   type Route = keyof typeof r;   // '/a'  — with an annotation it is string
   ```
6. **`satisfies` also contextually types the members**, which is how the
   handler's `req` parameter stops being an implicit `any`.
7. **Declaration merging is per-scope, and augmentation needs the exact
   module specifier.** `declare module './fixtures/registry.ts'` must match
   how the module resolves — extension and all, here.
8. **An augmenting file must itself be a module.** With no import or export
   in it, `declare module 'x' { ... }` declares an *ambient* module — a
   different feature that stubs a package instead of extending one. And
   augmentation can only ADD members; redeclaring one with a new type is an
   error, not an override.
9. **Interfaces get no implicit index signature; type aliases do.** This is
   why `Emitter<E extends Record<string, unknown[]>>` accepts a `type`
   event map and rejects the identical `interface`.
10. **`Readonly<T>` is one level deep.** `state.items.push(...)` still
    compiles. Write the recursive version, and test the array branch first —
    arrays are objects.
11. **`as const` or nothing.** An object literal widens its values to
    `string`, and a lookup table that has widened is a lookup table that
    teaches the compiler nothing.
12. **Assertion functions need an explicit return annotation** — TS will
    never infer `asserts x is T` — and the call target must be a declared
    name. `const f = assertDefined; f(x)` narrows nothing.
13. **A type parameter infers from every position it appears in.** That is
    how a wrong argument widens the type meant to catch it; `NoInfer<T>`
    (5.4+) marks a position as check-only.
14. **`Extract<T[K], AnyFn>`, not `T[K] & AnyFn`.** An intersection of two
    call signatures is an overload set, and `Parameters` takes the last one
    — `any[]`.
15. **`Object.keys` returns `string[]` by design**, because a value can
    always have more keys at runtime than its type admits. Asserting is fine
    when you own the literal; it is a lie when the object came from JSON.

## Cheat table

| you write | what you get |
| --- | --- |
| `keyof Endpoints` | the union of its keys |
| `Endpoints[E]['response']` | indexed access — read a type off a type |
| `{ [K in Tag]: {...} }[Tag]` | a mapped type indexed back into a union |
| `{ [K in keyof T]: F<T[K]> extends X ? K : never }[keyof T]` | keys filtered by value type |
| `x satisfies T` | checked against T, typed as written |
| `x as T` | unchecked claim, typed as T |
| `{...} as const` | every literal stays literal, everything readonly |
| `asserts x is T` | narrows after the call; must throw on failure |
| `x is T` | a guard — narrows inside the `if` |
| `NoInfer<T>` | check here, do not infer here |
| `(...args: never[]) => unknown` | "any function", without `any` |
| `Parameters<F>` / `ReturnType<F>` | a function's argument tuple / result |
| `Builder<Set \| K>` | a type parameter carrying state through a chain |
| `declare module 'spec' { ... }` | merge new members into another file's interface |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-migrate-parse-duration.ts` | ★★☆ | type a shipped JS util: literal unions + a type predicate |
| 02 | `02-migrate-group-by.ts` | ★★☆ | `groupBy` / `countBy` — two type params, `PropertyKey` |
| 03 | `03-unknown-in-catch.ts` | ★★☆ | `toError` / `safeRun` / a Result union / typed Error subclasses |
| 04 | `04-overload-parse-num.ts` | ★★★ | overload signatures, and what resolution ORDER costs |
| 05 | `05-element-factory.ts` | ★★★ | `el('a', { href })` — a tag map, a mapped union, `render` |
| 06 | `06-typed-emitter.ts` | ★★★ | `Emitter<{ message: [text: string] }>` with on/off/emit |
| 07 | `07-typed-api-client.ts` | ★★★ | an endpoint map, one cast at the boundary, an injected fetcher |
| 08 | `08-evolving-builder.ts` | ★★★ | `build()` that does not exist until the required keys are set |
| 09 | `09-typed-state-machine.ts` | ★★★ | `as const` transitions; legal events per state, checked |
| 10 | `10-assertion-functions.ts` | ★★☆ | `assertDefined` / `assertShape` walking untyped JSON |
| 11 | `11-store-with-selectors.ts` | ★★☆ | a store where the selector carries the types |
| 12 | `12-satisfies-config-maps.ts` | ★★☆ | routes + theme tokens: `satisfies` vs `as` vs annotation |
| 13 | `13-readonly-boundary.ts` | ★★☆ | a cart that mutates inside and is deeply readonly outside |
| 14 | `14-module-augmentation.ts` | ★★★ | `declare module` — a plugin registry across two files |
| 15 | `15-typed-spy-on.ts` | ★★★ | `spyOn` that takes only method keys and keeps the signature |
| 16 | `16-typing-the-harness.ts` | ★★★ | `NoInfer`, a table-driven runner — type the harness itself |

Everything here is core or stretch; there are no warm-ups. Do 01–03 in order
(they set up the habits), then take the rest in any order you like — each
file stands alone. 04 and 05 are a pair, and 16 is the one to finish on.

**Workflow.** From this directory:

```
node ../run.js exercises/01-migrate-parse-duration.ts
```

Types print first, then the tests. In 01 and 02 the runtime tests are green
from the very first run — those two are pure migrations, and tsc's output is
the whole todo list. In every other file the tests start as `todo` and the
type errors come along for the ride. A file is done when tsc is silent AND
the tests are green; `node ../progress.js 06` shows both at a glance.

One rule while you work: if you make an error disappear by writing `any`,
you have not finished. Every exercise carries `@ts-expect-error` lines that
MUST fail to compile — reach for `any` and they start passing, which tsc
reports as an unused `@ts-expect-error` directive. The harness cannot be
cheated.

---

**Stuck?** `cheatsheets/typescript.md` (Reading tsc errors; the strict-family flags) · **Self-check:** `quizzes/11-typescript.md` · **Next:** back to `bootcamp/15-capstones` or the Node modules 16–20 (FLIGHTPLAN-NODE-TS.md).

Different reps on the same ideas: the jstrain course's TS track (`cd jstrain && npm run test:ts`).
