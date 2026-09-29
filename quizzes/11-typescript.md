# 11 · TypeScript — inference, narrowing, generics, utility types, reading tsc errors

Cover the answer, commit out loud, then reveal. Every "does this compile" claim below was
checked by running `tsc --noEmit --strict --target es2022` (TypeScript 5.9.3) on the exact
snippet — the quoted errors are the compiler's real words, not a paraphrase.

---

### Q1 — what does it infer?

What type does the compiler give each of `a`, `b`, `c`, `d` — and which of the last four lines fails?

```ts
const a = 5;
let b = 5;
const c = [1, 2];
const d = { n: 1 };

const y1: 5 = a;
const y2: 5 = b;
const y3: number[] = c;
const y4: { n: 5 } = d;
```

<details><summary>Answer</summary>

**`a: 5`, `b: number`, `c: number[]`, `d: { n: number }` — `y2` and `y4` fail.**

```
error TS2322: Type 'number' is not assignable to type '5'.
error TS2322: Type '{ n: number; }' is not assignable to type '{ n: 5; }'.
  Types of property 'n' are incompatible.
    Type 'number' is not assignable to type '5'.
```

This is **literal widening**. A `const` binding can never be reassigned, so TypeScript keeps the narrow literal type `5`. A `let` can be reassigned, so it widens to `number` immediately. Object *properties* are mutable even inside a `const` object, so they widen too — which is why `d.n` is `number`, not `1`. When you want the narrow version, `as const` freezes it: `const d = { n: 1 } as const` makes `d.n` the literal `1` and the property `readonly`.
</details>

---

### Q2 — array literals and unions

What is the inferred type of `arr`, and why does the last line fail?

```ts
const arr = [1, 'a'];
const x: (string | number)[] = arr;
const bad: number[] = arr;
```

<details><summary>Answer</summary>

**`arr` is `(string | number)[]`, so the `number[]` line fails.**

```
error TS2322: Type '(string | number)[]' is not assignable to type 'number[]'.
  Type 'string | number' is not assignable to type 'number'.
    Type 'string' is not assignable to type 'number'.
```

TypeScript infers an array literal's element type as the **union of the best common types** of its members, then wraps it in `Array<>`. Note how the error is a stack: the outer line names the whole-array mismatch, and the indented lines drill down to the actual culprit. **Always read tsc errors from the bottom up** — the last indented line is the real complaint; the lines above it are just the path the checker took to get there.
</details>

---

### Q3 — interface versus type alias

Which of these two blocks compiles, and what is the error on the other?

```ts
interface Box { a: number }
interface Box { b: string }
const ok: Box = { a: 1, b: 'x' };

type Bag = { a: number };
type Bag = { b: string };
```

<details><summary>Answer</summary>

**The `interface` block compiles — the two declarations merge into `{ a: number; b: string }`. The `type` block does not.**

```
error TS2300: Duplicate identifier 'Bag'.   (reported on both lines)
```

**Declaration merging** is the one real capability an `interface` has that a `type` alias does not: two interfaces with the same name in the same scope combine. That is how `@types` packages let you bolt fields onto `Window` or Express's `Request`. A `type` alias is a single, final definition of a name. Conversely, only a `type` alias can name a union, a tuple, a mapped type, or a conditional type — an interface can only describe an object shape. Rule of thumb: **interfaces for object shapes you might extend or merge, type aliases for everything else**, and don't spend meeting time on it.
</details>

---

### Q4 — unknown versus any

Which line fails, and what is the exact complaint?

```ts
function f(x: unknown, y: any) {
  y.toUpperCase();
  x.toUpperCase();
}
```

<details><summary>Answer</summary>

**Only the `x` line fails.**

```
error TS18046: 'x' is of type 'unknown'.
```

`any` means "stop checking" — every property access, call, and assignment on it is allowed, and the error surfaces at runtime instead. `unknown` is the *safe* top type: everything is assignable **to** it, but you can do nothing **with** it until you prove what it is. That proof is narrowing: `if (typeof x === 'string') x.toUpperCase()` compiles fine. Use `unknown` for anything crossing the trust boundary — `JSON.parse`, `catch (e)`, `fetch().json()` — and reserve `any` for genuine escape hatches you plan to delete.
</details>

---

### Q5 — how `any` spreads

