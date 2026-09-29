// ─────────────────────────────────────────────────────────────────────────
//  18 · set algebra — SOLUTION                                  ★★☆ core
//  run: node 18-set-algebra.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each operation is "spread to an array, filter, collect
//  back into a Set". Building a NEW Set every time is what keeps the
//  arguments untouched — a.add(x) in a loop would mutate the caller's
//  set, which is the classic wrong turn here.
//  difference reads "in a but not in b", so it filters a by
//  !b.has(x): swapping the arguments gives a different answer, and that
//  asymmetry is the point of the test.
//  isSubset is every() and needs no new Set at all; the empty set passes
//  because every() on nothing is true (vacuous truth).
//  Node 22 ships these natively — a.union(b), a.intersection(b),
//  a.difference(b), a.isSubsetOf(b) — with the same semantics.

import { test, eq } from '../../_lib/check.js';

export function union(a, b) {
  return new Set([...a, ...b]);
}

export function intersection(a, b) {
  return new Set([...a].filter((value) => b.has(value)));
}

export function difference(a, b) {
  return new Set([...a].filter((value) => !b.has(value)));
}

export function isSubset(a, b) {
  return [...a].every((value) => b.has(value));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('union holds every member of both, without duplicates', () => {
  eq(union(new Set([1, 2]), new Set([2, 3])), new Set([1, 2, 3]));
  eq(union(new Set(['a']), new Set(['a'])).size, 1);
});

test('union does not modify its arguments', () => {
  const a = new Set([1]);
  union(a, new Set([2]));
  eq(a, new Set([1]));
});

test('intersection keeps only shared members', () => {
  eq(intersection(new Set([1, 2, 3]), new Set([2, 3, 4])), new Set([2, 3]));
});

test('intersection of disjoint sets is empty', () => {
  eq(intersection(new Set([1]), new Set([2])).size, 0);
});

test('difference keeps members of a that are missing from b', () => {
  eq(difference(new Set([1, 2]), new Set([2, 3])), new Set([1]));
});

test('difference is not symmetric', () => {
  const a = new Set([1, 2]);
  const b = new Set([2, 3]);
  eq(difference(b, a), new Set([3]));
});

test('isSubset is true when every member of a is in b', () => {
  eq(isSubset(new Set([1]), new Set([1, 2])), true);
  eq(isSubset(new Set([1, 2]), new Set([1, 2])), true);
});

test('isSubset is false when one member is missing, true when empty', () => {
  eq(isSubset(new Set([1, 9]), new Set([1, 2])), false);
  eq(isSubset(new Set(), new Set([1])), true);
});
