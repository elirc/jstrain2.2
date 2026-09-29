// ─────────────────────────────────────────────────────────────────────────
//  07 · DeepReadonly — SOLUTION                             ★★★ stretch
//  run: node ../run.js solutions/07-deep-readonly.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is the first type that recurses through a MAPPED
//  type instead of straight down a conditional. Trace
//  DeepReadonly<{ a: { b: string } }>:
//
//    pass 1  T = { a: { b: string } }
//            not a function; it is an object → map its keys
//            K = 'a' → property type becomes DeepReadonly<{ b: string }>
//    pass 2  T = { b: string }  → object → map
//            K = 'b' → property type becomes DeepReadonly<string>
//    pass 3  T = string → not a function, not an object → return string
//
//  and the mapped types collapse outwards into
//  { readonly a: { readonly b: string } }.
//
//  Order of the three cases is the whole exercise:
//  · FUNCTIONS FIRST. `() => void` satisfies `extends object`, and mapping
//    over it keeps its properties (there are none) while dropping the call
//    signature — you'd silently turn a callback into {}. Match it first
//    and return T untouched.
//  · Then `T extends object`, which covers records, arrays and tuples.
//    The mapped type is HOMOMORPHIC (`[K in keyof T]` over a bare T), so
//    tsc preserves the shape: optional stays optional, an array becomes a
//    readonly array, a tuple becomes a readonly tuple. That is why the
//    `{ a?: ... }` and `[1, { a: 2 }]` tests pass for free.
//  · Everything else is a primitive — nothing to freeze, return T.
//
//  Note `readonly` is shallow BY DEFAULT for a reason: it is erased at
//  runtime, so the runtime test above still mutates nothing and proves
//  nothing about the object — the compiler is the only enforcement.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// ─────────────────────────── runtime tests ───────────────────────────────

const config: DeepReadonly<{ server: { port: number; tags: string[] } }> = {
  server: { port: 5432, tags: ['db'] },
};

test('a deeply frozen type is a plain object at runtime', () => {
  eq(config.server.port, 5432);
  eq(config.server.tags[0], 'db');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<DeepReadonly<{ a: { b: string } }>, { readonly a: { readonly b: string } }>
>;
type _r2 = Expect<Equal<DeepReadonly<string>, string>>;
type _r3 = Expect<Equal<DeepReadonly<number | boolean>, number | boolean>>;
// a call signature must survive: functions are objects, but not records
type _r4 = Expect<Equal<DeepReadonly<{ f: () => void }>, { readonly f: () => void }>>;
type _r5 = Expect<Equal<DeepReadonly<{ a: number[] }>, { readonly a: readonly number[] }>>;
type _r6 = Expect<Equal<DeepReadonly<{ a?: { b: 1 } }>, { readonly a?: { readonly b: 1 } }>>;
type _r7 = Expect<Equal<DeepReadonly<[1, { a: 2 }]>, readonly [1, { readonly a: 2 }]>>;
type _r8 = Expect<Equal<DeepReadonly<{}>, {}>>;

function _typeTests() {
  const cfg: DeepReadonly<{ a: { b: number } }> = { a: { b: 1 } };

  // @ts-expect-error — readonly all the way down, not just at the top
  cfg.a.b = 2;

  // @ts-expect-error — the top level is readonly too
  cfg.a = { b: 3 };

  use(cfg);
}
use(_typeTests);
