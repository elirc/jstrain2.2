// ─────────────────────────────────────────────────────────────────────────
//  14 · cold rebuild · boundary search + sliding window — SOLUTION
//                                                          ★★★ stretch
//  run: node 14-rebuild-search-window.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — two patterns, two invariants.
//
//  Boundary binary search: plain binary search lands SOMEWHERE inside the
//  run and cannot tell you where the run starts. The fix is one line —
//  when you hit the target, RECORD the index and keep halving on the side
//  you still care about (left for first, right for last) instead of
//  returning. `found` carries the best answer seen so far, so the loop
//  can finish empty-handed and return -1. Walking sideways from a hit
//  looks fine on `[5,7,7,8,8,10]` and is O(n) on a 20 000-wide run — the
//  read-counting test exists to catch exactly that.
//  Write the loop as `while (lo <= hi)` with `hi = mid - 1` / `lo = mid +
//  1`; `while (lo < hi)` needs a different mid rounding and is where the
//  off-by-one infinite loop comes from.
//
//  Sliding window: `left` and `right` both only ever move RIGHT — that is
//  what makes it O(n). `lastSeen` maps a character to the index after it,
//  so on a repeat you jump `left` forward. `Math.max` is the whole trick:
//  a repeat that sits OUTSIDE the current window ('abba' at the final
//  'a', 'dvdf' at the second 'd') must not drag `left` backwards, which
//  would re-admit characters you already dropped and overcount.

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
  let lo = 0;
  let hi = sorted.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = sorted[mid];
    if (value === target) {
      found = mid;
      hi = mid - 1; // a match may still lie further left
    } else if (value < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function lastOccurrence(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = sorted[mid];
    if (value === target) {
      found = mid;
      lo = mid + 1; // a match may still lie further right
    } else if (value < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function longestUnique(text) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < text.length; right += 1) {
    const ch = text[right];
    if (lastSeen.has(ch)) {
      left = Math.max(left, lastSeen.get(ch) + 1); // never move left back
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
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
