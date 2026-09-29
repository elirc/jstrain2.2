// ─────────────────────────────────────────────────────────────────────────
//  30 · fn.length and fn.name                              ★☆☆ warm-up
//  concepts: function introspection · arity · metadata
//  run: node 30-function-introspection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every function tells you two things about itself: `fn.name` and
//  `fn.length`. Test frameworks, DI containers and auto-curry helpers all
//  read them — so learn what they actually report.
//
//      arity((a, b) => 0)          → 2
//      arity((a, b = 1, c) => 0)   → 1     counting stops at the default
//      arity((...xs) => 0)         → 0     rest never counts
//
//      describe(function add(a, b) {})  → 'add/2'
//      describe(function () {})         → 'anonymous/0'
//
//  `wrongArity` audits a table of handlers and returns the names — sorted —
//  whose arity does not match what the caller expects:
//
//      wrongArity({ save: (a, b) => 0, load: (a) => 0 }, 2)  → ['load']

import { test, eq, ok } from '../../_lib/check.js';

export function arity(fn) {
  throw new Error('TODO');
}

export function describe(fn) {
  throw new Error('TODO');
}

export function wrongArity(handlers, expected) {
  throw new Error('TODO');
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