Three of these four lines compile. Which one doesn't, and why is that a problem?

```ts
const data: any = JSON.parse('{"n":1}');
const s: string = data.n;
const t: number = data.whatever.deeply.nested;
data();

const u: unknown = JSON.parse('{"n":1}');
const s2: string = u;
```

<details><summary>Answer</summary>

**Everything involving `data` compiles. Only `const s2: string = u` fails.**

```
error TS2322: Type 'unknown' is not assignable to type 'string'.
```

`any` is contagious: `data.n` is `any`, so it slides into a `string` slot without a murmur; `data.whatever.deeply.nested` is `any` all the way down; and calling `data()` is allowed because `any` might be a function. Every one of those is a runtime crash the compiler agreed to ignore, and the `any` keeps flowing into whatever you assign it to. `JSON.parse` returns `any` by design — the single highest-value habit in a TS codebase is to catch it immediately: `const u: unknown = JSON.parse(s)`, then validate.
</details>

---

### Q6 — narrowing with `typeof`

The first function compiles; the second does not. What is the error?

```ts
function pad(v: string | number) {
  if (typeof v === 'string') return v.padStart(3, '0');
  return v.toFixed(2);
}

function bad(v: string | number) {
  return v.padStart(3, '0');
}
```

<details><summary>Answer</summary>

```
error TS2339: Property 'padStart' does not exist on type 'string | number'.
  Property 'padStart' does not exist on type 'number'.
```

On a union you may only touch members that exist on **every** branch. `typeof v === 'string'` is a **type guard**: inside the `if`, `v` is `string`; after the `if` returns, control-flow analysis knows the only branch left is `number`, so `v.toFixed` is fine with no `else` needed. That last part is the trick worth internalizing — an early `return` narrows the rest of the function body for free, which is why guard clauses read so well in TypeScript.
</details>

---

### Q7 — the possibly-undefined error

Two functions, one error. Which line, and what is the code?

```ts
function len(s: string | undefined) {
  return s.length;
}

interface User { name: string; address?: { city: string } }
function city(u: User) {
  return u.address.city;
}
```

<details><summary>Answer</summary>

**Both fail, with the same error code — `TS18048`.**

```
error TS18048: 's' is possibly 'undefined'.
error TS18048: 'u.address' is possibly 'undefined'.
```

`18048` is the single most common error in a freshly-strict codebase, and it is always the same shape: *you are reaching through something that might not be there*. There are exactly four honest fixes — narrow it (`if (!s) return 0`), default it (`s ?? ''`), optional-chain it (`u.address?.city`), or change the type so it can't be absent. There is also one dishonest fix, `u.address!.city`, which deletes the check and keeps the crash. The `!` is a promise to the compiler that you cannot be held to.
</details>

---

### Q8 — the truthiness trap

This compiles clean under `--strict`. What does it print, and what's the bug?

```ts
function greet(name: string | undefined) {
  if (name) return `Hello, ${name}`;
  return 'Hello, stranger';
}
console.log(greet(''));
console.log(greet('Ada'));

function count(n: number | undefined) {
  if (!n) return 'none';
  return `${n} items`;
}
console.log(count(0));
```

<details><summary>Answer</summary>

**`Hello, stranger`, `Hello, Ada`, `none`** — and the first and third are bugs the type checker cannot see.

Truthiness narrowing removes `undefined` from the union, which is what you asked for, but it also removes `''` and `0`, which you did not. A user named `''` and a cart holding `0` items both take the "absent" branch. The types are perfectly satisfied — `string | undefined` narrowed to `string` — because the flaw is in *which* values you lumped together, not in the types. When absence is what you actually mean, test for it: `if (name === undefined)`, or `name ?? 'stranger'`. `??` and `?.` exist precisely because `||` and truthiness over-trigger on the valid falsy values.
</details>

---

### Q9 — exhaustiveness with `never`

The first version compiles. Someone adds a third shape and only touches the type. What error appears, and where?

```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'tri'; b: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.side ** 2;
    default: {
      const _exhaustive: never = s;
      return 0;
    }
  }
}
```

<details><summary>Answer</summary>

**On the `_exhaustive` line, in the `default` branch:**

```
error TS2322: Type '{ kind: "tri"; b: number; h: number; }' is not assignable to type 'never'.
```

