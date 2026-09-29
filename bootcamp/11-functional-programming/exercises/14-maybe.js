// ─────────────────────────────────────────────────────────────────────────
//  14 · a tiny Maybe                                        ★★★ stretch
//  concepts: closures · wrapper types · null safety
//  run: node 14-maybe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every "if (x != null)" in a chain is the same check written again.
//  Maybe writes it once: a box that either holds a value (Just) or holds
//  nothing (Nothing), and every operation on a Nothing is a no-op.
//
//      Maybe(5).map((n) => n * 2).getOrElse(0)        → 10
//      Maybe(null).map((n) => n * 2).getOrElse(0)     → 0   (map skipped)
//      Maybe(user).map((u) => u.email).getOrElse('—')
//
//  Build a Maybe as a plain object with:
//      isNothing            true when there is no value
//      map(fn)              Maybe of fn(value); untouched if Nothing
//      chain(fn)            like map, but fn already returns a Maybe
//      filter(pred)         becomes Nothing when pred(value) is false
//      getOrElse(fallback)  the value, or fallback when Nothing
//
//  Only null and undefined are "nothing". 0, '' and false are values.
//  A map that RETURNS null gives you a Nothing — that is what makes a
//  lookup chain collapse safely.
//
//  hint: `map` is `isNothing ? this-shaped-nothing : Maybe(fn(value))` —
//  the constructor's own null check does the rest of the work for you.

import { test, eq, ok } from '../../_lib/check.js';

export function Maybe(value) {
  throw new Error('TODO');
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
