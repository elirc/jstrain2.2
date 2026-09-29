# TypeScript

Syntax, narrowing, generics, the utility types, and how to read a `tsc` error — offline.

Everything here was checked with **TypeScript 5.9.3** under `tsc --noEmit --strict --target es2022`.
Quoted errors are the compiler's exact words.

## Top of mind

| Question | Answer |
| --- | --- |
| `interface` or `type`? | Object shape you might extend or merge → `interface`. Union, tuple, mapped, conditional → `type`. Otherwise it doesn't matter |
| `unknown` or `any`? | **Always `unknown`** at a trust boundary (`JSON.parse`, `fetch`, `catch`). `any` turns the checker off and the bug moves to runtime |
| Why is `x` "possibly undefined"? | `TS18048`. Narrow it, default it with `??`, optional-chain it, or fix the type. `!` only hides it |
| Why did my literal type widen? | `let` widens, `const` doesn't; object properties always widen. Fix with `as const` or `satisfies` |
| How do I make a switch fail when I add a case? | `default: const _x: never = value;` — the exhaustiveness check |
| Config object keeping its literal types? | `const routes = {...} satisfies Record<string, Route>` — validated *and* narrow |

## Syntax quick reference

### Annotations

```ts
let n: number = 1;                 // explicit
let m = 1;                         // inferred number — prefer this
const k = 1;                       // inferred 1 (literal, because const)
let s: string | undefined;         // union
let t: [string, number] = ['a', 1];       // tuple, position-checked
let u: readonly number[] = [1, 2];        // readonly array — no push/pop/sort
const c = { a: 1 } as const;              // deep-ish readonly, literal types
```

| Form | Means | Note |
| --- | --- | --- |
| `T[]` / `Array<T>` | Array of `T` | Identical; pick one and be consistent |
| `readonly T[]` | No mutating methods | `T[]` is assignable to it, **not** the reverse |
| `[A, B]` | Tuple, fixed length | Position-checked; `[a, b] = pair` destructures typed |
| `A \| B` | Union — one of | You may only touch members common to all until you narrow |
| `A & B` | Intersection — both at once | Great for "props plus extras"; conflicting primitives collapse to `never` |
| `keyof T` | Union of `T`'s keys | `keyof {a:1,b:2}` → `'a' \| 'b'` |
| `T[K]` | Indexed access | The type of property `K` on `T` |
| `typeof v` (in type position) | Lift a value into a type | `keyof typeof config` is the everyday idiom |
| `T?` on a property | Optional — may be absent | Adds `\| undefined` unless `exactOptionalPropertyTypes` |
| `x!` | Non-null assertion | An unverifiable promise; deletes the check, keeps the crash |
| `x as T` | Assertion | Emits nothing, checks nothing — you overriding the compiler |
| `x satisfies T` | Check without widening | TS 4.9+. The right tool for config objects |

### Functions

```ts
function add(a: number, b = 0): number { return a + b; }     // b is number, optional
const mul = (a: number, b: number): number => a * b;
function log(msg: string): void {}                           // returns nothing usable
function fail(msg: string): never { throw new Error(msg); }  // never returns at all
function each(xs: number[], f: (x: number, i: number) => void) {}
function opt(x?: number) {}          // callable as opt()
function req(x: number | undefined) {}   // opt() is fine, req() is TS2554
```

| Detail | Rule |
| --- | --- |
| `?` vs `\| undefined` | `x?: number` may be **omitted**; `x: number \| undefined` must be **passed**, even as `undefined` |
| `void` return | Callers may ignore it; a callback typed `=> void` may still return a value (`arr.forEach(x => x * 2)` is legal) |
| `never` return | Function throws or loops forever; narrows the code after the call |
| Default parameter | Makes the parameter optional *and* infers its type from the default |
| Rest | `function f(...xs: number[])`, or a tuple: `(...args: [string, number])` |
| Overloads | Signatures above, one compatible implementation below; the implementation signature is **not** callable |
| `this` parameter | `function f(this: HTMLElement, e: Event) {}` — a fake first parameter, erased at emit |

### Generics

```ts
function first<T>(arr: T[]): T | undefined { return arr[0]; }
function byId<T extends { id: string }>(xs: T[], id: string) { return xs.find(x => x.id === id); }
function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
interface Repo<T, K = string> { get(id: K): T | undefined }   // K defaults to string
```