This is the **exhaustiveness check**, and it's the highest-leverage three lines in a TypeScript codebase. `never` is the empty type — nothing is assignable to it. When every case is handled, control flow proves `s` is `never` in the `default`, and the assignment is legal. The moment a variant is added, `s` is that leftover variant instead, and the assignment fails **at compile time in every switch that forgot to handle it**. Adding a case to a discriminated union stops being an archaeology exercise and becomes a to-do list the compiler hands you.
</details>

---

### Q10 — reaching into a union

Why does `unwrap` compile while `bad` does not?

```ts
type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.value;
  throw new Error(r.error);
}

function bad<T>(r: Result<T>): T {
  return r.value;
}
```

<details><summary>Answer</summary>

```
error TS2339: Property 'value' does not exist on type 'Result<T>'.
  Property 'value' does not exist on type 'Err'.
```

`ok` is a **discriminant**: a property whose type is a different literal in each member of the union. Testing it (`if (r.ok)`) narrows the whole object, so `r.value` is available in the `true` branch and `r.error` in the `false` one. Without the test you only get the intersection of what all members have, which is just `ok`. The same narrowing works with `in` (`if ('value' in r)`) and with `instanceof` for classes, but a literal discriminant is the most readable and the only one that also drives exhaustiveness checks.
</details>

---

### Q11 — type predicates

Both of these compile under `--strict`. Which one is a lie, and why does the compiler let it through?

```ts
type Cat = { kind: 'cat'; meow(): void };
type Dog = { kind: 'dog'; bark(): void };

function isCat(a: Cat | Dog): a is Cat {
  return a.kind === 'cat';
}

function isCatBad(a: Cat | Dog): a is Cat {
  return 'bark' in a;
}
```

<details><summary>Answer</summary>

**`isCatBad` is exactly backwards, and the compiler accepts it without a word.**

A `x is T` return type is a **user-defined type guard**. At call sites it is enormously useful: `if (isCat(a)) a.meow()` narrows the union the same way `typeof` would. But TypeScript only checks that the function returns a `boolean` — it does **not** verify that the body actually tests for `T`. A wrong predicate is an unchecked assertion that quietly poisons every call site, so keep predicate bodies to one obvious line and test them. TypeScript 5.5 added *inferred* predicates: writing `const isCat = (a: Cat | Dog) => a.kind === 'cat'` (no annotation) now infers `a is Cat` for you — safer, because inference can't lie.
</details>

---

### Q12 — reading a generic signature

Given this signature, what are `a`, `b`, and `c`, and which of the last two lines fails?

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const a = first([1, 2, 3]);
const b = first(['x']);
const c = first([]);
const d: number = first([1, 2]);
```

<details><summary>Answer</summary>

**`a: number | undefined`, `b: string | undefined`, `c: undefined` — and the `d` line fails.**

```
error TS2322: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
```

Read a generic signature as a *machine*: `T` is a hole filled in at each call from the argument. `T[] → T | undefined` says "hand me an array of anything, get back one of those, or nothing." Because `T` is unconstrained, the function body can only do things that work for **every** possible `T` — indexing and passing it along, nothing else. `first([])` has nothing to infer from, so `T` falls back to `never` and the return type collapses to `undefined`. And the `d` error is the function keeping its promise: an array can be empty, so you must handle `undefined`.
</details>

---

### Q13 — a constraint violation

What is the error, and which line does it point at?

```ts
function byId<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(i => i.id === id);
}
const rows = [{ key: 1 }];
const bad = byId(rows, 'a');
```

<details><summary>Answer</summary>

```
error TS2345: Argument of type '{ key: number; }[]' is not assignable to parameter of type '{ id: string; }[]'.
  Property 'id' is missing in type '{ key: number; }' but required in type '{ id: string; }'.
```

`T extends { id: string }` is a **constraint**: it lets the body use `i.id` while still returning the caller's exact type, so `byId([{ id: 'a', name: 'Ada' }], 'a')` gives back `{ id: string; name: string } | undefined` — `name` and all. That's the whole point of the generic; a plain `(items: { id: string }[])` parameter would compile too but would throw away every other field on the way out. **TS2345 always means "argument doesn't fit parameter"** and is one of the three error codes you'll see most.
</details>

---

### Q14 — `keyof` and indexed access

Which two lines fail?

```ts
interface User { id: string; name: string; age: number }
type K = keyof User;
const k1: K = 'name';
const k2: K = 'email';

