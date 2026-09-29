// ─────────────────────────────────────────────────────────────────────────
//  35 · a multimap: one key, many values — SOLUTION           ★☆☆ warm-up
//  run: node 35-multimap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole pattern is three lines — read the bucket, make
//  one if it is missing, push. `map.get(key) ?? []` is the get-or-create
//  idiom; the set() right after it is what puts a brand-new array into
//  the Map (mutating an array you just created and never stored is the
//  classic wrong turn, and it silently drops every value).
//  Returning the Map from addTo costs nothing and makes the function
//  composable — the same reason Map.prototype.set returns the Map.
//  groupBy is addTo in a loop over a fresh Map, which is why the key
//  order is first-seen order: a Map remembers the order keys were
//  inserted, and re-setting an existing key does not move it.

import { test, eq } from '../../_lib/check.js';

export function addTo(map, key, value) {
  const bucket = map.get(key) ?? [];
  bucket.push(value);
  map.set(key, bucket);
  return map;
}

export function groupBy(items, keyOf) {
  const grouped = new Map();
  for (const item of items) {
    addTo(grouped, keyOf(item), item);
  }
  return grouped;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('addTo creates the array on the first value', () => {
  const m = new Map();
  addTo(m, 'fruit', 'apple');
  eq(m.get('fruit'), ['apple']);
});

test('addTo appends to an array that already exists', () => {
  const m = new Map();
  addTo(m, 'fruit', 'apple');
  addTo(m, 'fruit', 'pear');
  eq(m.get('fruit'), ['apple', 'pear']);
  eq(m.size, 1);
});

test('addTo keeps duplicate values', () => {
  const m = new Map();
  addTo(m, 'x', 1);
  addTo(m, 'x', 1);
  eq(m.get('x'), [1, 1]);
});

test('addTo returns the same Map, so calls chain', () => {
  const m = new Map();
  eq(addTo(m, 'a', 1), m);
  addTo(addTo(m, 'b', 2), 'b', 3);
  eq(m.get('b'), [2, 3]);
});

test('addTo keeps a number key a number', () => {
  const m = new Map();
  addTo(m, 1, 'one');
  addTo(m, '1', 'text one');
  eq(m.size, 2);
  eq(m.get(1), ['one']);
});

test('groupBy collects the items each key produced', () => {
  eq(
    groupBy(['ant', 'bee', 'ape'], (w) => w[0]),
    new Map([
      ['a', ['ant', 'ape']],
      ['b', ['bee']],
    ])
  );
});

test('groupBy keeps the keys in first-seen order', () => {
  const grouped = groupBy([3, 1, 4, 1, 5], (n) => (n % 2 === 0 ? 'even' : 'odd'));
  eq([...grouped.keys()], ['odd', 'even']);
  eq(grouped.get('odd'), [3, 1, 1, 5]);
});

test('groupBy of nothing is an empty Map', () => {
  eq(groupBy([], (x) => x).size, 0);
});
