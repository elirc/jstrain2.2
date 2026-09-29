// ─────────────────────────────────────────────────────────────────────────
//  27 · min-stack with O(1) getMin — SOLUTION               ★★★ stretch
//  run: node 27-min-stack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: keep a SECOND stack that answers "what was the minimum
//  when the stack was this tall?". Every push stores
//  Math.min(value, currentMin); every pop drops both stacks together. The
//  two arrays therefore always have the same height, so the current
//  minimum is just the top of `mins`.
//  push, pop, peek, getMin and size are all O(1) — no loops anywhere — at
//  the cost of O(n) extra space. That is the trade: a number per entry
//  buys you an answer that would otherwise cost a full O(n) scan, and a
//  scan inside a loop is how an O(n) job becomes O(n²).
//  Classic wrong turn: pushing onto `mins` only when the value is a NEW
//  strict minimum. Push 1 twice, pop once, and the record is gone — the
//  stack still holds a 1 but getMin reports the older, larger value.
//  Storing the duplicate is what test three is defending.
//  (For the memory-conscious: the same idea works with pairs of
//  [value, minAtThisDepth], or by storing counts — but keep it obvious.)

import { test, eq } from '../../_lib/check.js';

export class MinStack {
  constructor() {
    this.items = [];
    this.mins = [];
  }

  push(value) {
    const smallest = this.mins.length === 0 ? value : this.getMin();
    this.items.push(value);
    this.mins.push(Math.min(value, smallest));
    return this;
  }

  pop() {
    if (this.items.length === 0) return undefined;
    this.mins.pop();
    return this.items.pop();
  }

  peek() {
    return this.items[this.items.length - 1];
  }

  getMin() {
    return this.mins[this.mins.length - 1];
  }

  size() {
    return this.items.length;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('getMin follows the smallest value as it arrives', () => {
  const s = new MinStack();
  s.push(5);
  eq(s.getMin(), 5);
  s.push(2);
  eq(s.getMin(), 2);
  s.push(7);
  eq(s.getMin(), 2, 'a bigger value does not change the minimum');
});

test('popping the minimum uncovers the previous one', () => {
  const s = new MinStack();
  for (const n of [5, 2, 7]) s.push(n);
  s.pop();
  eq(s.getMin(), 2);
  s.pop();
  eq(s.getMin(), 5, 'the 5 was never gone, just covered up');
});

test('a repeated minimum survives one pop', () => {
  const s = new MinStack();
  for (const n of [3, 1, 1, 2]) s.push(n);
  s.pop();
  s.pop();
  eq(s.getMin(), 1, 'there were two 1s — one is still on the stack');
  s.pop();
  eq(s.getMin(), 3);
});

test('it is still a stack: last in, first out', () => {
  const s = new MinStack();
  for (const n of [1, 2, 3]) s.push(n);
  eq(s.peek(), 3);
  eq(s.pop(), 3);
  eq(s.pop(), 2);
  eq(s.size(), 1);
});

test('an empty stack reads undefined everywhere', () => {
  const s = new MinStack();
  eq(s.size(), 0);
  eq(s.pop(), undefined);
  eq(s.peek(), undefined);
  eq(s.getMin(), undefined);
});

test('draining and refilling starts the minimum over', () => {
  const s = new MinStack();
  for (const n of [4, 1]) s.push(n);
  s.pop();
  s.pop();
  eq(s.getMin(), undefined);
  s.push(9);
  eq(s.getMin(), 9, 'the old 1 must not haunt the new stack');
});

test('application: a trading desk tracks the best price on the stack', () => {
  const quotes = new MinStack();
  for (const price of [104, 99, 101]) quotes.push(price);
  eq(quotes.getMin(), 99, 'cheapest quote still open');
  quotes.push(97);
  eq(quotes.getMin(), 97);
  quotes.pop();
  eq(quotes.getMin(), 99, 'that quote expired, the old best is back');
});
