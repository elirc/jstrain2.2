// ─────────────────────────────────────────────────────────────────────────
//  26 · palindrome check in O(1) space                      ★★☆ core
//  concepts: two pointers · in-place reverse · restore
//  run: node 26-linked-list-palindrome.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Does the chain read the same forwards and backwards? A linked list only
//  goes one way, so you cannot walk it from the back — and copying the
//  values into an array doubles the memory of the thing you are checking.
//
//      isPalindrome(chain('r', 'a', 'r'))     → true
//      isPalindrome(chain(1, 2, 2, 1))        → true
//      isPalindrome(chain(1, 2, 3))           → false
//      isPalindrome(null)                     → true
//
//  Hard requirement: this is a READ-ONLY question, so the list must be
//  exactly as you found it when you return — same nodes, same order. The
//  tests check that after a true answer AND after a false one.
//
//  hint: find the middle, flip the second half's pointers, walk the two
//  halves in step — then flip that half back before you return

import { test, eq, ok } from '../../_lib/check.js';

const makeNode = (value) => ({ value, next: null });

const chain = (...values) => {
  let head = null;
  let tail = null;
  for (const value of values) {
    const node = makeNode(value);
    if (tail === null) head = node;
    else tail.next = node;
    tail = node;
  }
  return head;
};

const toArray = (head) => {
  const out = [];
  for (let node = head; node !== null; node = node.next) out.push(node.value);
  return out;
};

export function isPalindrome(head) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an odd-length palindrome reads the same both ways', () => {
  eq(isPalindrome(chain('r', 'a', 'r')), true);
  eq(isPalindrome(chain(1, 2, 3, 2, 1)), true);
});

test('an even-length palindrome is caught too', () => {
  eq(isPalindrome(chain(1, 2, 2, 1)), true);
  eq(isPalindrome(chain('a', 'a')), true);
});

test('anything that differs is rejected', () => {
  eq(isPalindrome(chain(1, 2, 3)), false);
  eq(isPalindrome(chain(1, 2, 3, 4)), false);
  eq(isPalindrome(chain('a', 'b')), false);
});

test('empty and single-node lists are palindromes', () => {
  eq(isPalindrome(null), true);
  eq(isPalindrome(chain('solo')), true);
});

test('the list is untouched after a true answer', () => {
  const head = chain(1, 2, 3, 2, 1);
  const second = head.next;
  eq(isPalindrome(head), true);
  eq(toArray(head), [1, 2, 3, 2, 1], 'same values, same order');
  ok(head.next === second, 'and the same nodes, not rebuilt ones');
});

test('the list is untouched after a false answer', () => {
  const head = chain(1, 2, 3, 4);
  eq(isPalindrome(head), false);
  eq(toArray(head), [1, 2, 3, 4], 'an early exit still restores the list');
});

test('application: a button sequence that reads the same backwards', () => {
  const combo = chain('up', 'down', 'left', 'down', 'up');
  eq(isPalindrome(combo), true);
  eq(toArray(combo), ['up', 'down', 'left', 'down', 'up']);
  eq(isPalindrome(chain('up', 'up', 'down')), false);
});
