// ─────────────────────────────────────────────────────────────────────────
//  04 · longest — SOLUTION                                ★★☆ core
//  run: node ../run.js solutions/04-constrained-longest.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `T extends { length: number }` is a constraint — the
//  "parameter type" of the type parameter. It does two jobs at once: it
//  rejects callers who pass a number, and it unlocks `.length` inside the
//  body. Drop the constraint and `a.length` is an error; replace T with
//  `{ length: number }` in the parameter list instead and the constraint
//  still holds, but the RETURN type collapses to `{ length: number }` and
//  the caller loses their string.
//
//  That is the whole reason to keep T: a constraint restricts what may
//  come in, the type parameter remembers what actually did.
//
//  `totalLength` takes `readonly T[]` so a `readonly` array is welcome
//  too — see exercise 16 for why that costs nothing.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function longest<T extends { length: number }>(a: T, b: T): T {
  return b.length > a.length ? b : a;
}

export function totalLength<T extends { length: number }>(items: readonly T[]): number {
  return items.reduce((sum, item) => sum + item.length, 0);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('picks the longer string', () => {
  eq(longest('hello', 'hi'), 'hello');
});

test('picks the longer array', () => {
  eq(longest([1, 2], [3, 4, 5]), [3, 4, 5]);
});

test('ties go to the first argument', () => {
  eq(longest('ab', 'cd'), 'ab');
});

test('totalLength adds up every length', () => {
  eq(totalLength(['ab', 'cde']), 5);
});

test('totalLength works on anything with a length', () => {
  eq(totalLength([[1, 2], [3], []]), 3);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof longest<string[]>>, string[]>>;

function _typeTests() {
  const arr = longest([1, 2], [3]);
  type _a = Expect<Equal<typeof arr, number[]>>;
  use(arr);

  // the constraint is not primitive-shaped, but T sits bare in the return
  // type, so the string literals survive as a union
  const s = longest('abc', 'de');
  type _s = Expect<Equal<typeof s, 'abc' | 'de'>>;
  use(s);

  // @ts-expect-error — a number has no .length, so it fails the constraint
  longest(1, 2);

  // @ts-expect-error — one T, so both arguments must be the same type
  longest('abc', [1, 2]);

  // @ts-expect-error — inside an UNCONSTRAINED generic, T has no members
  const noMembers = <U>(x: U): number => x.length;
  use(noMembers);
}
use(_typeTests);
