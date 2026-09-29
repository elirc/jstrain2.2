// ─────────────────────────────────────────────────────────────────────────
//  18 · compose and pipe — SOLUTION                        ★★☆ core
//  run: node 18-compose-and-pipe.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `pipe` seeds the reduce with the result of the first
//  function so it alone can be multi-argument, then threads one value
//  through the rest. With no functions at all there is nothing to seed,
//  so the first argument comes straight back out — the identity case that
//  reduce would otherwise crash on. `compose` is literally `pipe` with
//  the list reversed; write it that way rather than duplicating the
//  logic. Watch out for `reverse()` mutating the caller's array — spread
//  into a copy first.

import { test, eq, ok, spy } from '../../_lib/check.js';

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