Read a signature as a machine: `T[] → T | undefined` means "give me an array of anything, get one
of those back, or nothing." An unconstrained `T` means the body can do *nothing* with the value
except move it around — which is a feature, not a limitation.

| Want | Write |
| --- | --- |
| Any type at all | `<T>` |
| A type with a known shape | `<T extends { id: string }>` |
| A key of another parameter | `<K extends keyof T>` |
| A fallback when not inferable | `<T = string>` |
| Preserve the caller's exact type | Use a generic, not a wide parameter type — `(xs: {id:string}[])` throws away the other fields |

### Classes

```ts
class Counter {
  #count = 0;                       // real JS private — enforced at runtime
  private secret = 'x';             // TS-only private — erased at emit
  readonly id: string;              // assignable only in the constructor
  static make() { return new Counter('a'); }
  constructor(id: string) { this.id = id; }
  bump(): this { this.#count++; return this; }    // `this` return type → chainable
  get value() { return this.#count; }
}
```

| Feature | Error if you break it |
| --- | --- |
| `readonly id` | `TS2540: Cannot assign to 'id' because it is a read-only property.` |
| `private secret` | `TS2341: Property 'secret' is private and only accessible within class 'Counter'.` |
| `implements I` | Checks the class satisfies `I`; does **not** add members or change inference |
| `abstract` | Cannot be instantiated; `abstract` members must be implemented by subclasses |
| Parameter properties | `constructor(public x: number)` — concise, but **not runnable by type-stripping loaders** |

**Structural typing has one exception: `private`.** Two classes with identical shapes are
interchangeable — unless they declare private fields, which are compared *nominally*:
`TS2322: Type 'B' is not assignable to type 'A'. Types have separate declarations of a private property 'x'.`

## The narrowing toolbox

| Guard | Narrows | One-liner |
| --- | --- | --- |
| `typeof x === 'string'` | primitives | `if (typeof v === 'string') v.padStart(3, '0')` |
| `Array.isArray(x)` | `T \| T[]` → `T[]` | `const xs = Array.isArray(v) ? v : [v]` |
| `x instanceof Error` | classes | `catch (e) { if (e instanceof Error) e.message }` |
| `'value' in r` | object unions | `if ('value' in r) r.value` |
| `r.kind === 'circle'` | **discriminated union** | The best one — also drives exhaustiveness |
| `x === null` / `=== undefined` | nullish | `if (s === undefined) return` — precise |
| `if (x)` truthiness | nullish **and `''`/`0`** | Convenient, over-triggers: `greet('')` takes the "absent" branch |
| `x is Cat` predicate | anything you can test | `function isCat(a: Cat \| Dog): a is Cat { return a.kind === 'cat' }` |
| `asserts x is T` | anything, and *stays* narrowed | `function assertIsCat(a: unknown): asserts a is Cat` |
| `const _x: never = v` | proves nothing is left | The exhaustiveness check |

```ts
// Discriminated union + exhaustiveness — the pattern to reach for by default
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number };
function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.side ** 2;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}
```

Add a third member to `Shape` and the `default` branch fails with
`TS2322: Type '{ kind: "tri"; ... }' is not assignable to type 'never'.` — in **every** switch
that forgot it.

