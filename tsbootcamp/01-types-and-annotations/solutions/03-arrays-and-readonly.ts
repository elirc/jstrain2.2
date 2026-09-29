// ─────────────────────────────────────────────────────────────────────────
//  03 · arrays and readonly — SOLUTION                     ★☆☆ warm-up
//  run: node ../run.js solutions/03-arrays-and-readonly.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `tags` and `grid` infer perfectly from their literals —
//  `string[]` and `number[][]` — so the annotations come off. `EMPTY` is
//  the exception: `const EMPTY = []` has nothing to infer from. TypeScript
//  starts it as an "evolving" any[] and tries to settle the element type
//  from later pushes; with no pushes in sight you get an implicit-any
//  error instead. Annotate it and the guesswork stops.
//
//  The parameter types are the real lesson. `total` and `addTag` only
//  READ their arrays, so they take `readonly number[]` / `readonly
//  string[]`. That is strictly more useful: a mutable `string[]` is
//  assignable to a `readonly string[]` parameter, but not the reverse —
//  so the readonly signature accepts every caller, and the compiler
//  blocks an accidental `list.push(tag)` inside the function.
//
//  The wrong turn is `list: string[]` "because that's what callers have".
//  The day a caller holds a `readonly string[]` (or an `as const` array)
//  they cannot call you, and the fix is a copy nobody needed.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const tags = ['ts', 'node'];
export const grid = [
  [1, 2],
  [3, 4],
];
export const EMPTY: string[] = [];

export function total(scores: readonly number[]): number {
  let sum = 0;
  for (const score of scores) sum += score;
  return sum;
}

export function addTag(list: readonly string[], tag: string): string[] {
  return [...list, tag];
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
