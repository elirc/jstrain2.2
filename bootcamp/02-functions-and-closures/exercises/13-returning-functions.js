// ─────────────────────────────────────────────────────────────────────────
//  13 · functions that return functions                    ★☆☆ warm-up
//  concepts: higher-order functions · factories
//  run: node 13-returning-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A factory takes the configuration and hands back a ready-to-use
//  function. The configuration lives on in the closure, so the returned
//  function is tiny and fits straight into map/filter.
//
//      const double = multiplierOf(2);
//      double(5)                         → 10
//      [1, 2, 3].map(multiplierOf(3))    → [3, 6, 9]
//
//      prefixer('DEBUG')('starting')     → 'DEBUG starting'
//      prefixer('v', '')('2.1')          → 'v2.1'
//
//      const name = propertyGetter('name');
//      name({ name: 'Ada' })             → 'Ada'

import { test, eq, ok } from '../../_lib/check.js';

export function multiplierOf(factor) {
  throw new Error('TODO');
}

export function prefixer(prefix, separator = ' ') {
  throw new Error('TODO');
}

export function propertyGetter(key) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('multiplierOf returns a multiplying function', () => {
  const double = multiplierOf(2);
  ok(typeof double === 'function');
  eq(double(5), 10);
  eq(double(0), 0);
});

test('every multiplier remembers its own factor', () => {
  const double = multiplierOf(2);
  const triple = multiplierOf(3);
  eq(double(4), 8);
  eq(triple(4), 12);
  eq(double(4), 8);
});

test('a multiplier drops straight into map', () => {
  eq([1, 2, 3].map(multiplierOf(3)), [3, 6, 9]);
});

test('prefixer joins with a space by default', () => {
  const debug = prefixer('DEBUG');
  eq(debug('starting'), 'DEBUG starting');
  eq(debug('done'), 'DEBUG done');
});

test('prefixer accepts a custom separator', () => {
  eq(prefixer('v', '')('2.1'), 'v2.1');
  eq(prefixer('a', '-')('b'), 'a-b');
});

test('propertyGetter reads one key out of any object', () => {
  const name = propertyGetter('name');
  eq(name({ name: 'Ada', age: 36 }), 'Ada');
  eq(name({ name: 'Grace' }), 'Grace');
});

test('propertyGetter is a ready-made map callback', () => {
  const users = [{ id: 1 }, { id: 2 }, { id: 3 }];
  eq(users.map(propertyGetter('id')), [1, 2, 3]);
  eq(propertyGetter('missing')({}), undefined);
});