**Two traps.** A type predicate's body is *not verified* — `function isCat(a): a is Cat { return 'bark' in a }`
compiles and lies at every call site (TS 5.5 infers predicates for you, which can't lie — prefer that).
And narrowing is **lost across a callback or an `await` on a mutable property**: narrow into a
`const` local first.

## Utility types

| Type | What it does | Example |
| --- | --- | --- |
| `Partial<T>` | All properties optional | `Partial<User>` → `{ id?: string; name?: string }` — patch payloads |
| `Required<T>` | All properties required | `Required<{x?: number}>` needs `x` |
| `Readonly<T>` | All properties `readonly` | **Shallow**; nested objects stay mutable |
| `Pick<T, K>` | Keep only keys `K` | `Pick<User, 'id' \| 'name'>` — key-checked (`TS2344` on a typo) |
| `Omit<T, K>` | Drop keys `K` | `Omit<User, 'passwordHash'>` — **not** key-checked; a typo silently does nothing |
| `Record<K, V>` | One `V` per key in `K` | `Record<Role, string[]>` requires every role; `Record<string, V>` requires none |
| `ReturnType<F>` | What `F` returns | `ReturnType<typeof makeUser>` |
| `Parameters<F>` | Tuple of `F`'s parameters | `Parameters<typeof f>` → `[id: string, age: number]` |
| `Awaited<T>` | Unwrap a promise, recursively | `Awaited<ReturnType<typeof load>>` — the type an async fn really gives you |
| `NonNullable<T>` | Remove `null`/`undefined` | `NonNullable<string \| null>` → `string` |
| `Exclude<T, U>` | Union minus | `Exclude<'a'\|'b'\|'c', 'a'>` → `'b' \| 'c'` |
| `Extract<T, U>` | Union intersect | `Extract<string\|number\|boolean, string\|number>` → `string \| number` |
| `Uppercase` / `Lowercase` / `Capitalize` / `Uncapitalize` | String literal casing | `Capitalize<'id'>` → `'Id'` |
| `InstanceType<C>` | What `new C()` gives | `InstanceType<typeof Counter>` |
| `ConstructorParameters<C>` | Tuple for `new C(...)` | |
| `ThisParameterType<F>` / `OmitThisParameter<F>` | The `this` parameter | Rare |
| `NoInfer<T>` (5.4+) | Block inference from this position | Forces `T` to come from another argument |

**`Pick` is checked, `Omit` is not.** That asymmetry has leaked secrets in real codebases: rename
`passwordHash` and `Omit<User, 'passwordHash'>` keeps compiling while exposing it again. If it
matters, build the safe type with `Pick` instead.

## Mapped, conditional, and `infer`

A mapped type is a `for` loop over keys. A conditional type is a ternary. `infer` captures a piece
of a matched type. All eight below compile as written.

```ts
// 1 — MyPartial: the loop, plus the ? modifier
type MyPartial<T> = { [K in keyof T]?: T[K] };
// `-?` strips optionality (that's Required), `-readonly` strips readonly (that's Mutable)
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// 2 — MyPick / MyOmit: constrain the key parameter, then loop over it
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 3 — MyRecord: loop over a key union instead of over keyof T
type MyRecord<K extends keyof any, V> = { [P in K]: V };

// 4 — Getters: key remapping with `as` + a template literal type
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
// Getters<{ id: string }> → { getId: () => string }
// `string & K` filters out the number|symbol half of keyof T, which Capitalize rejects

// 5 — UnwrapPromise: the conditional + infer pattern
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ElementOf<T> = T extends (infer E)[] ? E : never;

// 6 — DeepReadonly: a mapped type that recurses
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };
// j.a.b = 2  →  TS2540: Cannot assign to 'b' because it is a read-only property.

// 7 — Rebuilding the built-ins, to see how they work
type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;
type MyParameters<F> = F extends (...args: infer P) => unknown ? P : never;
type MyNonNullable<T> = T extends null | undefined ? never : T;

// 8 — Filtering keys: map to K or never, then index by keyof T to collect the survivors
type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...a: never[]) => unknown ? K : never }[keyof T];
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
// FunctionKeys<{ id: string; save(): void }> → 'save'
```

| Rule | Consequence |
| --- | --- |
| `extends` in a conditional means **"is assignable to"** | Not inheritance — `'a' extends string` is true |
| A *naked* type parameter **distributes** over unions | `Unwrap<Promise<string> \| number>` → `string \| number`, evaluated member by member |
| Wrap to stop distribution | `[T] extends [U] ? … : …` treats the union as one thing |
| `infer` only works inside a conditional's `extends` clause | It's the "capture group" of the type system |
| Index a mapped type with `[keyof T]` | Turns `{ k: K \| never }` into the union of the surviving keys |

## `satisfies` vs annotation vs `as`

```ts
type Route = { path: string; method: 'GET' | 'POST' };

const a = { home: { path: '/', method: 'GET' } } satisfies Record<string, Route>;
const b: Record<string, Route> = { home: { path: '/', method: 'GET' } };

const x: 'GET' = a.home.method;   // ok — satisfies kept the literal
const y: 'GET' = b.home.method;   // TS2322: Type '"GET" | "POST"' is not assignable to type '"GET"'.
```

| Tool | Checks the value? | Changes the type? | Use for |
| --- | --- | --- | --- |
| `const x: T = v` | yes | **yes** — becomes `T` | Variables you'll reassign; parameters; public API |
| `v satisfies T` | yes | no — keeps the inferred type | Config objects, route tables, palettes, lookup maps |
| `v as T` | **no** | yes | Nothing, ideally. It emits no code and validates nothing |

`as` only refuses when the types don't overlap at all:
`TS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other.`
The famous workaround, `as unknown as T`, should make you nervous every time.

## tsconfig: the strict family, in plain words

`"strict": true` turns on the whole first block. The others are opt-in **on top of** strict.

| Flag | In plain words | Error you'll see |
| --- | --- | --- |
| `noImplicitAny` | A parameter with no type isn't allowed to silently become `any` | `TS7006: Parameter 'n' implicitly has an 'any' type.` |
| `strictNullChecks` | `null` and `undefined` are real types, not members of everything | `TS2322: Type 'null' is not assignable to type 'string'.` · `TS18048: 'x' is possibly 'undefined'.` |
| `strictFunctionTypes` | Function *parameters* are checked contravariantly | `TS2322` on a callback that demands more than the caller supplies. **Method-syntax members are exempt** (still bivariant) |
| `strictBindCallApply` | `bind`/`call`/`apply` are argument-checked | `TS2345` |
| `strictPropertyInitialization` | A class field must actually get a value | `TS2564: Property 'name' has no initializer and is not definitely assigned in the constructor.` |
| `noImplicitThis` | `this` in a loose function must be typed | `TS2683` |
| `useUnknownInCatchVariables` | `catch (e)` gives `unknown`, not `any` | `TS18046: 'e' is of type 'unknown'.` |
| `alwaysStrict` | Emits `"use strict"`; parses as strict mode | — |
| **`noUncheckedIndexedAccess`** | `arr[i]` and `map[k]` return `T \| undefined` — **not** part of `strict` | `TS18048: 'item' is possibly 'undefined'.` |
| `exactOptionalPropertyTypes` | `x?: number` may be *absent*, but not explicitly `undefined` | `TS2375: Type '{ retries: undefined; }' is not assignable to type 'Opts' with 'exactOptionalPropertyTypes: true'.` |
| `noImplicitReturns` | Every code path must return | `TS2366: Function lacks ending return statement and return type does not include 'undefined'.` |
| `noUnusedLocals` / `noUnusedParameters` | Dead bindings are errors | `TS6133: 'a' is declared but its value is never read.` |
| `noFallthroughCasesInSwitch` | A non-empty `case` must break or return | `TS7029` |
| `isolatedModules` | Each file must compile alone (esbuild/swc/Vite need this) | Bans `const enum`, requires `export type` for type-only re-exports |
| `verbatimModuleSyntax` | Imports are emitted as written | Forces `import type` where you mean types |

**The gap to know:** `strict` does **not** include `noUncheckedIndexedAccess`, so this compiles
clean and crashes twice:

```ts
const scores: Record<string, number> = { a: 1 };
console.log(scores.b.toFixed(2));      // TypeError at runtime
console.log([1, 2, 3][10].toFixed(2)); // TypeError at runtime
```

`arr.at(i)` and `map.get(k)` already return `| undefined` and are honest without the flag.

## Reading tsc errors

Read from the **bottom up**: the outer line names the two types that didn't match, the innermost
indented line is the actual complaint.

| Code | Shape | Usual cause | Fix |
| --- | --- | --- | --- |
| **2322** | `Type 'X' is not assignable to type 'Y'.` | An **assignment** — variable, property, or return | Change the value, widen the target, or narrow first |
| **2339** | `Property 'p' does not exist on type 'T'.` | Touching a union member that isn't on every branch; or a genuinely missing field | Narrow with a discriminant/`typeof`/`in`, or fix the type |
| **2345** | `Argument of type 'X' is not assignable to parameter of type 'Y'.` | An **argument** at a call site | Fix the argument, or the parameter type if the call is right |
| **2551** | `Property 'p' does not exist on type 'T'. Did you mean 'q'?` | A **typo or casing slip** — 2339 with a suggestion | Take the suggestion |
| **2739** | `Type '{...}' is missing the following properties from type 'T': y, z` | Object literal missing **several** required properties | Add them, or make them optional. Singular form is **2741** |
| **18048** | `'x' is possibly 'undefined'.` | `strictNullChecks` doing its job | Narrow, `??`, `?.` — or fix the type. `!` only hides it |
| **2344** | `Type 'false' does not satisfy the constraint 'true'.` | A failed `Expect<Equal<…>>` type test — your type doesn't match the target **exactly** | Compare character by character: `readonly`, `?`, and literal-vs-widened all count |
| **2578** | `Unused '@ts-expect-error' directive.` | Your types are too loose — the illegal call underneath now compiles | Tighten the type until that line errors again. Never delete the directive |

Other codes worth recognizing:

| Code | Means |
| --- | --- |
| 2353 | Excess property on a **fresh object literal** — usually a typo |
| 2344 | A **type argument** broke a generic's constraint (`Pick<User, 'nickname'>`) — see above for its `Expect<Equal<…>>` form |
| 2540 | Assigning to a `readonly` property |
| 2554 | `Expected 1-2 arguments, but got 3.` — arity |
| 18046 | `'x' is of type 'unknown'.` — narrow it before use |
| 2820 | Literal union typo **with a suggestion** (`'onclick'` → `'onClick'`) |
| 2300 | Duplicate identifier — two `type` aliases with one name |
| 2312 | An interface tried to extend a union |
| 2352 | An `as` between types that don't overlap |
| 7006 | Implicit `any` parameter |
| 2564 | Class property with no initializer |

**Excess property checks only see fresh literals.** `full({ first, last, middle })` is `TS2353`;
assign the same object to a variable first and it compiles, because structural typing allows extra
properties. That's by design — and it's why the check misses so many real typos.

## Decision box — `interface` vs `type`

| | `interface` | `type` |
| --- | --- | --- |
| Object shapes | ✅ | ✅ |
| Unions, tuples, mapped, conditional, primitives | ❌ | ✅ **only option** |
| Declaration merging (reopen and add members) | ✅ **only option** | ❌ `TS2300: Duplicate identifier` |
| Extending | `extends` (object types only — `TS2312` on a union) | `&` intersection |
| Error messages | Shows the interface name | May expand to the full structure |
| Implemented by a class | ✅ | ✅ (if it's an object type) |

**Use `interface`** for object shapes, especially public API surfaces and anything a consumer might
augment (`declare module`). **Use `type`** the moment you need a union, a tuple, a function type
alias, or any type-level computation. Don't relitigate it in code review.

## Decision box — `enum` vs `const` object

```ts
enum Status { Active, Archived }          // emits a real runtime object
console.log(Status.Active, Status[0]);    // 0 'Active'  (numeric enums reverse-map)

const STATUS = { Active: 'active', Archived: 'archived' } as const;
type StatusV = (typeof STATUS)[keyof typeof STATUS];   // 'active' | 'archived'
```

| | `enum` | `as const` object |
| --- | --- | --- |
| Emits runtime code | **yes** — a real object | Yes, but it's just your own object |
| Works with type-stripping loaders | **No** | Yes |
| Value in a log/JSON payload | `0` for a numeric enum | `'active'` — readable |
| Accepts a stray value | `const n: Status = 5` → `TS2322` (since TS 5.0) | `'deleted'` → `TS2322` |
| Needs an import to construct one | Yes | No — a plain string works |
| Iterate the members | `Object.values(Status)` includes reverse-map keys | `Object.values(STATUS)` is exactly the values |

Node refuses to run an `enum` under `--experimental-strip-types`:
`SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode`
— the same is true of `namespace` and parameter properties, and the same is true of esbuild/Vite in
their default "strip types only" mode.

**Default to the `as const` object.** Reach for `enum` only in a codebase that already uses them
everywhere, and avoid `const enum` entirely under `isolatedModules`.

## Working habits

| Habit | Why |
| --- | --- |
| Type the **boundaries**, infer the middle | Annotate function parameters, return types of exported functions, and API payloads. Let locals infer |
| `unknown` at every edge | `JSON.parse`, `fetch().json()`, `catch (e)`, `process.env` all lie by default |
| Validate, don't assert | A type predicate or a schema library gives a runtime check the compiler can trust; `as` gives neither |
| Derive, don't duplicate | `typeof config`, `ReturnType<>`, `Pick<>` keep types in sync with the code that moves |
| One `never` per switch | The cheapest refactoring insurance in the language |
| Run `tsc --noEmit` in CI | Editors and bundlers only check the files they've opened; `tsc` checks all of them |

---
*See also: [es2020-plus.md](es2020-plus.md) · [patterns-swe.md](patterns-swe.md) · [js-gotchas.md](js-gotchas.md) · [node-advanced.md](node-advanced.md)*
