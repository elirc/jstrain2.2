// ─────────────────────────────────────────────────────────────────────────
//  14 · cold rebuild · boundary search + sliding window    ★★★ stretch
//  concepts: from memory
//  run: node 14-rebuild-search-window.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You built these before — rebuild without looking; then diff against
//  your module-10 solutions (12-first-last-occurrence, 07-longest-unique-
//  substring). These two are the most-fumbled patterns in the set: the
//  off-by-one lives in the first, the moving edge lives in the second.
//
//    firstOccurrence(sorted, target) → index where the run of equal
//                                      values STARTS, or -1
//    lastOccurrence(sorted, target)  → index where it ENDS, or -1
//      Sorted ascending, duplicates allowed. Both must stay O(log n) —
//      a binary search that then walks sideways is O(n) and the last
//      test will catch it.
//
//    longestUnique(text) → LENGTH of the longest run of characters with
//                          no repeats. Contiguous, not a subsequence.
//
//      firstOccurrence([5, 7, 7, 8, 8, 10], 8)  → 3
//      lastOccurrence([5, 7, 7, 8, 8, 10], 8)   → 4
//      longestUnique('pwwkew')                  → 3   ('wke')

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: a big array that counts how often it is indexed ─────────

const BIG = [
  ...new Array(40_000).fill(0),
  ...new Array(20_000).fill(5),
  ...new Array(40_000).fill(9),
];

const counted = (array) => {
  let reads = 0;
  const proxy = new Proxy(array, {
    get(target, prop) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) reads += 1;
      return target[prop];
    },
  });
  return { proxy, reads: () => reads };
};

export function firstOccurrence(sorted, target) {
  throw new Error('TODO');
}

export function lastOccurrence(sorted, target) {
  throw new Error('TODO');
}

export function longestUnique(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('search · finds both ends of a run', () => {
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 8), 3);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 8), 4);
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 5), 0);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 10), 5);
});

test('search · returns -1 when the target is absent', () => {
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 6), -1);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 6), -1);
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 99), -1);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 0), -1);
});

test('search · handles all-one-value arrays and single elements', () => {
  eq(firstOccurrence([2, 2, 2, 2], 2), 0);
  eq(lastOccurrence([2, 2, 2, 2], 2), 3);
  eq(firstOccurrence([2], 2), 0);
  eq(lastOccurrence([2], 2), 0);
  eq(firstOccurrence([2], 3), -1);
});

test('search · handles the empty array', () => {
  eq(firstOccurrence([], 1), -1);
  eq(lastOccurrence([], 1), -1);
});

test('search · stays O(log n) on 100 000 elements', () => {
  const { proxy, reads } = counted(BIG);
  eq(firstOccurrence(proxy, 5), 40_000);
  eq(lastOccurrence(proxy, 5), 59_999);
  ok(reads() < 200, `read the array ${reads()} times — that is a walk`);
});

test('window · finds the longest repeat-free run', () => {
  eq(longestUnique('abcabcbb'), 3);
  eq(longestUnique('bbbbb'), 1);
  eq(longestUnique('pwwkew'), 3);
});

test('window · the left edge never drags backwards', () => {
  eq(longestUnique('abba'), 2);
  eq(longestUnique('tmmzuxt'), 5);
});

test('window · empty, single character, and a late repeat', () => {
  eq(longestUnique(''), 0);
  eq(longestUnique('a'), 1);
  eq(longestUnique('dvdf'), 3);
  eq(longestUnique('abcdef'), 6);
});
