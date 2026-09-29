// ─────────────────────────────────────────────────────────────────────────
//  35 · a multimap: one key, many values                     ★☆☆ warm-up
//  concepts: Map of arrays · get-or-create · grouping
//  run: node 35-multimap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Map holds one value per key. When you need many — tags per post,
//  errors per field, people per team — the value becomes an array and
//  every write turns into "get the array, or make one, then push".
//
//      const m = new Map();
//      addTo(m, 'fruit', 'apple');
//      addTo(m, 'fruit', 'pear');
//      m.get('fruit')            → ['apple', 'pear']
//
//      groupBy(['ant', 'bee', 'ape'], (w) => w[0])
//        → Map { 'a' → ['ant', 'ape'], 'b' → ['bee'] }
//
//  addTo mutates the Map it is given and returns it, so calls chain.
//  groupBy builds a fresh Map, keys in first-seen order, duplicates kept.

import { test, eq } from '../../_lib/check.js';

export function addTo(map, key, value) {
  throw new Error('TODO');
}

export function groupBy(items, keyOf) {
  throw new Error('TODO');
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
