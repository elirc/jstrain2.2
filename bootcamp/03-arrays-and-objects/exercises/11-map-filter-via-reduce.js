// ─────────────────────────────────────────────────────────────────────────
//  11 · map and filter, built from reduce                  ★★★ stretch
//  concepts: reduce · reimplementing built-ins
//  run: node 11-map-filter-via-reduce.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The interview classic: reduce is the general fold, and map/filter/some
//  are special cases of it. Build all three WITHOUT calling map, filter,
//  some, forEach or a for-loop — reduce only.
//
//      mapWith([1, 2, 3], (n) => n * 2)          → [2, 4, 6]
//      mapWith(['a', 'b'], (x, i) => `${i}${x}`) → ['0a', '1b']
//      filterWith([1, 2, 3, 4], (n) => n % 2)    → [1, 3]
//      someWith([1, 3], (n) => n > 2)            → true
//      someWith([], (n) => true)                 → false
//
//  The callbacks take (item, index), same as the real thing.
//
//  hint: `out.push(x); return out;` beats `return [...out, x]` — the spread
//  version copies the whole array on every step, turning an O(n) walk into
//  O(n²).

import { test, eq, ok } from '../../_lib/check.js';

export function mapWith(items, fn) {
  throw new Error('TODO');
}

export function filterWith(items, predicate) {
  throw new Error('TODO');
}

export function someWith(items, predicate) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapWith transforms every element', () => {
  eq(mapWith([1, 2, 3], (n) => n * 2), [2, 4, 6]);
});

test('mapWith passes the index as the second argument', () => {
  eq(mapWith(['a', 'b'], (x, i) => `${i}${x}`), ['0a', '1b']);
});

test('mapWith of an empty array is an empty array', () => {
  eq(mapWith([], (n) => n), []);
});

test('mapWith never touches the input, even a frozen one', () => {
  const input = Object.freeze([1, 2, 3]);
  eq(mapWith(input, (n) => n + 1), [2, 3, 4]);
  eq(input, [1, 2, 3]);
});

test('filterWith keeps matches in order', () => {
  eq(filterWith([1, 2, 3, 4, 5], (n) => n % 2 === 1), [1, 3, 5]);
});

test('filterWith keeps the original object references', () => {
  const rows = [{ ok: true }, { ok: false }];
  ok(filterWith(rows, (r) => r.ok)[0] === rows[0]);
});

test('someWith answers true on the first match and false otherwise', () => {
  eq(someWith([1, 3, 8], (n) => n > 5), true);
  eq(someWith([1, 3], (n) => n > 5), false);
});

test('someWith of an empty array is false', () => {
  eq(someWith([], () => true), false);
});
