// ─────────────────────────────────────────────────────────────────────────
//  25 · Floyd's cycle detection — SOLUTION                  ★★★ stretch
//  run: node 25-linked-list-cycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two pointers, one twice as fast. If the list ends, `fast`
//  reaches null and there is no loop. If it loops, `fast` gains one node
//  on `slow` every turn, so it must eventually land ON it — no skipping
//  past, because the gap shrinks by exactly one each time.
//  Cost: O(n) time, O(1) space. The obvious alternative — a Set of visited
//  nodes — is also O(n) time but O(n) MEMORY, and on a million-node free
//  list that is the difference between two variables and a million
//  references.
//  Finding the start is the pretty part. Say the loop begins k nodes in.
//  When they meet, `slow` has walked k + m and `fast` twice that, so the
//  distance from the meeting point back round to the start is also k.
//  Restart one pointer at the head, step both ONE at a time, and they
//  meet exactly at the entry — no counting required.
//  Classic wrong turn: advancing `fast` by two without checking BOTH
//  `fast` and `fast.next`, which throws on any even-length straight list.

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

const linkTailTo = (head, index) => {
  let target = head;
  for (let i = 0; i < index; i += 1) target = target.next;
  let tail = head;
  while (tail.next !== null) tail = tail.next;
  tail.next = target;
  return head;
};

export function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

export function cycleStart(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry;
    }
  }
  return null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a chain that ends properly has no cycle', () => {
  eq(hasCycle(chain(1, 2, 3)), false);
  eq(hasCycle(chain('lonely')), false);
});

test('an empty list is cycle-free', () => {
  eq(hasCycle(null), false);
  eq(cycleStart(null), null);
});

test('a node pointing at itself is the tightest possible loop', () => {
  const head = linkTailTo(chain('x'), 0);
  eq(hasCycle(head), true);
  ok(cycleStart(head) === head);
});

test('a tail looping back to the head starts the cycle at the head', () => {
  const head = linkTailTo(chain(1, 2, 3, 4), 0);
  eq(hasCycle(head), true);
  ok(cycleStart(head) === head);
});

test('a tail looping into the middle starts the cycle there', () => {
  const head = linkTailTo(chain(1, 2, 3, 4, 5), 2);
  eq(hasCycle(head), true);
  const start = cycleStart(head);
  eq(start.value, 3);
  ok(start === head.next.next, 'the node itself, not just its value');
});

test('cycleStart returns null when there is nothing to find', () => {
  eq(cycleStart(chain(1, 2, 3, 4)), null);
  eq(cycleStart(chain('one')), null);
});

test('application: a task chain that would spin forever is caught', () => {
  const pipeline = chain('build', 'test', 'deploy', 'notify');
  eq(hasCycle(pipeline), false, 'a healthy pipeline terminates');

  const broken = linkTailTo(chain('build', 'test', 'deploy', 'notify'), 1);
  eq(hasCycle(broken), true);
  eq(cycleStart(broken).value, 'test', 'the step it keeps falling back to');
});
