// ─────────────────────────────────────────────────────────────────────────
//  06 · compose & pipe — SOLUTION                           ★★☆ core
//  run: node 06-compose-pipe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: split the list into `first` and `rest`. `first(...args)`
//  handles the "the first step gets every argument" rule; after that a
//  plain reduce threads a single value through the rest. The empty case
//  has to be checked before the split, otherwise there is no first step to
//  call and you would return undefined.
//  compose is pipe over the reversed list — but note `[...fns].reverse()`,
//  not `fns.reverse()`. `reverse` mutates in place; here `fns` is a fresh
//  rest-parameter array so it would be harmless, and that is exactly the
//  habit that bites you the day the array is passed in from outside.
//
//  You built these in 02/18 — this time from memory; 07 uses them.

import { test, eq } from '../../_lib/check.js';

const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const exclaim = (s) => `${s}!`;

export function pipe(...fns) {
  return (...args) => {
    if (fns.length === 0) return args[0];
    const [first, ...rest] = fns;
    return rest.reduce((value, fn) => fn(value), first(...args));
  };
}

export function compose(...fns) {
  return pipe(...[...fns].reverse());
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
