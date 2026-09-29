// ─────────────────────────────────────────────────────────────────────────
//  33 · unary, flip and negate — SOLUTION                  ★☆☆ warm-up
//  run: node 33-combinators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: these are shape adapters. `unary` exists because callback
//  APIs pass more than you asked for — `map` hands the callback the index,
//  which `parseInt` reads as a radix, which is why `map(parseInt)` is the
//  most famous one-liner bug in JavaScript.
//  `flip` swaps the first two parameters and forwards `...rest` unchanged
//  so it stays honest about extra arguments. `negate` uses `!`, which also
//  coerces: the result is always a real boolean even when the wrapped
//  function returns 0 or a string. Being a proper boolean matters as soon
//  as the result is compared with `===` or serialised to JSON.
//  Because these are combinators — functions in, functions out — they
//  compose: `filter(negate(allOf(a, b)))` reads like a sentence.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function unary(fn) {
  return (x) => fn(x);
}

export function flip(fn) {
  return (a, b, ...rest) => fn(b, a, ...rest);
}

export function negate(fn) {
  return (...args) => !fn(...args);
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