function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
const u: User = { id: 'a', name: 'Ada', age: 36 };
const n: string = get(u, 'name');
const wrong: string = get(u, 'age');
```

<details><summary>Answer</summary>

```
error TS2322: Type '"email"' is not assignable to type 'keyof User'.
error TS2322: Type 'number' is not assignable to type 'string'.
```

`keyof User` is the union `'id' | 'name' | 'age'` — a *type* built out of the keys, so a typo in a key name becomes a compile error. `T[K]` is an **indexed access type**: "the type of the property `K` on `T`". Together they make the classic type-safe getter: `get(u, 'name')` is `string`, `get(u, 'age')` is `number`, and `get(u, 'email')` doesn't compile. This pair — `keyof` plus `T[K]` — is the foundation everything else in this file is built from; mapped types are little more than a loop over `keyof T` looking up `T[K]`.
</details>

---

### Q15 — `typeof` in type position

`typeof` here is not the runtime operator. What do `Config` and `Key` mean, and which two lines fail?

```ts
const config = { host: 'localhost', port: 5432, tls: false };
type Config = typeof config;
type Key = keyof typeof config;

const k: Key = 'port';
const bad: Key = 'user';
const c: Config = { host: 'h', port: 1, tls: true };
const c2: Config = { host: 'h', port: '1', tls: true };
```

<details><summary>Answer</summary>

**`Config` is `{ host: string; port: number; tls: boolean }`; `Key` is `'host' | 'port' | 'tls'`.**

```
error TS2322: Type '"user"' is not assignable to type '"port" | "host" | "tls"'.
error TS2322: Type 'string' is not assignable to type 'number'.
```

In a *type* position, `typeof someValue` lifts a runtime value into the type world. That means you can write the object once — the actual config, the actual route table, the actual defaults — and derive the types from it, instead of hand-maintaining a parallel interface that drifts. `keyof typeof x` is the everyday idiom for "the valid keys of this object", and it's how you type a lookup helper over a plain object literal. Read it inside-out: `typeof config` first, then `keyof` that.
</details>

---

### Q16 — Partial, Required, Readonly

Which two lines fail?

```ts
interface User { id: string; name: string; age?: number }
const p: Partial<User> = {};
const r: Required<User> = { id: 'a', name: 'b' };
const ro: Readonly<User> = { id: 'a', name: 'b' };
ro.name = 'c';
```

<details><summary>Answer</summary>

```
error TS2741: Property 'age' is missing in type '{ id: string; name: string; }' but required in type 'Required<User>'.
error TS2540: Cannot assign to 'name' because it is a read-only property.
```

`Partial<T>` makes every property optional (`{ [K in keyof T]?: T[K] }`) — perfect for a patch/update payload. `Required<T>` does the reverse with the `-?` modifier, which strips optionality, so `age` becomes mandatory. `Readonly<T>` adds `readonly` to each property; note that it is **shallow** — `Readonly<{ a: { b: number } }>` still lets you write `x.a.b = 2`, and `readonly` is erased at runtime, so nothing stops JavaScript callers. All three are one-line mapped types you could write yourself in about 20 characters.
</details>

---

### Q17 — Pick and Omit

Which two lines fail, and note that the error codes differ.

```ts
interface User { id: string; name: string; email: string; passwordHash: string }
type PublicUser = Pick<User, 'id' | 'name'>;
type Safe = Omit<User, 'passwordHash'>;

