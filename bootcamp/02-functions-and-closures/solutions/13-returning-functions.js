// ─────────────────────────────────────────────────────────────────────────
//  13 · functions that return functions — SOLUTION         ★☆☆ warm-up
//  run: node 13-returning-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each factory is one line because the closure does the
//  remembering. Note what this buys you at the call site: `.map(u =>
//  u.id)` becomes `.map(propertyGetter('id'))`, and the configuration
//  (factor, prefix, key) is fixed once instead of being repeated in every
//  callback. This is the shape currying and partial application
//  generalise later in the module.

import { test, eq, ok } from '../../_lib/check.js';

export function multiplierOf(factor) {
  return (value) => value * factor;
}

export function prefixer(prefix, separator = ' ') {
  return (text) => `${prefix}${separator}${text}`;
}

export function propertyGetter(key) {
  return (object) => object[key];
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
