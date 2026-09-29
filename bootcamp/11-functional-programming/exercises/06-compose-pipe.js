// ─────────────────────────────────────────────────────────────────────────
//  06 · compose & pipe                                      ★★☆ core
//  concepts: higher-order functions · composition
//  run: node 06-compose-pipe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two functions, eight lines, and the rest of the module runs on them.
//  Both take any number of functions and return ONE function; the only
//  difference is which end they start from.
//
//      const shout = pipe(trim, upper, exclaim);      // left → right
//      shout('  hi ')                                 → 'HI!'
//
//      const shout2 = compose(exclaim, upper, trim);  // right → left
//      shout2('  hi ')                                → 'HI!'
//
//  The FIRST function to run receives every argument the composed function
//  was called with; after that each step takes exactly one value — the
//  previous step's return. With no functions at all, you get the input
//  back unchanged.
//
//  You built these in 02/18 — this time from memory; 07 uses them.
//
//  hint: reduce over the functions, and remember compose is pipe with the
//  list flipped.

import { test, eq } from '../../_lib/check.js';

const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const exclaim = (s) => `${s}!`;

export function pipe(...fns) {
  throw new Error('TODO');
}

export function compose(...fns) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('pipe runs its functions left to right', () => {
  eq(pipe(trim, upper, exclaim)('  hi '), 'HI!');
});

test('compose runs its functions right to left', () => {
  eq(compose(exclaim, upper, trim)('  hi '), 'HI!');
});

test('order matters — the same functions, flipped, differ', () => {
  eq(pipe(exclaim, trim)('  hi '), 'hi !');
});

test('the first function receives every argument', () => {
  const add = (a, b) => a + b;
  eq(pipe(add, (n) => n * 10)(2, 3), 50);
  eq(compose((n) => n * 10, add)(2, 3), 50);
});

test('with no functions the input comes straight back', () => {
  eq(pipe()('untouched'), 'untouched');
  eq(compose()('untouched'), 'untouched');
});

test('the composed function is reusable', () => {
  const shout = pipe(trim, upper, exclaim);
  eq(shout(' a '), 'A!');
  eq(shout(' b '), 'B!');
});
