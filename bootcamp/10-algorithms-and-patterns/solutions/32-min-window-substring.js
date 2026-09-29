// ─────────────────────────────────────────────────────────────────────────
//  32 · minWindow — SOLUTION                                ★★★ stretch
//  concepts: pattern: variable sliding window · need-map + missing counter
//  run: node 32-min-window-substring.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: variable-size sliding window, "grow to become
//  VALID, shrink while still valid" (same skeleton as exercise 08, with a
//  richer validity test).
//  Smell: "shortest contiguous stretch that CONTAINS all of X".
//  `need` starts as the needle's character counts and goes NEGATIVE for
//  surplus characters — that is the trick that makes shrinking cheap.
//  `missing` counts characters still owed; it only changes when a count
//  crosses zero. missing === 0 means the window is a cover, so record it
//  and start evicting from the left.
//  Time O(n + m) — each index enters and leaves once. Space O(m).
//  The naive version tries all O(n²) substrings and checks each one:
//  O(n³), or O(n² · m) with a per-substring frequency count.
//  Bites: only touch `missing` when the count crosses 0 (a surplus 'A'
//  must not pay off the debt twice), and seed `best` with '' rather than
//  a length so "no cover found" stays distinguishable.

import { test, eq } from '../../_lib/check.js';

export function minWindow(text, needle) {
  if (needle.length === 0 || text.length < needle.length) return '';
  const need = new Map();
  for (const ch of needle) need.set(ch, (need.get(ch) ?? 0) + 1);

  let missing = needle.length;
  let best = '';
  let left = 0;
  for (let right = 0; right < text.length; right += 1) {
    const entering = text[right];
    if (need.has(entering)) {
      if (need.get(entering) > 0) missing -= 1; // a debt, not a surplus
      need.set(entering, need.get(entering) - 1);
    }
    while (missing === 0) {
      if (best === '' || right - left + 1 < best.length) {
        best = text.slice(left, right + 1);
      }
      const leaving = text[left];
      if (need.has(leaving)) {
        need.set(leaving, need.get(leaving) + 1);
        if (need.get(leaving) > 0) missing += 1; // back into debt
      }
      left += 1;
    }
  }
  return best;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the shortest cover in the classic input', () => {
  eq(minWindow('ADOBECODEBANC', 'ABC'), 'BANC');
});

test('the characters may appear in any order', () => {
  eq(minWindow('bba', 'ab'), 'ba');
});

test('respects repeated characters in the needle', () => {
  eq(minWindow('a', 'aa'), '');
  eq(minWindow('aab', 'aa'), 'aa');
});

test('returns the whole text when only the whole text covers it', () => {
  eq(minWindow('abc', 'cba'), 'abc');
});

test('returns an empty string when the needle cannot be covered', () => {
  eq(minWindow('abc', 'd'), '');
  eq(minWindow('', 'a'), '');
});

test('an empty needle has no window to find', () => {
  eq(minWindow('abc', ''), '');
});

test('ignores characters that are not in the needle', () => {
  eq(minWindow('xxxxbxxxxaxxxx', 'ab'), 'bxxxxa');
});

test('is case sensitive', () => {
  eq(minWindow('aA', 'A'), 'A');
});
