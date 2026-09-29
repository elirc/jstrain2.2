// ─────────────────────────────────────────────────────────────────────────
//  04 · firstOrDefault — SOLUTION                          ★★☆ core
//  run: node ../run.js _lib/example/04-first-or-default.solution.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one type parameter T ties the three positions together:
//  the array's elements, the fallback, and the return value. Call sites
//  never name T — inference fills it from the arguments, and mismatched
//  arguments (string[] with a number fallback) fail to unify, which is
//  exactly the compile error the @ts-expect-error test demands.

import { test, eq } from '../check.ts';
import { use, type Expect, type Equal } from '../type-assert.ts';

export function firstOrDefault<T>(arr: T[], fallback: T): T {
  return arr.length > 0 ? arr[0]! : fallback;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('returns the first element when there is one', () => {
  eq(firstOrDefault([1, 2, 3], 0), 1);
});

test('returns the fallback for an empty array', () => {
  eq(firstOrDefault([], 'none'), 'none');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof firstOrDefault<string>>, string>>;

function _typeTests() {
  const n: number = firstOrDefault([1, 2], 0);
  use(n);

  // @ts-expect-error — a string[] with a number fallback must not compile
  firstOrDefault(['a', 'b'], 1);
}
use(_typeTests);
