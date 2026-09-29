// ─────────────────────────────────────────────────────────────────────────
//  14 · a tiny Maybe — SOLUTION                             ★★★ stretch
//  run: node 14-maybe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: no classes needed — a closure over `value` plus an object
//  of methods is a perfectly good algebraic type. Compute `isNothing` once
//  in the constructor and every method becomes a one-line ternary.
//  The emptiness test names null and undefined explicitly, and nothing
//  else, which is why 0, '' and false survive. Writing `!value` there is
//  THE classic bug in this exercise: it swallows every falsy value, and
//  your prices of 0 quietly turn into fallbacks.
//  map wraps the result in Maybe again, so a function returning null hands
//  back a Nothing and the rest of the chain no-ops. chain does NOT wrap —
//  the function already returned a Maybe, and wrapping again would give
//  you a Maybe of a Maybe that no `getOrElse` can see through.

import { test, eq, ok } from '../../_lib/check.js';

export function Maybe(value) {
  const isNothing = value === null || value === undefined;
  return {
    isNothing,
    map: (fn) => (isNothing ? Maybe(null) : Maybe(fn(value))),
    chain: (fn) => (isNothing ? Maybe(null) : fn(value)),
    filter: (pred) => (isNothing || !pred(value) ? Maybe(null) : Maybe(value)),
    getOrElse: (fallback) => (isNothing ? fallback : value),
  };
}

// `Maybe.of` is the name this constructor has in most libraries.
Maybe.of = Maybe;

// ──────────────────────────── tests ──────────────────────────────────────

test('map transforms the value inside the box', () => {
  eq(Maybe(5).map((n) => n * 2).getOrElse(0), 10);
  eq(Maybe.of('ada').map((s) => s.toUpperCase()).getOrElse(''), 'ADA');
});

test('null and undefined are Nothing', () => {
  ok(Maybe(null).isNothing);
  ok(Maybe(undefined).isNothing);
  eq(Maybe(null).getOrElse('fallback'), 'fallback');
});

test('0, empty string and false are ordinary values', () => {
  eq(Maybe(0).isNothing, false);
  eq(Maybe(0).getOrElse(99), 0);
  eq(Maybe('').getOrElse('fallback'), '');
  eq(Maybe(false).getOrElse(true), false);
});

test('map on a Nothing never calls the function', () => {
  let called = false;
  const result = Maybe(null).map(() => {
    called = true;
    return 'x';
  });
  eq(called, false);
  ok(result.isNothing, 'still a Maybe, still Nothing');
});

test('a map that returns null produces a Nothing', () => {
  const box = Maybe({ a: 1 }).map((o) => o.missing);
  ok(box.isNothing);
  eq(box.map((v) => v.toUpperCase()).getOrElse('safe'), 'safe');
});

test('chain flattens a function that returns a Maybe', () => {
  const half = (n) => (n % 2 === 0 ? Maybe(n / 2) : Maybe(null));
  eq(Maybe(8).chain(half).getOrElse('odd'), 4);
  eq(Maybe(7).chain(half).getOrElse('odd'), 'odd');
});

test('filter turns a failing value into Nothing', () => {
  const big = (n) => n > 10;
  eq(Maybe(42).filter(big).getOrElse(0), 42);
  eq(Maybe(4).filter(big).getOrElse(0), 0);
  ok(Maybe(null).filter(big).isNothing);
});

test('long chains stay safe from end to end', () => {
  const shout = (box) =>
    box
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.toUpperCase())
      .getOrElse('(nothing)');
  eq(shout(Maybe('  hi ')), 'HI');
  eq(shout(Maybe('   ')), '(nothing)');
  eq(shout(Maybe(null)), '(nothing)');
});
