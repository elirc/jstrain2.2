// ─────────────────────────────────────────────────────────────────────────
//  18 · unique · uniqueBy · set ops — SOLUTION             ★★☆ core
//  run: node 18-unique-and-set-ops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `[...new Set(items)]` is the whole of `unique` — Set keeps
//  insertion order and compares with SameValueZero, so NaN dedupes (which
//  an `indexOf`-based version cannot do, since NaN !== NaN). `uniqueBy`
//  needs a Set of KEYS plus a filter, because the items themselves are
//  distinct objects. For the set operations, build the Set from the second
//  list once and filter the first against it: doing `b.includes(x)` inside
//  the filter is the O(n×m) version everyone writes first.

import { test, eq, ok } from '../../_lib/check.js';

const ROWS = Object.freeze([
  { id: 1, team: 'red' },
  { id: 2, team: 'blue' },
  { id: 3, team: 'red' },
  { id: 4, team: 'green' },
]);

export function unique(items) {
  return [...new Set(items)];
}

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function intersection(a, b) {
  const inB = new Set(b);
  return [...new Set(a)].filter((x) => inB.has(x));
}

export function difference(a, b) {
  const inB = new Set(b);
  return [...new Set(a)].filter((x) => !inB.has(x));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('unique keeps the first occurrence, in order', () => {
  eq(unique([1, 2, 2, 3, 1]), [1, 2, 3]);
});

test('unique works on strings and on empty lists', () => {
  eq(unique(['b', 'a', 'b']), ['b', 'a']);
  eq(unique([]), []);
});

test('unique collapses NaN, which indexOf never could', () => {
  eq(unique([NaN, 1, NaN]), [NaN, 1]);
});

test('uniqueBy keeps the first row of each key', () => {
  eq(uniqueBy(ROWS, (r) => r.team).map((r) => r.id), [1, 2, 4]);
});

test('uniqueBy returns the original objects', () => {
  ok(uniqueBy(ROWS, (r) => r.team)[0] === ROWS[0]);
});

test('intersection keeps what both lists have', () => {
  eq(intersection([1, 2, 2, 3], [2, 3, 9]), [2, 3]);
  eq(intersection([1], [2]), []);
});

test('difference removes everything the second list contains', () => {
  eq(difference([1, 2, 2, 3], [2]), [1, 3]);
  eq(difference([], [1]), []);
});

test('neither operation mutates its inputs', () => {
  const a = Object.freeze([1, 2, 3]);
  const b = Object.freeze([2]);
  eq(difference(a, b), [1, 3]);
  eq(a, [1, 2, 3]);
  eq(b, [2]);
});
