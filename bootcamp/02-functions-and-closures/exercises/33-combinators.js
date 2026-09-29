// ─────────────────────────────────────────────────────────────────────────
//  33 · unary, flip and negate                             ★☆☆ warm-up
//  concepts: combinators · higher-order functions · arity
//  run: node 33-combinators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three one-line combinators that fix the mismatch between the function
//  you have and the shape a callback API wants.
//
//      ['1', '7', '11'].map(parseInt)         → [1, NaN, 3]   💥
//      ['1', '7', '11'].map(unary(parseInt))  → [1, 7, 11]    (index dropped)
//
//      const to = (a, b) => `${a}->${b}`;
//      flip(to)('x', 'y')                     → 'y->x'
//
//      const isEven = (n) => n % 2 === 0;
//      [1, 2, 3].filter(negate(isEven))       → [1, 3]
//
//  `unary` keeps only the first argument; `flip` swaps the first two and
//  passes the rest through untouched; `negate` returns a function that
//  gives back the opposite boolean. Ramda calls that last one
//  `complement` — same combinator, so it is exported here as an alias.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function unary(fn) {
  throw new Error('TODO');
}

export function flip(fn) {
  throw new Error('TODO');
}

export function negate(fn) {
  throw new Error('TODO');
}

// ── given: Ramda's name for the same combinator ──
export const complement = negate;

// ──────────────────────────── tests ──────────────────────────────────────

test('unary drops every argument after the first', () => {
  eq(['1', '7', '11'].map(unary(parseInt)), [1, 7, 11]);
  eq(['1', '7', '11'].map(parseInt), [1, NaN, 3], 'the bug it fixes');
});

test('unary forwards the first argument and the return value', () => {
  const fn = spy((x) => `<${x}>`);
  eq(unary(fn)('a', 'b', 'c'), '<a>');
  eq(fn.calls, [['a']]);
});

test('flip swaps the first two arguments', () => {
  const to = (a, b) => `${a}->${b}`;
  eq(flip(to)('x', 'y'), 'y->x');
});

test('flip passes any further arguments through untouched', () => {
  const fn = spy((...args) => args);
  flip(fn)('a', 'b', 'c', 'd');
  eq(fn.calls, [['b', 'a', 'c', 'd']]);
});

test('flipping twice gets you the original order back', () => {
  const to = (a, b) => `${a}->${b}`;
  eq(flip(flip(to))('x', 'y'), 'x->y');
});

test('negate flips the answer of a predicate', () => {
  const isEven = (n) => n % 2 === 0;
  eq([1, 2, 3, 4].filter(negate(isEven)), [1, 3]);
  eq(negate(isEven)(2), false);
});

test('negate always hands back a real boolean', () => {
  eq(negate(() => 0)(), true);
  eq(negate(() => 'anything')(), false);
  eq(negate((a, b) => a > b)(1, 2), true);
});

test('complement is the very same combinator under another name', () => {
  const isEmpty = (s) => s.length === 0;
  const notEmpty = complement(isEmpty);
  eq(notEmpty('hi'), true);
  eq(notEmpty(''), false);
  ok(complement === negate);
});
