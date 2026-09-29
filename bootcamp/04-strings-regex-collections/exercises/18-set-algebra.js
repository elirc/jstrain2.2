// ─────────────────────────────────────────────────────────────────────────
//  18 · set algebra                                             ★★☆ core
//  concepts: Set · union · intersection · difference · subset
//  run: node 18-set-algebra.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Permission checks, tag filters and diffing two lists are all set
//  algebra. Build the four operations by hand — they are three lines
//  each, and knowing why they work beats memorizing method names.
//
//      union(new Set([1, 2]), new Set([2, 3]))         → Set {1, 2, 3}
//      intersection(new Set([1, 2]), new Set([2, 3]))  → Set {2}
//      difference(new Set([1, 2]), new Set([2, 3]))    → Set {1}
//      isSubset(new Set([1]), new Set([1, 2]))         → true
//
//  All four take Sets; the first three RETURN a new Set and must not
//  modify their arguments. difference(a, b) means "in a but not in b" —
//  it is not symmetric. The empty set is a subset of everything.
//
//  hint: new Set([...a, ...b]) for union; [...a].filter(...) plus new
//  Set() for the others. (Node 22 ships a.union(b) etc. natively — write
//  them yourself first, then look them up in the README.)

import { test, eq } from '../../_lib/check.js';

export function union(a, b) {
  throw new Error('TODO');
}

export function intersection(a, b) {
  throw new Error('TODO');
}

export function difference(a, b) {
  throw new Error('TODO');
}

export function isSubset(a, b) {
  throw new Error('TODO');
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
