// ─────────────────────────────────────────────────────────────────────────
//  25 · Floyd's cycle detection                             ★★★ stretch
//  concepts: two pointers · cycle detection · O(1) space
//  run: node 25-linked-list-cycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A corrupted chain can point back at itself, and any loop that walks it
//  runs forever. Detect that with two pointers and no extra memory: `slow`
//  moves one node per turn, `fast` moves two. On a straight list `fast`
//  falls off the end; on a looped one it laps `slow` and they collide.
//
//      hasCycle(chain(1, 2, 3))                    → false
//      hasCycle(linkTailTo(chain(1, 2, 3), 1))     → true
//      cycleStart(linkTailTo(chain(1, 2, 3), 1))   → the node holding 2
//      cycleStart(chain(1, 2, 3))                  → null
//
//  `linkTailTo(head, i)` is given below: it points the last node at node
//  number i, building a loop for you to find. Never call toArray on a
//  cyclic chain — it will hang.
//
//  hint: once the two pointers meet, put one back at the head and step
//  BOTH one node at a time; where they meet again is the start of the loop

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
  throw new Error('TODO');
}

export function cycleStart(head) {
  throw new Error('TODO');
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
