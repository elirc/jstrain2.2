// ─────────────────────────────────────────────────────────────────────────
//  03 · default parameters — SOLUTION                      ★☆☆ warm-up
//  run: node 03-default-parameters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: defaults are pure `undefined` checks. `greet('Ada', null)`
//  keeps null, which is exactly why `greeting = greeting || 'Hello'` is a
//  different (and usually buggier) thing: `||` also swallows '' and 0.
//  Parameters are just bindings in a left-to-right scope, so `times =
//  text.length` can read `text`. The other way round would throw — a
//  default may only look left.

import { test, eq } from '../../_lib/check.js';

export function greet(name, greeting = 'Hello', mark = '!') {
  return `${greeting}, ${name}${mark}`;
}

export function repeat(text, times = text.length) {
  return text.repeat(times);
}

export function pageRange(page, size = 10) {
  return { from: page * size, to: page * size + size - 1 };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('falls back to every default when only name is given', () => {
  eq(greet('Ada'), 'Hello, Ada!');
});

test('explicit arguments win over the defaults', () => {
  eq(greet('Ada', 'Yo', '?'), 'Yo, Ada?');
});

test('undefined picks the default but null does not', () => {
  eq(greet('Ada', undefined, undefined), 'Hello, Ada!');
  eq(greet('Ada', null), 'null, Ada!');
});

test('a default can be built from an earlier parameter', () => {
  eq(repeat('ab'), 'abab');
  eq(repeat('ab', 1), 'ab');
  eq(repeat('ab', 0), '');
});

test('pageRange defaults the page size to 10', () => {
  eq(pageRange(0), { from: 0, to: 9 });
  eq(pageRange(2), { from: 20, to: 29 });
  eq(pageRange(1, 5), { from: 5, to: 9 });
});

test('parameters with defaults do not count toward length', () => {
  eq(greet('Ada'), 'Hello, Ada!');
  eq(greet.length, 1);
  eq(repeat.length, 1);
  eq(pageRange.length, 1);
});
