// ─────────────────────────────────────────────────────────────────────────
//  32 · reduce into a Map                                  ★★☆ core
//  concepts: Map · non-string keys · prototype-safe grouping
//  run: node 32-reduce-into-a-map.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Weather stations are numbered, not named. Group readings into a plain
//  object and station `3` silently becomes the string `'3'`; group them
//  into a Map and the key stays the number you put in.
//
//      groupToMap(READINGS, r => r.station)      → Map(3 => [ … ], 7 => …)
//      sumToMap(READINGS, r => r.station, r => r.mm)
//                                        → Map(3 => 1, 7 => 2, 12 => 5)
//      mapToObject(someMap)                      → { '3': 1, '7': 2, … }
//
//  A Map keeps insertion order and cannot collide with `toString` or
//  `constructor` the way an object literal can.
//
//  hint: `map.get(key) ?? fallback`, mutate, `map.set(key, next)`, and
//  return the map from every reduce step.

import { test, eq, ok } from '../../_lib/check.js';

const READINGS = Object.freeze([
  Object.freeze({ station: 3,  tempC: 12.5, mm: 0 }),
  Object.freeze({ station: 7,  tempC: 18.0, mm: 2 }),
  Object.freeze({ station: 3,  tempC: 14.0, mm: 1 }),
  Object.freeze({ station: 12, tempC: 9.5,  mm: 5 }),
  Object.freeze({ station: 7,  tempC: 17.5, mm: 0 }),
]);

export function groupToMap(items, keyOf) {
  throw new Error('TODO');
}

export function sumToMap(items, keyOf, valueOf) {
  throw new Error('TODO');
}

export function mapToObject(map) {
  throw new Error('TODO');
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
