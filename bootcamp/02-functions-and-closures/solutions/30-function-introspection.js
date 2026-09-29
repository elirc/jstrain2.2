// ─────────────────────────────────────────────────────────────────────────
//  30 · fn.length and fn.name — SOLUTION                   ★☆☆ warm-up
//  run: node 30-function-introspection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `fn.length` is the count of parameters BEFORE the first
//  one with a default or a rest parameter — it is the "required arity", not
//  the number of things the function can receive. `fn.name` is inferred at
//  definition time from the variable, property or class field it is
//  assigned to; a function passed straight in as an argument never gets
//  that inference, so its name is the empty string.
//  Both are metadata, not guarantees: `(...args) => args.length` reports
//  arity 0 while happily taking ten arguments, and a bound function reports
//  `bound add` with the preset arguments already subtracted from its
//  length. Useful for tooling and error messages; never a security check.

import { test, eq, ok } from '../../_lib/check.js';

export function arity(fn) {
  return fn.length;
}

export function describe(fn) {
  return `${fn.name || 'anonymous'}/${fn.length}`;
}

export function wrongArity(handlers, expected) {
  return Object.entries(handlers)
    .filter(([, fn]) => fn.length !== expected)
    .map(([name]) => name)
    .sort();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('arity counts the plain parameters', () => {
  eq(arity(() => 0), 0);
  eq(arity((a, b) => 0), 2);
  eq(arity(function (a, b, c) {}), 3);
});

test('arity stops counting at the first default', () => {
  eq(arity((a, b = 1, c) => 0), 1);
  eq(arity((a = 1, b = 2) => 0), 0);
});

test('rest parameters do not count towards the arity', () => {
  eq(arity((...xs) => 0), 0);
  eq(arity((a, ...xs) => 0), 1);
});

test('describe reports the name and the arity', () => {
  eq(describe(function add(a, b) {}), 'add/2');
  const double = (n) => n * 2;
  eq(describe(double), 'double/1');
});

test('describe falls back for a function with no inferred name', () => {
  eq(describe(function () {}), 'anonymous/0');
  eq(describe((a) => a), 'anonymous/1');
});

test('a bound function reports a prefixed name and a smaller arity', () => {
  function add(a, b) {
    return a + b;
  }
  eq(describe(add.bind(null, 1)), 'bound add/1');
});

test('wrongArity names the handlers that take the wrong count', () => {
  const handlers = {
    save: (event, ctx) => 0,
    load: (event) => 0,
    drop: () => 0,
  };
  eq(wrongArity(handlers, 2), ['drop', 'load']);
});

test('wrongArity returns an empty list when the table is clean', () => {
  const handlers = { save: (a, b) => 0, load: (a, b) => 0 };
  eq(wrongArity(handlers, 2), []);
  ok(Array.isArray(wrongArity(handlers, 2)));
});
