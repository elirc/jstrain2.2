// ─────────────────────────────────────────────────────────────────────────
//  38 · the order defaults run in — SOLUTION               ★★☆ core
//  run: node 38-default-evaluation-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parameters are initialised one at a time, left to right,
//  each in a scope where everything to its left already exists and
//  everything to its right is still in the temporal dead zone. That single
//  rule explains all three parts: `connect` can build its url from the port
//  it just defaulted, `bad(a = b, b = 2)` throws a ReferenceError rather
//  than seeing `undefined`, and a supplied argument skips its default
//  expression entirely — which is what makes `id = nextId()` cheap.
//  Only `undefined` counts as "left out": `f(null)` keeps null, and `f()`
//  versus `f(undefined)` are indistinguishable from inside. If you need to
//  tell "not passed" from "passed undefined", count `arguments.length` or
//  use a rest parameter — a default cannot do it.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function order(log) {
  return (a = log('a'), b = log('b'), c = log('c')) => [a, b, c];
}

export function tdzProbe() {
  function bad(a = b, b = 2) {
    return [a, b];
  }
  try {
    bad();
    return 'no error';
  } catch (error) {
    return error.name;
  }
}

export function connect(
  host,
  port = host === 'localhost' ? 5432 : 443,
  url = `${host}:${port}`
) {
  return url;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every omitted default runs, left to right', () => {
  const seen = [];
  const log = spy((letter) => {
    seen.push(letter);
    return letter.toUpperCase();
  });
  eq(order(log)(), ['A', 'B', 'C']);
  eq(seen, ['a', 'b', 'c']);
});

test('a supplied argument skips its default expression', () => {
  const seen = [];
  const log = (letter) => {
    seen.push(letter);
    return letter.toUpperCase();
  };
  eq(order(log)(undefined, 'X'), ['A', 'X', 'C']);
  eq(seen, ['a', 'c'], 'the default for b must never be evaluated');
});

test('null is a value, so it does not trigger a default', () => {
  const log = spy((letter) => letter.toUpperCase());
  eq(order(log)(null), [null, 'B', 'C']);
  eq(log.calls, [['b'], ['c']]);
});

test('the defaults are re-evaluated on every call', () => {
  const log = spy((letter) => letter);
  const f = order(log);
  f();
  f();
  eq(log.callCount, 6);
});

test('a default that reads a later parameter hits the dead zone', () => {
  eq(tdzProbe(), 'ReferenceError');
});

test('connect chains one default into the next', () => {
  eq(connect('localhost'), 'localhost:5432');
  eq(connect('api.io'), 'api.io:443');
});

test('an explicit port feeds the url default', () => {
  eq(connect('api.io', 8080), 'api.io:8080');
});

test('an explicit url wins, and undefined still defaults', () => {
  eq(connect('api.io', 8080, 'cached://api.io'), 'cached://api.io');
  eq(connect('api.io', undefined, undefined), 'api.io:443');
  ok(connect('localhost', undefined) === 'localhost:5432');
});
