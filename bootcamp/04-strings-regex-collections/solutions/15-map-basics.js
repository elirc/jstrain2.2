// ─────────────────────────────────────────────────────────────────────────
//  15 · Map basics — SOLUTION                               ★☆☆ warm-up
//  run: node 15-map-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the Map constructor already takes an array of [key,
//  value] pairs, and Object.entries produces exactly that shape — so both
//  conversions are one call each, with Object.fromEntries closing the
//  loop the other way.
//  What the tests are really teaching: a Map compares keys by identity
//  (SameValueZero), so 1 and '1' are two keys and two distinct-but-equal
//  objects are two keys. A plain object would have stringified both of
//  those into one slot ('1' and '[object Object]'). Maps also keep
//  insertion order for every key type, while an object silently sorts
//  integer-like keys ahead of the rest.

import { test, eq } from '../../_lib/check.js';

export function buildMap(pairs) {
  return new Map(pairs);
}

export function mapToObject(map) {
  return Object.fromEntries(map);
}

export function objectToMap(obj) {
  return new Map(Object.entries(obj));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('buildMap looks values up by object identity', () => {
  const ada = { name: 'Ada' };
  const bob = { name: 'Bob' };
  const roles = buildMap([
    [ada, 'admin'],
    [bob, 'guest'],
  ]);
  eq(roles.get(ada), 'admin');
  eq(roles.get(bob), 'guest');
});

test('a look-alike object is a different key', () => {
  const ada = { name: 'Ada' };
  const roles = buildMap([[ada, 'admin']]);
  eq(roles.get({ name: 'Ada' }), undefined);
});

test('the number 1 and the string "1" are different keys', () => {
  const m = buildMap([
    [1, 'num'],
    ['1', 'str'],
  ]);
  eq(m.get(1), 'num');
  eq(m.get('1'), 'str');
  eq(m.size, 2);
});

test('a Map remembers insertion order, even for numeric keys', () => {
  eq(
    [...buildMap([
      [2, 'two'],
      [1, 'one'],
    ]).keys()],
    [2, 1]
  );
});

test('mapToObject converts string-keyed entries', () => {
  eq(mapToObject(new Map([['a', 1], ['b', 2]])), { a: 1, b: 2 });
});

test('mapToObject of an empty Map is an empty object', () => {
  eq(mapToObject(new Map()), {});
});

test('objectToMap gives a real Map with a size', () => {
  const m = objectToMap({ a: 1, b: 2 });
  eq(m.size, 2);
  eq(m.get('b'), 2);
});

test('the two conversions round-trip', () => {
  eq(mapToObject(objectToMap({ x: 1, y: 2 })), { x: 1, y: 2 });
});
