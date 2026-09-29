// ─────────────────────────────────────────────────────────────────────────
//  27 · min-stack with O(1) getMin                          ★★★ stretch
//  concepts: stacks · invariants · trading space for time
//  run: node 27-min-stack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A normal stack plus one extra question: "what is the smallest value in
//  here?" — answered in constant time, every time. Scanning the array is
//  not allowed; if getMin is O(n) then a loop that calls it turns O(n²).
//
//      const s = new MinStack();
//      s.push(5); s.push(2); s.push(7);
//      s.getMin()   → 2
//      s.peek()     → 7
//      s.pop()      → 7      (getMin is still 2)
//      s.pop()      → 2      (getMin is now 5)
//
//  push, pop, peek, getMin and size are all O(1). Reading an empty stack
//  returns undefined — never throw. `this.items` is yours; add any extra
//  bookkeeping you need to the constructor.
//
//  hint: the answer for "the minimum right now" changes only when you
//  push or pop, so record it as you go instead of computing it later

import { test, eq } from '../../_lib/check.js';

export class MinStack {
  constructor() {
    this.items = [];
  }

  push(value) {
    throw new Error('TODO');
  }

  pop() {
    throw new Error('TODO');
  }

  peek() {
    throw new Error('TODO');
  }

  getMin() {
    throw new Error('TODO');
  }

  size() {
    throw new Error('TODO');
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
