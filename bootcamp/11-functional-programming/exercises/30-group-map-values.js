// ─────────────────────────────────────────────────────────────────────────
//  30 · group, then map the values                           ★☆☆ warm-up
//  concepts: reduce · dictionaries · small composable steps
//  run: node 30-group-map-values.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Most reporting code is the same two moves: put the rows into buckets,
//  then turn each bucket into one number. Write the two moves once and
//  every report after that is a two-line pipeline.
//
//      groupBy(sales, (s) => s.region)
//        → { north: [row, row], south: [row], ... }     arrays, in order
//          keys in first-seen order, rows in their original order
//
//      mapValues({ north: [a, b] }, (list) => list.length)
//        → { north: 2 }                                 same keys, new values
//
//      countByCategory(sales)  → { north: 2, south: 2, east: 1 }
//      totalByCategory(sales)  → { north: 165, south: 100, east: 200 }
//
//  The last two are `mapValues` over a `groupBy` on `row.region` — no
//  loops of your own. Nothing here may change the rows it was given.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const sales = deepFreeze([
  { region: 'north', rep: 'Ada', amount: 120 },
  { region: 'south', rep: 'Bo', amount: 80 },
  { region: 'north', rep: 'Cy', amount: 45 },
  { region: 'south', rep: 'Ada', amount: 20 },
  { region: 'east', rep: 'Bo', amount: 200 },
]);

export function groupBy(items, keyFn) {
  throw new Error('TODO');
}

export function mapValues(obj, fn) {
  throw new Error('TODO');
}

export function countByCategory(items) {
  throw new Error('TODO');
}

export function totalByCategory(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('groupBy buckets the rows, keeping their order', () => {
  const byRegion = groupBy(sales, (s) => s.region);
  eq(Object.keys(byRegion), ['north', 'south', 'east']);
  eq(byRegion.north.map((s) => s.rep), ['Ada', 'Cy']);
  eq(byRegion.east.length, 1);
});

test('the key is whatever keyFn returns', () => {
  const bySize = groupBy(sales, (s) => (s.amount >= 100 ? 'big' : 'small'));
  eq(bySize.big.map((s) => s.rep), ['Ada', 'Bo']);
  eq(bySize.small.length, 3);
});

test('grouping nothing gives an empty object', () => {
  eq(groupBy([], (s) => s.region), {});
});

test('mapValues keeps every key and replaces every value', () => {
  eq(mapValues({ a: [1, 2], b: [3] }, (list) => list.length), { a: 2, b: 1 });
  eq(mapValues({}, (v) => v), {});
});

test('mapValues leaves the object it was given alone', () => {
  const source = deepFreeze({ a: [1, 2] });
  const next = mapValues(source, (list) => list.length);
  eq(source, { a: [1, 2] });
  ok(next !== source, 'a new object');
});

test('countByCategory counts the rows per region', () => {
  eq(countByCategory(sales), { north: 2, south: 2, east: 1 });
});

test('totalByCategory adds the amounts per region', () => {
  eq(totalByCategory(sales), { north: 165, south: 100, east: 200 });
  eq(totalByCategory([]), {});
});

test('the rows survive both reports untouched', () => {
  countByCategory(sales);
  totalByCategory(sales);
  eq(sales[0], { region: 'north', rep: 'Ada', amount: 120 });
  eq(sales.length, 5);
});
