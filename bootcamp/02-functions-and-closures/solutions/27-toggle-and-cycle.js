// ─────────────────────────────────────────────────────────────────────────
//  27 · toggle and cycle — SOLUTION                        ★☆☆ warm-up
//  run: node 27-toggle-and-cycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `makeToggle` keeps a boolean and returns the value AFTER
//  flipping it, so the first call on a switch that starts off gives you
//  true. `cycle` keeps an index and advances it with the modulo operator —
//  `i = (i + 1) % values.length` — which is the arithmetic way of saying
//  "wrap around". Reading the value first and then advancing is what makes
//  the first call return values[0]; advance-then-read would skip it.
//  Guard the empty case: `% 0` is NaN, and indexing with NaN gives you
//  undefined by accident rather than on purpose.

import { test, eq, ok } from '../../_lib/check.js';

export function makeToggle(state = false) {
  return () => {
    state = !state;
    return state;
  };
}

export function cycle(...values) {
  let i = 0;
  return () => {
    if (values.length === 0) return undefined;
    const value = values[i];
    i = (i + 1) % values.length;
    return value;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a toggle starts off and reports the state after flipping', () => {
  const dark = makeToggle();
  eq(dark(), true);
  eq(dark(), false);
  eq(dark(), true);
});

test('a toggle can be started on', () => {
  const dark = makeToggle(true);
  eq(dark(), false);
  eq(dark(), true);
});

test('two toggles hold separate state', () => {
  const a = makeToggle();
  const b = makeToggle();
  a();
  a();
  eq(a(), true);
  eq(b(), true, 'b has only just been flipped for the first time');
});

test('cycle hands back the values in order, starting at the first', () => {
  const dir = cycle('N', 'E', 'S');
  eq([dir(), dir(), dir()], ['N', 'E', 'S']);
});

test('cycle wraps around forever', () => {
  const dir = cycle('N', 'E');
  eq([dir(), dir(), dir(), dir(), dir()], ['N', 'E', 'N', 'E', 'N']);
});

test('a one-value cycle keeps returning that value', () => {
  const only = cycle('N');
  eq([only(), only(), only()], ['N', 'N', 'N']);
});

test('an empty cycle returns undefined instead of blowing up', () => {
  const nothing = cycle();
  eq(nothing(), undefined);
  eq(nothing(), undefined);
});

test('two cycles over the same values keep separate positions', () => {
  const values = ['a', 'b', 'c'];
  const one = cycle(...values);
  const two = cycle(...values);
  one();
  one();
  eq(one(), 'c');
  eq(two(), 'a');
  ok(values.length === 3, 'the source array must not be consumed');
});
