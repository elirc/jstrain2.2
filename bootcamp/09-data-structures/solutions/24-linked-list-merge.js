// ─────────────────────────────────────────────────────────────────────────
//  24 · merge two sorted lists — SOLUTION                   ★★☆ core
//  run: node 24-linked-list-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: hold a cursor on each list, append whichever head is
//  smaller, advance that cursor, repeat. Every node is looked at once, so
//  this is O(n + m) time and O(1) extra space — the only memory it uses is
//  three references.
//  The dummy node is the trick worth stealing: without it, "is this the
//  first node?" needs a branch inside the hot loop, and the head has to be
//  patched up afterwards. With it, `tail.next = …` is always correct and
//  the answer is `dummy.next`.
//  When one list runs dry the other is ALREADY sorted, so link the rest in
//  one assignment instead of looping — that tail-attach is what keeps this
//  linear rather than quadratic.
//  The comparison is `b.value < a.value`, not `<=`: on a tie the node from
//  `a` goes first, which is what makes the merge stable.
//  Why not concat and sort? That is O((n+m) log(n+m)) plus a full copy of
//  data you already had in order — you would be paying to rediscover the
//  ordering the inputs handed you for free. Same reason `unshift` into an
//  array is wrong here: O(n) per insert, O(n²) overall.

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

export function mergeSorted(a, b) {
  const dummy = makeNode(null);
  let tail = dummy;
  let left = a;
  let right = b;

  while (left !== null && right !== null) {
    if (right.value < left.value) {
      tail.next = right;
      right = right.next;
    } else {
      tail.next = left;
      left = left.next;
    }
    tail = tail.next;
  }
  tail.next = left !== null ? left : right;
  return dummy.next;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('weaves two interleaved chains into one sorted chain', () => {
  eq(toArray(mergeSorted(chain(1, 3, 5), chain(2, 4, 6))), [1, 2, 3, 4, 5, 6]);
});

test('an uneven pair still comes out sorted', () => {
  eq(toArray(mergeSorted(chain(1, 2, 3), chain(10))), [1, 2, 3, 10]);
  eq(toArray(mergeSorted(chain(10), chain(1, 2, 3))), [1, 2, 3, 10]);
});

test('an empty side returns the other list', () => {
  eq(toArray(mergeSorted(null, chain(1, 2))), [1, 2]);
  eq(toArray(mergeSorted(chain(9), null)), [9]);
  eq(mergeSorted(null, null), null);
});

test('duplicates all survive and ties take from the first list', () => {
  const a = chain(1, 2);
  const b = chain(2, 3);
  const aTwo = a.next;
  const merged = mergeSorted(a, b);
  eq(toArray(merged), [1, 2, 2, 3]);
  ok(merged.next === aTwo, 'on a tie the node from a goes first');
});

test('reuses the given nodes instead of allocating new ones', () => {
  const a = chain(1, 3);
  const b = chain(2);
  const aHead = a;
  const bHead = b;
  const merged = mergeSorted(a, b);
  ok(merged === aHead, 'the smallest existing node becomes the new head');
  ok(merged.next === bHead, 'and the other list is spliced in, not copied');
});

test('the merged chain terminates', () => {
  let node = mergeSorted(chain(1, 4), chain(2, 3));
  let steps = 0;
  while (node.next !== null && steps < 10) {
    node = node.next;
    steps += 1;
  }
  eq(steps, 3);
  eq(node.next, null);
});

test('application: two sorted log streams merge into one timeline', () => {
  const web = chain(101, 205, 400);
  const worker = chain(150, 300);
  eq(toArray(mergeSorted(web, worker)), [101, 150, 205, 300, 400]);
});
