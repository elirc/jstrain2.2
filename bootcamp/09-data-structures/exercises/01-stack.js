// ─────────────────────────────────────────────────────────────────────────
//  01 · Stack                                              ★☆☆ warm-up
//  concepts: classes · arrays · LIFO
//  run: node 01-stack.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A stack is the "last thing in is the first thing out" pile: browser
//  history, the JS call stack, an undo pile. Under the hood it is just an
//  array with a deliberately tiny API — you only ever touch one end.
//
//      const s = new Stack();
//      s.push('a');
//      s.push('b');
//      s.peek()     → 'b'     (look at the top, do not remove)
//      s.pop()      → 'b'
//      s.size()     → 1
//      s.isEmpty()  → false
//
//  pop() and peek() on an empty stack return undefined — never throw.
//  The storage array is given to you as `this.items`; treat its LAST
//  element as the top of the stack.

import { test, eq } from '../../_lib/check.js';

export class Stack {
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

  size() {
    throw new Error('TODO');
  }

  isEmpty() {
    throw new Error('TODO');
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
