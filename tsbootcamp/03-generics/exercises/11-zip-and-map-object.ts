// ─────────────────────────────────────────────────────────────────────────
//  11 · zip & mapObject                                   ★★★ stretch
//  concepts: multiple type parameters · mapped types in a signature
//  run: node ../run.js exercises/11-zip-and-map-object.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `zip` walks two arrays in step and stops at the shorter one:
//
//      zip([1, 2], ['a', 'b'])   → [[1,'a'], [2,'b']]   [number, string][]
//      zip([1, 2, 3], ['a'])     → [[1,'a']]
//
//  `mapObject` is `Array#map` for objects — same keys, new values. The
//  return type is where it gets interesting: `{ [K in keyof T]: R }`
//  keeps every key of T and replaces only the value type.
//
//      mapObject({ a: 'x', b: 'yy' }, s => s.length)
//        → { a: 1, b: 2 }        typed { a: number; b: number }
//
//  That is a mapped type, doing one job: making the signature honest. You
//  will build them from scratch in module 04.
//
//  hint: the implementation cannot prove the object it fills matches the
//  mapped type — start from `{} as { [K in keyof T]: R }` and cast
//  `Object.keys` once, like you did in 06

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function zip(as: TODO, bs: TODO): TODO {
  throw new Error('TODO');
}

export function mapObject(obj: TODO, fn: TODO): TODO {
  throw new Error('TODO');
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
