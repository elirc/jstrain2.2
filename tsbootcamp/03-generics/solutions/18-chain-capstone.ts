// ─────────────────────────────────────────────────────────────────────────
//  18 · chain — CAPSTONE — SOLUTION                       ★★★ stretch
//  run: node ../run.js solutions/18-chain-capstone.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two LEVELS of type parameter live in this class.
//
//  T belongs to the instance: it is chosen at `new` (or by `chain`) and
//  every member sees the same one. U and A belong to a single method
//  call: `map<U>` gets a fresh U each time it is called, inferred from
//  the callback's return type, and hands back a `Chain<U>` — a different
//  type from the chain you called it on. That is what lets a pipeline
//  start as `Chain<number>` and end as `string[]` with every intermediate
//  step still fully typed.
//
//  `filter` and `take` return `Chain<T>` because they only remove items,
//  never change them. `reduce<A>` takes its accumulator type from the
//  seed value, which is why `reduce((sum, s) => sum + s.length, 0)` needs
//  no annotations at all.
//
//  Storing `readonly T[]` and rebuilding a new Chain per step keeps the
//  thing immutable: `toArray` spreads a copy out so a caller cannot reach
//  back in and mutate the pipeline's contents.
//
//  Where this goes next: a `filter` overload with a type predicate
//  (`filter<S extends T>(fn: (item: T) => item is S): Chain<S>`) narrows
//  the chain as it filters — the same idea as `map`, aimed at narrowing
//  instead of transformation.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export class Chain<T> {
  private items: readonly T[];

  constructor(items: readonly T[]) {
    this.items = items;
  }

  map<U>(fn: (item: T, index: number) => U): Chain<U> {
    return new Chain(this.items.map(fn));
  }

  filter(fn: (item: T, index: number) => boolean): Chain<T> {
    return new Chain(this.items.filter(fn));
  }

  take(n: number): Chain<T> {
    return new Chain(this.items.slice(0, n));
  }

  reduce<A>(fn: (acc: A, item: T) => A, initial: A): A {
    return this.items.reduce(fn, initial);
  }

  toArray(): T[] {
    return [...this.items];
  }
}

export function chain<T>(items: readonly T[]): Chain<T> {
  return new Chain(items);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('maps every item', () => {
  eq(chain([1, 2, 3]).map((n: number) => n * 2).toArray(), [2, 4, 6]);
});

test('the callback gets the index too', () => {
  eq(chain(['a', 'b']).map((s: string, i: number) => `${i}${s}`).toArray(), ['0a', '1b']);
});

test('filters and takes', () => {
  const out = chain([1, 2, 3, 4, 5])
    .filter((n: number) => n % 2 === 1)
    .take(2)
    .toArray();
  eq(out, [1, 3]);
});

test('take never asks for more than there is', () => {
  eq(chain([1]).take(10).toArray(), [1]);
});

test('a full pipeline changes the element type on the way', () => {
  const out = chain([1, 2, 3])
    .map((n: number) => `#${n}`)
    .filter((s: string) => s !== '#2')
    .toArray();
  eq(out, ['#1', '#3']);
});

test('reduce folds down to a single value', () => {
  eq(chain(['a', 'bb']).reduce((total: number, s: string) => total + s.length, 0), 3);
});

test('every step is a new chain, and toArray copies out', () => {
  const start = chain([1, 2]);
  ok(start.take(1) !== start);
  ok(start.toArray() !== start.toArray());
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<Chain<number>['toArray']>, number[]>>;
type _r2 = Expect<Equal<ReturnType<typeof chain<string>>, Chain<string>>>;

function _typeTests() {
  const numbers = chain([1, 2, 3]);
  type _n = Expect<Equal<typeof numbers, Chain<number>>>;

  // map retypes the chain; filter and take do not
  const labels = numbers.map((n) => `#${n}`);
  type _l = Expect<Equal<typeof labels, Chain<string>>>;

  const kept = labels.filter((s) => s.length > 1).take(2);
  type _k = Expect<Equal<typeof kept, Chain<string>>>;

  const out = kept.toArray();
  type _o = Expect<Equal<typeof out, string[]>>;
  use(numbers, labels, kept, out);

  // @ts-expect-error — after map the items are strings, not numbers
  numbers.map((n) => `#${n}`).filter((s) => s > 1);

  // @ts-expect-error — take counts items; it does not take a string
  numbers.take('2');

  const total = chain(['a', 'bb']).reduce((sum, s) => sum + s.length, 0);
  type _t = Expect<Equal<typeof total, number>>;
  use(total);

  // @ts-expect-error — the accumulator's type is fixed by the seed value
  chain(['a']).reduce((sum: number, s) => sum + s, 'seed');
}
use(_typeTests);
