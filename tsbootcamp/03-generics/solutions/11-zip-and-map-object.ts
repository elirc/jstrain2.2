// ─────────────────────────────────────────────────────────────────────────
//  11 · zip & mapObject — SOLUTION                        ★★★ stretch
//  run: node ../run.js solutions/11-zip-and-map-object.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `zip<A, B>` is two independent parameters inferred from
//  two independent arguments, glued together in the return type as
//  `[A, B][]`. Nothing clever — just proof that inference handles each
//  parameter on its own.
//
//  `mapObject<T, R>` is the first real mapped type in this module:
//  `{ [K in keyof T]: R }` says "the same keys as T, each holding an R".
//  Compare it with the lazy alternatives: `Record<string, R>` throws away
//  which keys exist, and `{ [key: string]: R }` does the same — either
//  way `result.typo` silently compiles.
//
//  Two casts earn their keep here. `Object.keys` is `string[]` (an object
//  may carry extra keys at runtime) and the accumulator starts empty, so
//  it cannot satisfy the mapped type until the loop finishes. Both are
//  assertions the AUTHOR can prove and the compiler cannot — the
//  signature stays honest for every caller, which is the trade.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function zip<A, B>(as: readonly A[], bs: readonly B[]): [A, B][] {
  const out: [A, B][] = [];
  const length = Math.min(as.length, bs.length);
  for (let i = 0; i < length; i += 1) out.push([as[i]!, bs[i]!]);
  return out;
}

export function mapObject<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R
): { [K in keyof T]: R } {
  const out = {} as { [K in keyof T]: R };
  for (const key of Object.keys(obj) as (keyof T)[]) {
    out[key] = fn(obj[key], key);
  }
  return out;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('zips two arrays of the same length', () => {
  eq(zip([1, 2], ['a', 'b']), [[1, 'a'], [2, 'b']]);
});

test('zip stops at the shorter array', () => {
  eq(zip([1, 2, 3], ['a']), [[1, 'a']]);
});

test('zipping with an empty array gives nothing', () => {
  const empty: string[] = [];
  eq(zip([1, 2], empty), []);
});

test('mapObject keeps the keys and replaces the values', () => {
  eq(mapObject({ a: 'x', b: 'yy' }, (s: string) => s.length), { a: 1, b: 2 });
});

test('mapObject hands the key to the callback too', () => {
  const seen: string[] = [];
  mapObject({ a: 1, b: 2 }, (value: number, key: string) => {
    seen.push(key);
    return value;
  });
  eq(seen, ['a', 'b']);
});

test('mapObject on an empty object gives an empty object', () => {
  eq(mapObject({}, (v: unknown) => v), {});
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof zip<number, string>>, [number, string][]>>;
type _r2 = Expect<
  Equal<ReturnType<typeof mapObject<{ a: string; b: string }, number>>, { a: number; b: number }>
>;

function _typeTests() {
  const pairs = zip([1, 2], ['a', 'b']);
  type _z = Expect<Equal<typeof pairs, [number, string][]>>;
  use(pairs);

  const lengths = mapObject({ a: 'x', b: 'yy' }, (s) => s.length);
  type _m = Expect<Equal<typeof lengths, { a: number; b: number }>>;
  use(lengths);

  // @ts-expect-error — the result has exactly the input's keys, and c is not one
  lengths.c;

  const flags = mapObject({ a: 1, b: 2 }, (n) => n > 1);
  type _f = Expect<Equal<typeof flags, { a: boolean; b: boolean }>>;
  use(flags);

  // @ts-expect-error — the callback receives the value type, so .toUpperCase is out
  mapObject({ a: 1 }, (n) => n.toUpperCase());
}
use(_typeTests);
