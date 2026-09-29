// ─────────────────────────────────────────────────────────────────────────
//  03 · arrays and readonly                                ★☆☆ warm-up
//  concepts: array types · readonly arrays
//  run: node ../run.js exercises/03-arrays-and-readonly.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `T[]` and `Array<T>` are the same type, spelled two ways. `readonly
//  T[]` is a different type: same reads, no `push`/`pop`/`sort`. Take
//  `readonly` arrays as parameters when you only read them — callers can
//  pass either kind, and the signature promises you won't mutate.
//
//      tags     ['ts', 'node']       → string[]
//      grid     [[1, 2], [3, 4]]     → number[][]
//      EMPTY    []                   → string[]   (inference can't guess)
//
//      total([90, 80, 70])           → 240        takes a readonly array
//      addTag(['ts'], 'node')        → ['ts', 'node']   a NEW array
//
//  hint: an empty array literal has nothing to infer from — that is
//  exactly the moment an annotation earns its keep

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const tags: TODO = ['ts', 'node'];
export const grid: TODO = [
  [1, 2],
  [3, 4],
];
export const EMPTY: TODO = [];

export function total(scores: TODO): TODO {
  throw new Error('TODO');
}

export function addTag(list: TODO, tag: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('total sums the scores', () => {
  eq(total([90, 80, 70]), 240);
});

test('total of an empty array is 0', () => {
  eq(total([]), 0);
});

test('addTag appends the new tag', () => {
  eq(addTag(['ts'], 'node'), ['ts', 'node']);
});

test('addTag leaves the input array untouched', () => {
  const original = ['ts'];
  addTag(original, 'node');
  eq(original, ['ts']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<typeof tags, string[]>>;
type _2 = Expect<Equal<typeof grid, number[][]>>;
type _3 = Expect<Equal<typeof EMPTY, string[]>>;
type _4 = Expect<Equal<Parameters<typeof total>[0], readonly number[]>>;
type _5 = Expect<Equal<ReturnType<typeof total>, number>>;
type _6 = Expect<Equal<ReturnType<typeof addTag>, string[]>>;

function _typeTests() {
  const frozen: readonly number[] = [1, 2, 3];
  total(frozen); // a readonly array is fine to read
  total([1, 2, 3]); // and so is a mutable one

  // @ts-expect-error — push does not exist on a readonly array
  frozen.push(4);

  // @ts-expect-error — a readonly array is not assignable to a mutable one
  const copy: number[] = frozen;
  use(copy);

  // @ts-expect-error — total adds numbers, not strings
  total(['90', '80']);

  // @ts-expect-error — addTag returns a fresh array of strings
  const wrong: number[] = addTag(tags, 'test');
  use(wrong);
}
use(_typeTests);
