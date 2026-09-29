// ─────────────────────────────────────────────────────────────────────────
//  03 · isPalindrome                                        ★☆☆ warm-up
//  concepts: pattern: two pointers · skipping junk characters
//  run: node 03-is-palindrome.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Does the text read the same forwards and backwards, ignoring case and
//  anything that is not a letter or a digit?
//
//      isPalindrome('A man, a plan, a canal: Panama')  → true
//      isPalindrome('race a car')                      → false
//      isPalindrome('')                                → true
//
//  Empty text and single characters are palindromes.

import { test, eq } from '../../_lib/check.js';

export function isPalindrome(text) {
  throw new Error('TODO');
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
