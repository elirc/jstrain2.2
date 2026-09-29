// ─────────────────────────────────────────────────────────────────────────
//  01 · Stack — SOLUTION                                   ★☆☆ warm-up
//  run: node 01-stack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a stack is a *discipline*, not a new container. Storage is
//  an ordinary array; the whole trick is only ever touching its END.
//  push/pop at the end are O(1) (amortised — the array occasionally grows,
//  but nothing moves). The classic wrong turn is treating index 0 as the
//  top: unshift/shift reindex every element, turning each operation into
//  O(n). Note `at(-1)` for the top — cleaner than `items[items.length - 1]`.
//  Returning undefined on empty (instead of throwing) keeps callers simple:
//  `while (!s.isEmpty())` reads better than a try/catch.

import { test, eq } from '../../_lib/check.js';

export class Stack {
  constructor() {
    this.items = [];
  }

  push(value) {
    this.items.push(value);
    return this;
  }

  pop() {
    return this.items.pop();
  }

  peek() {
    return this.items.at(-1);
  }

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('push adds to the top and peek reads it without removing', () => {
  const s = new Stack();
  s.push('a');
  s.push('b');
  eq(s.peek(), 'b');
  eq(s.size(), 2);
});

test('pop returns values in last-in-first-out order', () => {
  const s = new Stack();
  for (const n of [1, 2, 3]) s.push(n);
  eq(s.pop(), 3);
  eq(s.pop(), 2);
  eq(s.pop(), 1);
});

test('pop and peek on an empty stack return undefined', () => {
  const s = new Stack();
  eq(s.pop(), undefined);
  eq(s.peek(), undefined);
});

test('isEmpty flips as items come and go', () => {
  const s = new Stack();
  eq(s.isEmpty(), true);
  s.push('x');
  eq(s.isEmpty(), false);
  s.pop();
  eq(s.isEmpty(), true);
});

test('size counts only what is still on the stack', () => {
  const s = new Stack();
  for (const n of [1, 2, 3, 4]) s.push(n);
  s.pop();
  eq(s.size(), 3);
});

test('application: the back button pops the most recent page', () => {
  const history = new Stack();
  for (const page of ['/home', '/docs', '/docs/api']) history.push(page);
  eq(history.pop(), '/docs/api');
  eq(history.peek(), '/docs');
  eq(history.size(), 2);
});
