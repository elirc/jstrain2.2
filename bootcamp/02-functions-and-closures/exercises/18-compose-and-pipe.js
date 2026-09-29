// ─────────────────────────────────────────────────────────────────────────
//  18 · compose and pipe                                   ★★☆ core
//  concepts: higher-order functions · variadic arguments
//  run: node 18-compose-and-pipe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Glue small functions into one. `pipe` reads left to right (the order
//  things happen); `compose` reads right to left (the order you would
//  write the nested calls by hand). Both take any number of functions.
//
//      const inc = (n) => n + 1;
//      const dbl = (n) => n * 2;
//
//      pipe(inc, dbl)(3)        → 8      dbl(inc(3))
//      compose(inc, dbl)(3)     → 7      inc(dbl(3))
//      pipe()(42)               → 42     no steps: identity
//
//  Only the FIRST function of the chain may take several arguments; every
//  later one receives a single value.
//
//      pipe((a, b) => a + b, dbl)(2, 3)  → 10
//
//  hint: reduce over the list, threading the value through

import { test, eq, ok, spy } from '../../_lib/check.js';

export function pipe(...fns) {
  throw new Error('TODO');
}

export function compose(...fns) {
  throw new Error('TODO');
}

// ── given: two tiny steps used all over the tests ──
const inc = (n) => n + 1;
const dbl = (n) => n * 2;

// ──────────────────────────── tests ──────────────────────────────────────

test('pipe applies the functions left to right', () => {
  eq(pipe(inc, dbl)(3), 8);
  eq(pipe(dbl, inc)(3), 7);
});

test('compose applies the functions right to left', () => {
  eq(compose(inc, dbl)(3), 7);
  eq(compose(dbl, inc)(3), 8);
});

test('both handle chains longer than two', () => {
  eq(pipe(inc, dbl, inc, dbl)(1), 10);
  eq(compose(dbl, inc, dbl, inc)(1), 10);
});

test('a single function is passed through unchanged', () => {
  eq(pipe(inc)(1), 2);
  eq(compose(inc)(1), 2);
});

test('an empty chain is the identity function', () => {
  eq(pipe()(42), 42);
  eq(compose()('hello'), 'hello');
});

test('the first function receives every argument', () => {
  eq(pipe((a, b) => a + b, dbl)(2, 3), 10);
  eq(compose(dbl, (a, b) => a + b)(2, 3), 10);
});

test('each step runs once, on the previous result', () => {
  const first = spy((n) => n + 1);
  const second = spy((n) => n * 2);
  eq(pipe(first, second)(3), 8);
  eq(first.calls, [[3]]);
  eq(second.calls, [[4]]);
});

test('a composed function is reusable', () => {
  const slugify = pipe(
    (s) => s.trim(),
    (s) => s.toLowerCase(),
    (s) => s.split(' ').join('-')
  );
  ok(typeof slugify === 'function');
  eq(slugify('  Hello There  '), 'hello-there');
  eq(slugify('Another Post'), 'another-post');
});
