// ─────────────────────────────────────────────────────────────────────────
//  04 · Queue (without shift)                                 ★★☆ core
//  concepts: queues · FIFO · amortised cost
//  run: node 04-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A queue is first-in-first-out: job runners, print spoolers, BFS.
//  The obvious `items.shift()` works but is O(n) — it reindexes every
//  remaining element on every dequeue, so draining n items costs O(n²).
//
//  Instead, leave the array alone and remember WHERE the front is. You get
//  `this.items` (everything ever enqueued) and `this.head` (the index of
//  the front item). Nothing ever moves; head just walks forward.
//
//      const q = new Queue();
//      q.enqueue('a');
//      q.enqueue('b');
//      q.dequeue()  → 'a'
//      q.peek()     → 'b'
//      q.size()     → 1        (items still waiting, not items.length)
//      q.dequeue(); q.dequeue()  → undefined on an empty queue
//
//  hint: size is `items.length - head`, and dequeue never calls shift()

import { test, eq, ok } from '../../_lib/check.js';

export class Queue {
  constructor() {
    this.items = [];
    this.head = 0; // index of the front item
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

  isEmpty() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('dequeue returns values in first-in-first-out order', () => {
  const q = new Queue();
  for (const n of [1, 2, 3]) q.enqueue(n);
  eq(q.dequeue(), 1);
  eq(q.dequeue(), 2);
  eq(q.dequeue(), 3);
});

test('peek shows the front without removing it', () => {
  const q = new Queue();
  q.enqueue('a');
  q.enqueue('b');
  eq(q.peek(), 'a');
  eq(q.peek(), 'a');
  eq(q.size(), 2);
});

test('dequeue and peek on an empty queue return undefined', () => {
  const q = new Queue();
  eq(q.dequeue(), undefined);
  eq(q.peek(), undefined);
  eq(q.isEmpty(), true);
});

test('size counts only the items still waiting', () => {
  const q = new Queue();
  for (const n of [1, 2, 3, 4]) q.enqueue(n);
  q.dequeue();
  q.dequeue();
  eq(q.size(), 2);
  eq(q.isEmpty(), false);
});

test('dequeue advances head instead of shifting the array', () => {
  const q = new Queue();
  for (const n of [1, 2, 3]) q.enqueue(n);
  q.dequeue();
  q.dequeue();
  eq(q.head, 2);
  ok(q.items.length >= 3, 'nothing should be spliced out of items');
});

test('interleaved enqueue and dequeue keep the order', () => {
  const q = new Queue();
  q.enqueue('a');
  q.enqueue('b');
  eq(q.dequeue(), 'a');
  q.enqueue('c');
  eq(q.dequeue(), 'b');
  eq(q.dequeue(), 'c');
  eq(q.isEmpty(), true);
});

test('application: a print spooler serves jobs in arrival order', () => {
  const spooler = new Queue();
  spooler.enqueue('invoice.pdf');
  spooler.enqueue('poster.png');
  const printed = [];
  printed.push(spooler.dequeue());
  spooler.enqueue('contract.docx');
  while (!spooler.isEmpty()) printed.push(spooler.dequeue());
  eq(printed, ['invoice.pdf', 'poster.png', 'contract.docx']);
});
