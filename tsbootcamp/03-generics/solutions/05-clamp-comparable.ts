// ─────────────────────────────────────────────────────────────────────────
//  05 · clamp — SOLUTION                                  ★★☆ core
//  run: node ../run.js solutions/05-clamp-comparable.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a constraint does not have to be an object shape. `T
//  extends number | string` is a union constraint — it narrows what may
//  come in to exactly the primitives `<` understands, which is why the
//  body compiles at all. With a bare `<T>` the line `value < low` is an
//  error: TS will not order two values it knows nothing about.
//
//  `clampBy` shows the other move: when you cannot constrain the data,
//  take the capability as an argument. The comparator is typed
//  `(a: T, b: T) => number`, so T is still inferred from the first three
//  arguments and the callback's parameters get typed for free — you write
//  `(a, b) => a.getTime() - b.getTime()` with no annotations.
//
//  Wrong turn: `T extends Comparable` where you invent an interface with
//  a `compareTo` method. Java habit; JS values do not have one.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function clamp<T extends number | string>(value: T, low: T, high: T): T {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

export function clampBy<T>(
  value: T,
  low: T,
  high: T,
  compare: (a: T, b: T) => number
): T {
  if (compare(value, low) < 0) return low;
  if (compare(value, high) > 0) return high;
  return value;
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
