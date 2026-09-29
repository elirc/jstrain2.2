// ─────────────────────────────────────────────────────────────────────────
//  15 · Map basics                                          ★☆☆ warm-up
//  concepts: Map · key identity · insertion order · Object.fromEntries
//  run: node 15-map-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A plain object stringifies its keys: obj[1] and obj['1'] are the SAME
//  slot, and obj[someObject] becomes the key '[object Object]'. A Map
//  keeps keys as they are (compared by identity), remembers insertion
//  order, and tells you its .size.
//
//      buildMap([[user, 'admin']]).get(user)  → 'admin'
//      buildMap([[1, 'num'], ['1', 'str']]).size  → 2
//      mapToObject(new Map([['a', 1]]))       → { a: 1 }
//      objectToMap({ x: 1 }).get('x')         → 1
//
//  buildMap takes an array of [key, value] pairs. mapToObject and
//  objectToMap convert in both directions (string keys only, of course —
//  that is the whole point of the object side).

import { test, eq } from '../../_lib/check.js';

export function buildMap(pairs) {
  throw new Error('TODO');
}

export function mapToObject(map) {
  throw new Error('TODO');
}

export function objectToMap(obj) {
  throw new Error('TODO');
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
