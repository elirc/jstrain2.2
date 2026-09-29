// ─────────────────────────────────────────────────────────────────────────
//  26 · palindrome check in O(1) space — SOLUTION           ★★☆ core
//  run: node 26-linked-list-palindrome.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four moves. Find the end of the first half with the
//  fast/slow pair from exercise 23; reverse the second half in place with
//  the three-pointer flip from exercise 10; walk the two halves in step
//  comparing values; then reverse that half again to put the list back.
//  Every phase is one pass, so O(n) time — and nothing is allocated, so
//  O(1) space. Collecting the values into an array and comparing ends is
//  the same O(n) time but doubles the memory, which is the whole reason
//  this version gets asked about.
//  The comparison loop stops when the SHORT half runs out, which is why an
//  odd middle node needs no special case: it belongs to neither half and
//  never has to match anything.
//  Classic wrong turn: returning as soon as a mismatch is found, leaving
//  the caller's list reversed from the middle. A read-only check that
//  quietly mutates its input is a bug that shows up three functions later,
//  so restore on BOTH exits — note `same` is recorded, not returned early.

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

const reverseChain = (head) => {
  let previous = null;
  let node = head;
  while (node !== null) {
    const next = node.next;
    node.next = previous;
    previous = node;
    node = next;
  }
  return previous;
};

export function isPalindrome(head) {
  if (head === null || head.next === null) return true;

  // slow lands on the LAST node of the first half
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  const secondHalf = reverseChain(slow.next);
  let left = head;
  let right = secondHalf;
  let same = true;
  while (right !== null) {
    if (left.value !== right.value) {
      same = false;
      break;
    }
    left = left.next;
    right = right.next;
  }

  slow.next = reverseChain(secondHalf); // put the list back, always
  return same;
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
