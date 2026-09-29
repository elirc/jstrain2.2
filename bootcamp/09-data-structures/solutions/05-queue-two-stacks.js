// ─────────────────────────────────────────────────────────────────────────
//  05 · queue from two stacks — SOLUTION                   ★★★ stretch
//  run: node 05-queue-two-stacks.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: popping every element off the inbox and pushing it onto
//  the outbox reverses the order, and reversed-LIFO is FIFO. The invariant
//  that makes it correct: the outbox always holds an OLDER run of items
//  than the inbox, so you may only refill it when it is completely empty.
//  Tip early and a new arrival lands on top of older items — order lost.
//  Cost: enqueue is O(1). A single dequeue can be O(n), but each element
//  is moved exactly twice in its lifetime (in, then across), so the
//  amortised cost per dequeue is O(1) — the standard example of why
//  "worst case per call" and "cost per call over time" are different
//  questions. That is also why `reverse()` on every dequeue would be wrong
//  in spirit: it repeats work you already paid for.

import { test, eq } from '../../_lib/check.js';

export class StackQueue {
  constructor() {
    this.inbox = [];
    this.outbox = [];
  }

  enqueue(value) {
    this.inbox.push(value);
    return this;
  }

  #fill() {
    if (this.outbox.length > 0) return;
    while (this.inbox.length > 0) this.outbox.push(this.inbox.pop());
  }

  dequeue() {
    this.#fill();
    return this.outbox.pop();
  }

  peek() {
    this.#fill();
    return this.outbox.at(-1);
  }

  size() {
    return this.inbox.length + this.outbox.length;
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
