// ─────────────────────────────────────────────────────────────────────────
//  05 · clamp                                             ★★☆ core
//  concepts: union constraints · comparator parameters
//  run: node ../run.js exercises/05-clamp-comparable.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Two ways to say "this type can be ordered".
//
//  `clamp` constrains T to the types `<` actually works on — numbers and
//  strings — so the body can compare directly:
//
//      clamp(15, 1, 10)        → 10
//      clamp('m', 'c', 'g')    → 'g'
//
//  `clampBy` drops the constraint and takes the ordering as an argument,
//  the way `Array#sort` does. `compare(a, b)` is negative when a < b:
//
//      clampBy(d(2024), d(2020), d(2022), byTime)   → d(2022)
//
//  hint: TS refuses `a < b` when it cannot prove both sides are the same
//  comparable primitive — that is what the union constraint buys you

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function clamp(value: TODO, low: TODO, high: TODO): TODO {
  throw new Error('TODO');
}

export function clampBy(
  value: TODO,
  low: TODO,
  high: TODO,
  compare: TODO
): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const byTime = (a: Date, b: Date): number => a.getTime() - b.getTime();

test('leaves a value that is already in range', () => {
  eq(clamp(5, 1, 10), 5);
});

test('pulls a value up to the low bound', () => {
  eq(clamp(-3, 1, 10), 1);
});

test('pulls a value down to the high bound', () => {
  eq(clamp(15, 1, 10), 10);
});

test('clamps strings alphabetically', () => {
  eq(clamp('m', 'c', 'g'), 'g');
});

test('clampBy orders anything you can compare', () => {
  const low = new Date('2020-01-01');
  const high = new Date('2022-01-01');
  eq(clampBy(new Date('2024-01-01'), low, high, byTime), high);
});

test('clampBy leaves an in-range value alone', () => {
  const value = new Date('2021-01-01');
  eq(clampBy(value, new Date('2020-01-01'), new Date('2022-01-01'), byTime), value);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof clamp<number>>, number>>;
type _r2 = Expect<Equal<ReturnType<typeof clampBy<Date>>, Date>>;

function _typeTests() {
  const value: number = 5;
  const result = clamp(value, 1, 10);
  type _n = Expect<Equal<typeof result, number>>;
  use(result);

  // @ts-expect-error — Date is not a number or a string, so it fails the
  // constraint; that is what clampBy is for
  clamp(new Date(), new Date(), new Date());

  // @ts-expect-error — one T: you cannot mix a number with a string bound
  clamp(5, 1, 'ten');

  // the comparator's parameters are inferred, no annotations needed
  const bounded = clampBy(new Date(), new Date(), new Date(), (a, b) =>
    a.getTime() - b.getTime()
  );
  type _d = Expect<Equal<typeof bounded, Date>>;
  use(bounded);

  // @ts-expect-error — a comparator returns a number, not a boolean
  clampBy(5, 1, 10, (a, b) => a < b);
}
use(_typeTests);
