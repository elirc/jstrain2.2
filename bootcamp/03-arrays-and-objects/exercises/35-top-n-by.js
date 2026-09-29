// ─────────────────────────────────────────────────────────────────────────
//  35 · top N by field                                     ★★☆ core
//  concepts: toSorted · stable ties · top N per group
//  run: node 35-top-n-by.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Wettest three stations" is one line. "Wettest two stations IN EACH
//  region" is the version that shows up in the report nobody can write —
//  and it is the same line, run once per bucket.
//
//      topBy(STATIONS, s => s.rainMm, 3)      → KX2, KX3, KX5
//      bottomBy(STATIONS, s => s.rainMm, 3)   → KX4, KX6, KX1
//      topByWithin(STATIONS, s => s.region, s => s.rainMm, 2)
//        → { coast: [KX3, KX5], inland: [KX2, KX6] }
//
//  Equal values keep their original order — `sort` is stable, so you get
//  that for free as long as your comparator returns 0 for ties.
//
//  hint: `toSorted` copies before it sorts. `slice(0, n)` is already safe
//  when `n` is bigger than the array.

import { test, eq } from '../../_lib/check.js';

const STATIONS = Object.freeze([
  Object.freeze({ code: 'KX1', region: 'coast',  rainMm: 42 }),
  Object.freeze({ code: 'KX2', region: 'inland', rainMm: 91 }),
  Object.freeze({ code: 'KX3', region: 'coast',  rainMm: 91 }),
  Object.freeze({ code: 'KX4', region: 'inland', rainMm: 12 }),
  Object.freeze({ code: 'KX5', region: 'coast',  rainMm: 60 }),
  Object.freeze({ code: 'KX6', region: 'inland', rainMm: 33 }),
]);

const rainOf = (s) => s.rainMm;
const regionOf = (s) => s.region;
const codes = (list) => list.map((s) => s.code);

export function topBy(items, valueOf, n) {
  throw new Error('TODO');
}

export function bottomBy(items, valueOf, n) {
  throw new Error('TODO');
}

export function topByWithin(items, groupOf, valueOf, n) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('topBy returns the n biggest, biggest first', () => {
  eq(codes(topBy(STATIONS, rainOf, 3)), ['KX2', 'KX3', 'KX5']);
});

test('stations tied on rainfall keep their source order', () => {
  eq(codes(topBy(STATIONS, rainOf, 2)), ['KX2', 'KX3']);
});

test('asking for more than there is returns everything', () => {
  eq(topBy(STATIONS, rainOf, 99).length, 6);
});

test('asking for none returns none', () => {
  eq(topBy(STATIONS, rainOf, 0), []);
});

test('the frozen list is never reordered', () => {
  topBy(STATIONS, rainOf, 3);
  bottomBy(STATIONS, rainOf, 3);
  eq(codes(STATIONS), ['KX1', 'KX2', 'KX3', 'KX4', 'KX5', 'KX6']);
});

test('bottomBy returns the n smallest, smallest first', () => {
  eq(codes(bottomBy(STATIONS, rainOf, 3)), ['KX4', 'KX6', 'KX1']);
});

test('topByWithin ranks inside each group', () => {
  const best = topByWithin(STATIONS, regionOf, rainOf, 2);
  eq(codes(best.coast), ['KX3', 'KX5']);
  eq(codes(best.inland), ['KX2', 'KX6']);
});

test('a group with fewer than n members returns what it has', () => {
  const best = topByWithin(STATIONS, regionOf, rainOf, 10);
  eq(best.coast.length, 3);
  eq(Object.keys(best), ['coast', 'inland']);
});
