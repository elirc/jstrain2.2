// ─────────────────────────────────────────────────────────────────────────
//  04 · longest                                           ★★☆ core
//  concepts: generic constraints · extends
//  run: node ../run.js exercises/04-constrained-longest.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  An unconstrained `T` has NO members — you cannot read `.length` off it,
//  because T might be a number. A constraint is a parameter type for a
//  type: `T extends { length: number }` says "whatever you pass must have
//  a length", and inside the function that member becomes usable.
//
//      longest('hello', 'hi')        → 'hello'
//      longest([1, 2], [3, 4, 5])    → [3, 4, 5]
//      totalLength(['ab', 'cde'])    → 5
//
//  Both arguments of `longest` share one T, so the winner keeps the exact
//  type that went in — a string[] in, a string[] out, not a union.
//
//  hint: the constraint goes in the angle brackets, the argument types
//  stay plain T

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function longest(a: TODO, b: TODO): TODO {
  throw new Error('TODO');
}

export function totalLength(items: TODO): number {
  throw new Error('TODO');
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
