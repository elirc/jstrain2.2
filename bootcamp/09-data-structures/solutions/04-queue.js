// ─────────────────────────────────────────────────────────────────────────
//  04 · Queue (without shift) — SOLUTION                      ★★☆ core
//  run: node 04-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `shift()` is O(n) because every surviving element slides
//  down one index. Moving a *pointer* instead makes dequeue O(1): read
//  items[head], blank the slot so the value can be garbage collected, and
//  increment head. enqueue stays a plain push, also O(1).
//  The cost you trade away is memory: `items` keeps growing even as the
//  queue empties. Real code compacts when the dead prefix gets big —
//      if (this.head > 32 && this.head * 2 >= this.items.length) {
//        this.items = this.items.slice(this.head); this.head = 0;
//      }
//  — an O(n) copy that happens rarely enough to stay O(1) amortised.
//  Why not an array with shift? Draining 100k jobs: ~5·10⁹ element moves
//  versus 100k pointer bumps.

import { test, eq, ok } from '../../_lib/check.js';

export class Queue {
  constructor() {
    this.items = [];
    this.head = 0; // index of the front item
  }

  enqueue(value) {
    this.items.push(value);
    return this;
  }

  dequeue() {
    if (this.head >= this.items.length) return undefined;
    const value = this.items[this.head];
    this.items[this.head] = undefined; // let the value be collected
    this.head += 1;
    return value;
  }

  peek() {
    return this.head < this.items.length ? this.items[this.head] : undefined;
  }

  size() {
    return this.items.length - this.head;
  }

  isEmpty() {
    return this.size() === 0;
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
