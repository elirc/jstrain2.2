// ─────────────────────────────────────────────────────────────────────────
//  23 · linked list: find the middle                        ★☆☆ warm-up
//  concepts: two pointers · fast and slow
//  run: node 23-linked-list-middle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You get a bare chain of nodes — no length property, no array, no way to
//  jump to index i. Find the middle node in ONE pass by walking two
//  pointers at different speeds: move `slow` one step and `fast` two, and
//  when `fast` runs off the end, `slow` is standing in the middle.
//
//      findMiddle(chain('a', 'b', 'c'))        → the 'b' node
//      findMiddle(chain('a', 'b', 'c', 'd'))   → the 'c' node
//      findMiddle(chain('only'))               → that same node
//      findMiddle(null)                        → null
//
//  An even-length list has two middles — return the SECOND one ('c'
//  above). Return the node itself, not the value: the caller wants to keep
//  walking from there.

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
  throw new Error('TODO');
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
