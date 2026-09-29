// ─────────────────────────────────────────────────────────────────────────
//  35 · top N by field — SOLUTION                          ★★☆ core
//  run: node 35-top-n-by.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `toSorted` is `[...items].sort()` with a shorter name — it
//  is the copying version, so a frozen input survives. The comparator is
//  `valueOf(b) - valueOf(a)` for descending; note that it returns 0 for a
//  tie, which is what lets the engine's stable sort keep KX2 ahead of KX3.
//  Write it as `(a, b) => valueOf(a) < valueOf(b)` and you return booleans,
//  which coerce to 1/0 — "b first" becomes unsayable and the order goes
//  quietly wrong. `topByWithin` is grouping plus the function you already
//  wrote; resist inlining a second sort in there. For a genuinely large
//  list, a partial selection beats a full sort (O(n log k) with a heap),
//  but sort-then-slice is the right first answer and the one to say out
//  loud before you optimise.

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
  return items.toSorted((a, b) => valueOf(b) - valueOf(a)).slice(0, n);
}

export function bottomBy(items, valueOf, n) {
  return items.toSorted((a, b) => valueOf(a) - valueOf(b)).slice(0, n);
}

export function topByWithin(items, groupOf, valueOf, n) {
  const groups = items.reduce((acc, item) => {
    (acc[groupOf(item)] ??= []).push(item);
    return acc;
  }, {});
  return Object.fromEntries(
    Object.entries(groups).map(([key, group]) => [key, topBy(group, valueOf, n)])
  );
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
