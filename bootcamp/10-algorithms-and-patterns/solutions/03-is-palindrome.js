// ─────────────────────────────────────────────────────────────────────────
//  03 · isPalindrome — SOLUTION                             ★☆☆ warm-up
//  concepts: pattern: two pointers · skipping junk characters
//  run: node 03-is-palindrome.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers (converging) with a skip rule.
//  Walk `left` from the front and `right` from the back. Before comparing,
//  each pointer skips anything that is not alphanumeric. Compare the two
//  characters lowercased; any mismatch means "not a palindrome" and you
//  can bail immediately.
//  Time O(n), space O(1). The naive version builds a cleaned copy and a
//  reversed copy and compares them — also O(n) time but O(n) space, and
//  it always scans the whole string even when character 1 already
//  disagrees. Both are fine answers; say the trade-off out loud.
//  Bite: the inner skip loops need `left < right` guards too, or a string
//  of pure punctuation walks a pointer off the end.

import { test, eq } from '../../_lib/check.js';

const isAlphanumeric = (ch) => /[a-z0-9]/i.test(ch);

export function isPalindrome(text) {
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    while (left < right && !isAlphanumeric(text[left])) left += 1;
    while (left < right && !isAlphanumeric(text[right])) right -= 1;
    if (text[left].toLowerCase() !== text[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('ignores punctuation, spaces and case', () => {
  eq(isPalindrome('A man, a plan, a canal: Panama'), true);
});

test('rejects text that is not a palindrome', () => {
  eq(isPalindrome('race a car'), false);
});

test('handles a longer sentence with mixed case', () => {
  eq(isPalindrome('Was it a car or a cat I saw?'), true);
});

test('treats digits as real characters', () => {
  eq(isPalindrome('1a2!2a1'), true);
  eq(isPalindrome('12a21b'), false);
});

test('empty text and single characters are palindromes', () => {
  eq(isPalindrome(''), true);
  eq(isPalindrome('x'), true);
});

test('a string of pure punctuation is a palindrome', () => {
  eq(isPalindrome('.,;!'), true);
});
