// ─────────────────────────────────────────────────────────────────────────
//  07 · MyPick and MyRecord                                 ★★☆ core
//  concepts: mapped types over a key union · constraints · PropertyKey
//  run: node ../run.js exercises/07-my-pick-record.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  So far the loop ran over `keyof T`. It does not have to: a mapped type
//  can iterate ANY union of keys.
//
//      MyPick<{ a: string; b: number }, 'a'>   →  { a: string }
//      MyRecord<'x' | 'y', number>             →  { x: number; y: number }
//
//  The constraints matter as much as the bodies. MyPick must reject a key
//  that is not in T; MyRecord must accept string | number | symbol keys
//  and nothing else. Both constraints are marked TODO — supply them.
//
//  Then the runtime halves: pickFields copies the named keys, zeroed
//  builds a counter object seeded at 0.
//
//  hint: PropertyKey is a built-in alias; `keyof T` is the other one you
//  need. `{} as SomeMappedType` is a fair way to start an accumulator.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type MyPick<T, K extends TODO> = TODO;
export type MyRecord<K extends TODO, V> = TODO;

export interface Row {
  id: string;
  name: string;
  active: boolean;
}

export function pickFields<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): MyPick<T, K> {
  throw new Error('TODO');
}

export function zeroed<K extends string>(
  keys: readonly K[]
): MyRecord<K, number> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const row: Row = { id: 'r1', name: 'Ada', active: true };

test('picks the named keys', () => {
  eq(pickFields(row, ['id', 'name']), { id: 'r1', name: 'Ada' });
});

test('picking nothing gives an empty object', () => {
  eq(pickFields(row, []), {});
});

test('does not mutate the source', () => {
  pickFields(row, ['id']);
  eq(row, { id: 'r1', name: 'Ada', active: true });
});

test('zeroed builds one counter per key', () => {
  eq(zeroed(['hits', 'misses']), { hits: 0, misses: 0 });
});

// ──────────────────────────── type tests ─────────────────────────────────

// `{ [P in K]: T[P] }` with `K extends keyof T` still counts as
// homomorphic, so the modifiers ride along
type _t1 = Expect<
  Equal<
    MyPick<{ a: string; b?: number; readonly c: boolean }, 'b' | 'c'>,
    { b?: number; readonly c: boolean }
  >
>;
type _t2 = Expect<Equal<MyPick<Row, 'id' | 'name'>, Pick<Row, 'id' | 'name'>>>;
type _t3 = Expect<Equal<MyRecord<'a' | 'b', number>, { a: number; b: number }>>;
type _t4 = Expect<Equal<MyRecord<Row['id'], boolean>, { [x: string]: boolean }>>;
type _t5 = Expect<Equal<MyRecord<'a' | 'b', number>, Record<'a' | 'b', number>>>;

// @ts-expect-error — 'nope' is not a key of the source object
type _bad1 = MyPick<Row, 'nope'>;
// @ts-expect-error — a boolean cannot be an object key
type _bad2 = MyRecord<boolean, number>;

function _typeTests() {
  const two: { id: string; name: string } = pickFields(row, ['id', 'name']);
  use(two);

  const counts: { hits: number } = zeroed(['hits']);
  use(counts);

  // @ts-expect-error — a key that was not picked is not on the result
  pickFields(row, ['id']).name;

  // @ts-expect-error — you cannot pick a key the object does not have
  pickFields(row, ['nope']);
}
use(_typeTests);