const a: PublicUser = { id: '1', name: 'Ada' };
const b: PublicUser = { id: '1', name: 'Ada', email: 'x' };
type Nope = Pick<User, 'nickname'>;
```

<details><summary>Answer</summary>

```
error TS2353: Object literal may only specify known properties, and 'email' does not exist in type 'PublicUser'.
error TS2344: Type '"nickname"' does not satisfy the constraint 'keyof User'.
```

`Pick<T, K>` keeps the named keys, `Omit<T, K>` drops them; both stay in sync automatically when `User` gains a field, which is the entire reason to use them instead of retyping the shape. The asymmetry worth knowing: **`Pick` is key-checked, `Omit` is not.** `Pick<User, 'nickname'>` is TS2344 because `K extends keyof T`, but `Omit<User, 'nickname'>` compiles silently and does nothing — so a renamed field can leave an `Omit`-based "safe" type quietly exposing the secret again. TS2344 always means "a type argument broke a generic's constraint."
</details>

---

### Q18 — Record

What does `Perms` require, and what is the error?

```ts
type Role = 'admin' | 'editor' | 'viewer';
type Perms = Record<Role, string[]>;
const p: Perms = { admin: ['*'], editor: ['write'], viewer: ['read'] };
const q: Perms = { admin: ['*'], editor: ['write'] };
```

<details><summary>Answer</summary>

```
error TS2741: Property 'viewer' is missing in type '{ admin: string[]; editor: string[]; }' but required in type 'Perms'.
```

`Record<K, V>` builds an object type with one key per member of `K`, each holding a `V`. Over a **finite union of literals** it is effectively an exhaustiveness check for objects: add `'auditor'` to `Role` and every `Record<Role, …>` in the codebase lights up until you fill it in. Over `string` it means something completely different — `Record<string, number>` is an open-ended index signature with *no* required keys, and reading a missing key gives you `number`, not `number | undefined`, unless `noUncheckedIndexedAccess` is on (see Q26). Same helper, two very different guarantees.
</details>

---

### Q19 — ReturnType, Parameters, Awaited

Which two lines fail?

```ts
function makeUser(id: string, age: number) {
  return { id, age, createdAt: new Date() };
}
type U = ReturnType<typeof makeUser>;
type P = Parameters<typeof makeUser>;

const p2: P = [1, 'a'];

async function load() { return { ok: true }; }
type L = Awaited<ReturnType<typeof load>>;
const l2: L = Promise.resolve({ ok: true });
```

<details><summary>Answer</summary>

```
error TS2322: Type 'number' is not assignable to type 'string'.
error TS2322: Type 'string' is not assignable to type 'number'.
error TS2741: Property 'ok' is missing in type 'Promise<{ ok: boolean; }>' but required in type '{ ok: boolean; }'.
```

`U` is `{ id: string; age: number; createdAt: Date }` and `P` is the **tuple** `[id: string, age: number]` — so `p2` gets two errors, one per slot, because tuples are position-checked. `Awaited<T>` unwraps a promise, and it unwraps *recursively*, so `Awaited<Promise<Promise<string>>>` is `string`. Note `typeof makeUser` again: these helpers operate on the function's **type**, so you must lift the value first. The pattern to remember is `Awaited<ReturnType<typeof someAsyncFn>>` — the type of what an async function actually gives you — which saves you hand-writing the shape of every API response your own code produces.
</details>

---

### Q20 — reading a mapped type

What is `G`, and what is the error on the last line?

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
interface User { id: string; age: number }
type G = Getters<User>;
const g2: G = { getId: () => 'a' };
```

<details><summary>Answer</summary>

**`G` is `{ getId: () => string; getAge: () => number }`.**

```
error TS2741: Property 'getAge' is missing in type '{ getId: () => string; }' but required in type 'Getters<User>'.
```

Read a mapped type as a `for` loop over keys. `[K in keyof T]` is the loop; `as ...` is **key remapping** (TS 4.1+), which lets you rename — or, by mapping to `never`, delete — keys as you go; the part after `:` is the new value type. The template literal `` `get${Capitalize<string & K>}` `` builds the new name at the type level, and the `string & K` is boilerplate that filters out the `number | symbol` half of `keyof T`, which `Capitalize` can't accept. `Capitalize`, `Uppercase`, `Lowercase`, and `Uncapitalize` are built in.
</details>

---

### Q21 — conditional types and `infer`

What are `A`, `B`, and `C` — and which line fails?

```ts
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type A = Unwrap<Promise<string>>;
type B = Unwrap<number>;
const a2: A = 1;

type ElementOf<T> = T extends (infer E)[] ? E : never;
type C = ElementOf<boolean[]>;
```

<details><summary>Answer</summary>

**`A` is `string`, `B` is `number`, `C` is `boolean`.**

```
error TS2322: Type 'number' is not assignable to type 'string'.
```

