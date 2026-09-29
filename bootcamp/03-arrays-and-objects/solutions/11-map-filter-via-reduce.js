// ─────────────────────────────────────────────────────────────────────────
//  11 · map and filter, built from reduce — SOLUTION       ★★★ stretch
//  run: node 11-map-filter-via-reduce.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accumulator is the output array; each step either
//  pushes a transformed value (map), pushes conditionally (filter), or
//  folds a boolean (some). Mutating the accumulator you own is fine and
//  fast — the array was created by the reduce call, so nobody else can see
//  it. The one thing reduce cannot do is stop early: `someWith` still walks
//  the whole list even after the answer is known, which is exactly why
//  `some` exists as its own method. Note the seed `false` gives the correct
//  vacuous answer for an empty list.

import { test, eq, ok } from '../../_lib/check.js';

export function mapWith(items, fn) {
  return items.reduce((out, item, i) => {
    out.push(fn(item, i));
    return out;
  }, []);
}

export function filterWith(items, predicate) {
  return items.reduce((out, item, i) => {
    if (predicate(item, i)) out.push(item);
    return out;
  }, []);
}

export function someWith(items, predicate) {
  return items.reduce((found, item, i) => found || predicate(item, i), false);
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
