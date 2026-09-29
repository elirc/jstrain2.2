// ─────────────────────────────────────────────────────────────────────────
//  03 · default parameters                                 ★☆☆ warm-up
//  concepts: parameters · defaults
//  run: node 03-default-parameters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A default kicks in when an argument is `undefined` — and only then.
//  A default can also be an expression built from parameters to its left.
//
//      greet('Ada')                 → 'Hello, Ada!'
//      greet('Ada', 'Yo', '?')      → 'Yo, Ada?'
//      greet('Ada', null)           → 'null, Ada!'   (null is a value!)
//      repeat('ab')                 → 'abab'         (times = text.length)
//      pageRange(2)                 → { from: 20, to: 29 }
//
//  Write all three using default parameter syntax — no `if` statements,
//  no `||` fallbacks.

import { test, eq } from '../../_lib/check.js';

export function greet(name, greeting = 'Hello', mark = '!') {
  throw new Error('TODO');
}

export function repeat(text, times = text.length) {
  throw new Error('TODO');
}

export function pageRange(page, size = 10) {
  throw new Error('TODO');
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
