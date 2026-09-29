// ─────────────────────────────────────────────────────────────────────────
//  24 · merge two sorted lists                              ★★☆ core
//  concepts: linked lists · merging · pointer splicing
//  run: node 24-linked-list-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two chains, each already sorted ascending. Weave them into one sorted
//  chain by RELINKING the nodes you were given — no new nodes, no array,
//  no sort() anywhere.
//
//      mergeSorted(chain(1, 3, 5), chain(2, 4, 6))  → 1 2 3 4 5 6
//      mergeSorted(null, chain(7))                  → 7
//      mergeSorted(null, null)                      → null
//
//  Ties take from `a` first, so a merge stays stable: equal timestamps
//  keep the left stream ahead of the right one. Return the head of the
//  merged chain.
//
//  hint: a throwaway "dummy" node to hang the result off means you never
//  have to special-case the very first link

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
  throw new Error('TODO');
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