A conditional type is a type-level ternary: `T extends X ? Then : Else`, where `extends` means "is assignable to". `infer U` declares a **type variable captured from the match** — "if `T` looks like `Promise<something>`, call that something `U` and hand it back." That is the whole mechanism behind `ReturnType` (`F extends (...a: never[]) => infer R ? R : never`) and `Parameters` (`infer P` in the argument position). One extra rule to know: when the checked type is a *naked* type parameter and you pass a union, the conditional **distributes** over each member — `Unwrap<Promise<string> | number>` is `string | number`, evaluated one member at a time.
</details>

---

### Q22 — `satisfies` versus an annotation

Both objects have the same shape. Why does the last line fail while the identical check above it passes?

```ts
type Route = { path: string; method: 'GET' | 'POST' };

const routes = {
  home: { path: '/', method: 'GET' },
} satisfies Record<string, Route>;
const check: 'GET' = routes.home.method;

const routes2: Record<string, Route> = {
  home: { path: '/', method: 'GET' },
};
const m2: 'GET' = routes2.home.method;
```

<details><summary>Answer</summary>

**Only the last line fails.**

```
error TS2322: Type '"GET" | "POST"' is not assignable to type '"GET"'.
  Type '"POST"' is not assignable to type '"GET"'.
```

An **annotation** checks the value *and replaces its type* with the annotation — `routes2.home.method` is now the whole `'GET' | 'POST'` union, and `routes2` accepts any string key, so `routes2.typo` type-checks too. **`satisfies`** (TS 4.9) checks the value against the type and then **keeps the narrow inferred type**: `routes.home.method` stays the literal `'GET'`, and `routes` has exactly the key `home`. Use `satisfies` for config objects, route tables, and palette maps — you get the validation of an annotation without losing the literal detail. The rule: annotation for a variable you'll reassign, `satisfies` for a constant you'll read.
</details>

---

### Q23 — excess property checks are only skin deep

The first call fails and the second succeeds, with the same object. Why?

```ts
type Name = { first: string; last: string };
function full(n: Name) { return n.first + ' ' + n.last; }

full({ first: 'a', last: 'b', middle: 'c' });

const extra = { first: 'a', last: 'b', middle: 'c' };
full(extra);
```

<details><summary>Answer</summary>

```
error TS2353: Object literal may only specify known properties, and 'middle' does not exist in type 'Name'.
```

TypeScript is **structurally typed**: a value is assignable if it has at least the required members, so `extra` is a perfectly good `Name` and the second call is correct by design. The first call trips the **excess property check**, a special rule that only applies to *fresh object literals* assigned or passed directly. It exists to catch typos (`{ frist: 'a' }`) that structural typing would otherwise wave through as "just an extra property." Assigning to a variable first "widens" the literal and drops the freshness — which is the standard workaround, and also the reason the check misses so many real typos.
</details>

---

### Q24 — what an assertion actually does

This compiles clean under `--strict`. What happens when you run it?

```ts
const raw: unknown = JSON.parse('{"id":1}');
const user = raw as { id: string };
console.log(user.id.toUpperCase());
```

<details><summary>Answer</summary>

**It compiles, then crashes: `TypeError: user.id.toUpperCase is not a function`.**

`as` is not a conversion and not a check — it is you overriding the compiler. Nothing is emitted, nothing is validated; the type system simply believes you, and `id` is the number `1` at runtime. This is the number-one source of "but TypeScript said it was fine" incidents, and it lives exactly where you'd expect: at the edges, on `JSON.parse`, `fetch` responses, and database rows. The fix is a **runtime** check whose result the compiler can trust — a hand-written type predicate, or a schema validator like Zod. Note `as` isn't unlimited: `'hello' as number` gives `TS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other`, and the well-known workaround is the double assertion `as unknown as number`, which should make you nervous every time you type it.
</details>

---

### Q25 — readonly arrays and `as const`

Three errors here. What are they?

```ts
const nums: readonly number[] = [1, 2, 3];
nums.push(4);

const tup = [1, 'a'] as const;
tup[0] = 2;

function sum(xs: number[]) { return xs.reduce((a, b) => a + b, 0); }
sum(nums);
```

<details><summary>Answer</summary>

```
error TS2339: Property 'push' does not exist on type 'readonly number[]'.
error TS2540: Cannot assign to '0' because it is a read-only property.
error TS2345: Argument of type 'readonly number[]' is not assignable to parameter of type 'number[]'.
  The type 'readonly number[]' is 'readonly' and cannot be assigned to the mutable type 'number[]'.
```

