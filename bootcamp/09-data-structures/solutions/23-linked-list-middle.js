// ─────────────────────────────────────────────────────────────────────────
//  23 · linked list: find the middle — SOLUTION             ★☆☆ warm-up
//  run: node 23-linked-list-middle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two pointers leave the head together, `slow` taking one
//  step per turn and `fast` taking two. `fast` covers twice the ground, so
//  when it hits the end `slow` has covered exactly half — that is the
//  middle, found in ONE pass at O(n) time and O(1) space.
//  The loop guard `fast !== null && fast.next !== null` is doing two jobs:
//  it stops an even-length list on the second middle, and it stops you
//  reading `.next` of null on an odd one. Reverse the two checks and a
//  four-node list crashes.
//  Why not count first? Walking the list to measure it, then walking half
//  of it again, is two passes over memory the CPU has to fetch twice —
//  same O(n) on paper, measurably slower in practice. Copying to an array
//  is worse: O(n) extra memory to answer a question about one node.
//  This "fast and slow" pair is the engine behind the next three
//  exercises — cycle detection, palindromes, and split-in-half merges.

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

export function findMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the middle of an odd-length list', () => {
  eq(findMiddle(chain('a', 'b', 'c')).value, 'b');
  eq(findMiddle(chain(1, 2, 3, 4, 5)).value, 3);
});

test('takes the second middle when the length is even', () => {
  eq(findMiddle(chain('a', 'b', 'c', 'd')).value, 'c');
  eq(findMiddle(chain(1, 2)).value, 2);
});

test('a single node is its own middle', () => {
  const head = chain('only');
  ok(findMiddle(head) === head);
});

test('an empty list has no middle', () => {
  eq(findMiddle(null), null);
});

test('returns the live node, still linked to the rest', () => {
  const head = chain(1, 2, 3, 4, 5);
  const middle = findMiddle(head);
  ok(middle === head.next.next, 'the node itself, not a copy');
  eq(toArray(middle), [3, 4, 5], 'you can keep walking from it');
});

test('application: a player jumps to the middle track of a playlist', () => {
  const playlist = chain('intro', 'verse', 'chorus', 'bridge', 'outro');
  eq(findMiddle(playlist).value, 'chorus');
  eq(toArray(playlist).length, 5, 'the playlist itself is untouched');
});
