// ─────────────────────────────────────────────────────────────────────────
//  30 · group, then map the values — SOLUTION                ★☆☆ warm-up
//  run: node 30-group-map-values.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `groupBy` builds a fresh accumulator and fills it in — the
//  one place a "mutable" reduce is fine, because the object it writes to
//  was created by this call and nobody else can see it. What it must not
//  do is touch the ROWS, and it does not: each bucket holds the original
//  row objects by reference.
//  `mapValues` is entries → map → fromEntries, which is the standard way
//  to transform an object without a loop, and it is where the report logic
//  lives: count the bucket, total the bucket, take the biggest of the
//  bucket. Once both exist, every report is `mapValues(groupBy(...), ...)`
//  and reads as one sentence.
//  Note `Object.groupBy` (Node 21+) does this natively — but it returns an
//  object with a NULL prototype, so `result.hasOwnProperty` blows up and a
//  deep-equal against a plain `{}` literal fails. Handy, with a footnote.

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
  return items.reduce((buckets, item) => {
    const key = keyFn(item);
    buckets[key] = buckets[key] ? [...buckets[key], item] : [item];
    return buckets;
  }, {});
}

export function mapValues(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value)])
  );
}

export function countByCategory(items) {
  return mapValues(groupBy(items, (row) => row.region), (rows) => rows.length);
}

export function totalByCategory(items) {
  return mapValues(groupBy(items, (row) => row.region), (rows) =>
    rows.reduce((total, row) => total + row.amount, 0)
  );
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
