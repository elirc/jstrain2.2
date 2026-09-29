// ─────────────────────────────────────────────────────────────────────────
//  07 · DeepReadonly                                        ★★★ stretch
//  concepts: recursive mapped types · guarding on functions & primitives
//  run: node ../run.js exercises/07-deep-readonly.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `Readonly<T>` freezes one level. Freeze all of them: map every
//  property, and recurse into the ones that are objects.
//
//      DeepReadonly<{ a: { b: string } }>
//        → { readonly a: { readonly b: string } }
//      DeepReadonly<{ a: number[] }>   → { readonly a: readonly number[] }
//      DeepReadonly<string>            → string        (nothing to map)
//      DeepReadonly<{ f: () => void }> → { readonly f: () => void }
//
//  That last line is the trap: a function IS an object, and mapping over
//  one keeps its (zero) properties and throws the call signature away.
//
//  hint: three cases in order — function first, then object, then leave

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type DeepReadonly<T> = TODO;

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
