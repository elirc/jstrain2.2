// ─────────────────────────────────────────────────────────────────────────
//  32 · reduce into a Map — SOLUTION                       ★★☆ core
//  run: node 32-reduce-into-a-map.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the fold is identical to the object version — only the
//  accessors change: `get`/`set` instead of `[]`, `has` instead of `in`.
//  What you buy is real keys (numbers stay numbers, objects can BE keys)
//  and immunity to the prototype: the object version of this grouping,
//  written as `bucket[key] ??= []`, explodes on a key named `constructor`
//  because `obj.constructor` is inherited and therefore not nullish, so
//  `??=` leaves it alone and `.push` lands on a function. `mapToObject` is
//  the escape hatch for JSON — and it is lossy, because `JSON.stringify`
//  of a Map is `{}` and every key that comes out of `fromEntries` is a
//  string again.

import { test, eq, ok } from '../../_lib/check.js';

const READINGS = Object.freeze([
  Object.freeze({ station: 3,  tempC: 12.5, mm: 0 }),
  Object.freeze({ station: 7,  tempC: 18.0, mm: 2 }),
  Object.freeze({ station: 3,  tempC: 14.0, mm: 1 }),
  Object.freeze({ station: 12, tempC: 9.5,  mm: 5 }),
  Object.freeze({ station: 7,  tempC: 17.5, mm: 0 }),
]);

export function groupToMap(items, keyOf) {
  return items.reduce((map, item) => {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket === undefined) map.set(key, [item]);
    else bucket.push(item);
    return map;
  }, new Map());
}

export function sumToMap(items, keyOf, valueOf) {
  return items.reduce((map, item) => {
    const key = keyOf(item);
    return map.set(key, (map.get(key) ?? 0) + valueOf(item));
  }, new Map());
}

export function mapToObject(map) {
  return Object.fromEntries(map);
}

// ──────────────────────────── tests ──────────────────────────────────────

const stationOf = (r) => r.station;

test('the keys stay numbers, they are not stringified', () => {
  const grouped = groupToMap(READINGS, stationOf);
  ok(grouped.has(3));
  ok(!grouped.has('3'));
});

test('each key collects its readings in source order', () => {
  const grouped = groupToMap(READINGS, stationOf);
  eq(grouped.get(3).map((r) => r.tempC), [12.5, 14]);
  eq(grouped.get(7).length, 2);
});

test('size counts distinct keys, and keys keep first-seen order', () => {
  const grouped = groupToMap(READINGS, stationOf);
  eq(grouped.size, 3);
  eq([...grouped.keys()], [3, 7, 12]);
});

test('a key called constructor is just a key in a Map', () => {
  const grouped = groupToMap(
    [{ tag: 'constructor' }, { tag: 'toString' }, { tag: 'constructor' }],
    (r) => r.tag
  );
  eq(grouped.size, 2);
  eq(grouped.get('constructor').length, 2);
});

test('sumToMap totals the rainfall per station', () => {
  const totals = sumToMap(READINGS, stationOf, (r) => r.mm);
  eq([...totals], [[3, 1], [7, 2], [12, 5]]);
});

test('sumToMap of an empty list is an empty Map', () => {
  eq(sumToMap([], stationOf, (r) => r.mm).size, 0);
});

test('mapToObject stringifies the keys on the way out', () => {
  const totals = sumToMap(READINGS, stationOf, (r) => r.mm);
  eq(mapToObject(totals), { 3: 1, 7: 2, 12: 5 });
  eq(Object.keys(mapToObject(totals)), ['3', '7', '12']);
});

test('mapToObject of an empty Map is an empty object', () => {
  eq(mapToObject(new Map()), {});
});
