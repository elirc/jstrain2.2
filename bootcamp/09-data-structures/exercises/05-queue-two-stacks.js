// ─────────────────────────────────────────────────────────────────────────
//  05 · queue from two stacks                              ★★★ stretch
//  concepts: stacks · amortised analysis · invariants
//  run: node 05-queue-two-stacks.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The interview classic, and the real technique behind persistent
//  (immutable) queues: build a FIFO out of two LIFOs. Pouring one stack
//  into the other reverses it — that reversal is the whole trick.
//
//  `this.inbox` takes arrivals. `this.outbox` serves departures. When the
//  outbox runs dry, tip the entire inbox into it, one pop at a time.
//
//      const q = new StackQueue();
//      q.enqueue('a'); q.enqueue('b');
//      q.dequeue()   → 'a'
//      q.enqueue('c');
//      q.dequeue()   → 'b'      (still FIFO after a late arrival)
//      q.peek()      → 'c'
//      q.size()      → 1
//
//  Only ever push/pop the two arrays — no shift, no reverse(), no index
//  reads. Empty queue: dequeue() and peek() return undefined.
//
//  hint: transfer ONLY when the outbox is empty; tipping early breaks the
//  order

import { test, eq } from '../../_lib/check.js';

export class StackQueue {
  constructor() {
    this.inbox = [];
    this.outbox = [];
  }

  enqueue(value) {
    throw new Error('TODO');
  }

  dequeue() {
    throw new Error('TODO');
  }

  peek() {
    throw new Error('TODO');
  }

  size() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('dequeue returns values in first-in-first-out order', () => {
  const q = new StackQueue();
  for (const n of [1, 2, 3]) q.enqueue(n);
  eq(q.dequeue(), 1);
  eq(q.dequeue(), 2);
  eq(q.dequeue(), 3);
});

test('items enqueued after a dequeue still go to the back', () => {
  const q = new StackQueue();
  q.enqueue('a');
  q.enqueue('b');
  eq(q.dequeue(), 'a');
  q.enqueue('c');
  eq(q.dequeue(), 'b');
  eq(q.dequeue(), 'c');
});

test('peek shows the front without removing it', () => {
  const q = new StackQueue();
  q.enqueue('x');
  q.enqueue('y');
  eq(q.peek(), 'x');
  eq(q.peek(), 'x');
  eq(q.size(), 2);
});

test('dequeue and peek on an empty queue return undefined', () => {
  const q = new StackQueue();
  eq(q.dequeue(), undefined);
  eq(q.peek(), undefined);
  eq(q.size(), 0);
});

test('size counts both stacks together', () => {
  const q = new StackQueue();
  for (const n of [1, 2, 3]) q.enqueue(n);
  q.dequeue();
  q.enqueue(4);
  eq(q.size(), 3);
});

test('transfers only when the outbox is empty', () => {
  const q = new StackQueue();
  for (const n of [1, 2, 3]) q.enqueue(n);
  eq(q.dequeue(), 1);
  q.enqueue(4);
  eq(q.outbox, [3, 2], 'the reversed leftovers stay in the outbox');
  eq(q.inbox, [4], 'the newcomer waits in the inbox');
  eq(q.dequeue(), 2);
});

test('survives many rounds of mixed traffic', () => {
  const q = new StackQueue();
  const out = [];
  for (let n = 1; n <= 6; n += 1) {
    q.enqueue(n);
    if (n % 2 === 0) out.push(q.dequeue());
  }
  while (q.size() > 0) out.push(q.dequeue());
  eq(out, [1, 2, 3, 4, 5, 6]);
});

test('application: a chat relay forwards messages in order', () => {
  const relay = new StackQueue();
  relay.enqueue('hello');
  relay.enqueue('are you there?');
  const sent = [relay.dequeue()];
  relay.enqueue('never mind');
  while (relay.size() > 0) sent.push(relay.dequeue());
  eq(sent, ['hello', 'are you there?', 'never mind']);
});
