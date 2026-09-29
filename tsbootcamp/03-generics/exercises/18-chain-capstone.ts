// ─────────────────────────────────────────────────────────────────────────
//  18 · chain — CAPSTONE                                  ★★★ stretch
//  concepts: generic classes · generic methods · retyping a pipeline
//  run: node ../run.js exercises/18-chain-capstone.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything in this module, in one small collection pipeline. The
//  interesting part is that `map` does not return `Chain<T>` — it returns
//  `Chain<U>`, so the chain CHANGES TYPE as the data flows through it:
//
//      chain([1, 2, 3])            Chain<number>
//        .map(n => `#${n}`)        Chain<string>
//        .filter(s => s !== '#2')  Chain<string>
//        .take(1)                  Chain<string>
//        .toArray()                string[]        → ['#1']
//
//      chain(['a', 'bb']).reduce((total, s) => total + s.length, 0)  → 3
//
//  `map` and `reduce` each need their own method-level type parameter (U
//  and A) on top of the class's T. `filter` and `take` keep T.
//
//  hint: a method-level parameter is declared on the method, not the
//  class — `map<U>(fn: (item: T, index: number) => U): Chain<U>`

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export class Chain<T> {
  private items: TODO;

  constructor(items: TODO) {
    this.items = items;
  }

  map(fn: TODO): TODO {
    throw new Error('TODO');
  }

  filter(fn: TODO): TODO {
    throw new Error('TODO');
  }

  take(n: number): TODO {
    throw new Error('TODO');
  }

  reduce(fn: TODO, initial: TODO): TODO {
    throw new Error('TODO');
  }

  toArray(): TODO {
    throw new Error('TODO');
  }
}

export function chain(items: TODO): TODO {
  throw new Error('TODO');
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
