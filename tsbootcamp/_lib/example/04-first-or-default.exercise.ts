// ─────────────────────────────────────────────────────────────────────────
//  04 · firstOrDefault                                     ★★☆ core
//  concepts: generics · type parameters
//  run: node ../run.js _lib/example/04-first-or-default.exercise.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Return the first element of an array, or a fallback when it is empty —
//  and make the types line up so the fallback must match the elements.
//
//      firstOrDefault([1, 2, 3], 0)    → 1        (number)
//      firstOrDefault([], 'none')      → 'none'   (string)
//
//  hint: one type parameter is enough

import { test, eq } from '../check.ts';
import { use, type Expect, type Equal } from '../type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function firstOrDefault(arr: TODO, fallback: TODO): TODO {
  throw new Error('TODO');
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
