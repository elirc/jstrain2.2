// ─────────────────────────────────────────────────────────────────────────
//  38 · the order defaults run in                          ★★☆ core
//  concepts: defaults · evaluation order · TDZ
//  run: node 38-default-evaluation-order.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Defaults are expressions, evaluated left to right, only for the
//  arguments you left out, on every single call. Prove all of it.
//
//  `order(log)` returns a three-parameter function whose defaults each
//  call `log` with their own letter and use what it returns:
//
//      const f = order(log);
//      f()               → ['A', 'B', 'C']   log ran for 'a', 'b', 'c'
//      f(undefined, 'X') → ['A', 'X', 'C']   log never ran for 'b'
//
//  `tdzProbe()` calls a function whose first default reads the parameter to
//  its RIGHT — `function bad(a = b, b = 2)` — and reports the `name` of the
//  error that comes out (`'no error'` if nothing throws).
//
//  `connect(host, port, url)` chains its defaults: the port is 5432 for
//  'localhost' and 443 otherwise, and the url is `host:port`. It returns
//  the url.
//
//      connect('localhost')          → 'localhost:5432'
//      connect('api.io')             → 'api.io:443'
//      connect('api.io', 8080)       → 'api.io:8080'
//
//  hint: a default can use any parameter to its LEFT — that is the whole
//  reason the order is defined

import { test, eq, ok, spy } from '../../_lib/check.js';

export function order(log) {
  throw new Error('TODO');
}

export function tdzProbe() {
  throw new Error('TODO');
}

export function connect(host, port, url) {
  throw new Error('TODO');
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