`readonly T[]` (aka `ReadonlyArray<T>`) simply lacks the mutating methods — `push`, `pop`, `splice`, `sort`, `reverse` — while `map`, `filter`, and `slice` are all still there and return normal mutable arrays. `as const` on an array literal gives you a **readonly tuple**: `readonly [1, 'a']`, fixed length, literal element types. The third error is the one that bites in real code: assignability goes one way only, `number[]` → `readonly number[]`. That's correct — handing a mutable alias to a function that might `sort` it would defeat the point — so type your parameters `readonly T[]` whenever you don't mutate, and callers can pass either kind.
</details>

---

### Q26 — the index-signature lie

This compiles clean under `--strict` and crashes twice at runtime. Why, and which flag catches it?

```ts
const scores: Record<string, number> = { a: 1 };
const s = scores.b;
console.log(s.toFixed(2));

const arr = [1, 2, 3];
const item = arr[10];
console.log(item.toFixed(2));
```

<details><summary>Answer</summary>

**Because `--strict` does not include `noUncheckedIndexedAccess`.** Turn it on and both lines are caught:

```
error TS18048: 's' is possibly 'undefined'.
error TS18048: 'item' is possibly 'undefined'.
```

By default, indexing an array or an index signature returns `T`, not `T | undefined` — TypeScript trades soundness for ergonomics here, because otherwise every `arr[i]` inside a `for` loop would need a guard. The result is that the two most common ways to read data you don't control both lie to you. `noUncheckedIndexedAccess` fixes it (it is deliberately *not* part of `strict`), at the cost of some noise in loops; `arr.at(i)` and `map.get(k)` already return `| undefined` and are honest without it. Know this one — it's the gap people mean when they say "TypeScript isn't sound."
</details>

---

### Q27 — enum versus const object

What do these two lines print, and what fails? Then: why can't Node run this file with `--experimental-strip-types`?

```ts
enum Status { Active, Archived }
console.log(Status.Active, Status[0]);
const n: Status = 5;

const STATUS = { Active: 'active', Archived: 'archived' } as const;
type StatusV = (typeof STATUS)[keyof typeof STATUS];
const bad: StatusV = 'deleted';
```

<details><summary>Answer</summary>

**Prints `0 Active`** — numeric enums get a reverse mapping, so `Status[0]` gives back the name.

```
error TS2322: Type '5' is not assignable to type 'Status'.
error TS2322: Type '"deleted"' is not assignable to type 'StatusV'.
```

And the runtime answer: `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode`. An `enum` is one of the few TS features that **emits JavaScript** — a real object, built at runtime — so type-stripping loaders (Node's built-in, esbuild's default, Vite, Babel) can't handle it. Parameter properties (`constructor(public x: number)`) and `namespace` are the other two. The `as const` object plus `(typeof X)[keyof typeof X]` gives you the same closed set of values with zero emitted magic, real string values in your logs and payloads, and no import needed to construct one. Reach for `const` objects by default; `const enum` in particular is a trap under isolated-module builds.
</details>

---

### Q28 — error-code triage

Name the error code and the fix for each. No compiler — just read them.

```ts
interface Config { timeout: number; retries: number }
const c: Config = { timeout: 1000, retries: 3 };
console.log(c.timeOut);              // A

interface Point { x: number; y: number; z: number }
const p: Point = { x: 1 };           // B

function greet(name: string) { return `hi ${name}`; }
greet(42);                           // C
```

<details><summary>Answer</summary>

```
A  error TS2551: Property 'timeOut' does not exist on type 'Config'. Did you mean 'timeout'?
B  error TS2739: Type '{ x: number; }' is missing the following properties from type 'Point': y, z
C  error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
```

Learn the shapes and you stop reading these word by word. **2551** is 2339's helpful cousin — "no such property, *did you mean*" — and is almost always a literal typo or a casing slip. **2739** is "your object literal is missing required properties", and it names all of them on one line; its singular sibling **2741** ("Property 'x' is missing … but required in type") shows up when exactly one is absent. **2345** is always the argument/parameter boundary; **2322** (the most common of all) is always an assignment. Two habits: read the *innermost* indented line first, and when the error mentions a type you don't recognize, hover it — the name in the message is usually an alias hiding the real shape.
</details>
