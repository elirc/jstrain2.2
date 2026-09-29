// ─────────────────────────────────────────────────────────────────────────
//  07 · MyPick and MyRecord — SOLUTION                      ★★☆ core
//  run: node ../run.js solutions/07-my-pick-record.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop source changes, the shape does not.
//
//      MyPick<T, K extends keyof T>      = { [P in K]: T[P] };
//      MyRecord<K extends PropertyKey, V> = { [P in K]: V };
//
//  MyPick indexes back into T for each key; MyRecord ignores the key and
//  uses one constant value type. That is the entire difference.
//
//  The constraints are the interesting part:
//
//  * `K extends keyof T` is what makes `MyPick<Row, 'nope'>` a compile
//    error AND what makes `T[P]` legal — without it tsc cannot prove P is
//    a key of T. It also keeps the type homomorphic (a mapped type over a
//    type parameter constrained to `keyof T` counts), so `readonly` and
//    `?` survive — see _t1.
//  * `K extends PropertyKey` (= `string | number | symbol`) is what the
//    real `Record` uses. Pass `string` rather than a literal union and you
//    get an index signature back, not a fixed set of keys — _t4.
//
//  Runtime: `{} as MyPick<T, K>` starts an accumulator that tsc will let
//  you write `out[key] = obj[key]` into, because both sides index by the
//  same K. Building it as `{}` and casting at the END would need a wider
//  cast, so this way is actually the tighter one.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
export type MyRecord<K extends PropertyKey, V> = { [P in K]: V };

export interface Row {
  id: string;
  name: string;
  active: boolean;
}

export function pickFields<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): MyPick<T, K> {
  const out = {} as MyPick<T, K>;
  for (const key of keys) out[key] = obj[key];
  return out;
}

export function zeroed<K extends string>(
  keys: readonly K[]
): MyRecord<K, number> {
  const out = {} as MyRecord<K, number>;
  for (const key of keys) out[key] = 0;
  return out;
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
