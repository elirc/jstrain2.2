// ─────────────────────────────────────────────────────────────────────────
//  08 · linked list: nodes and push                        ★☆☆ warm-up
//  concepts: references · nodes · pointers
//  run: node 08-linked-list-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An array stores values side by side and knows every index. A linked
//  list stores each value in its own little box that points at the next
//  box — no indexes, no contiguous memory, and no reshuffling when you
//  splice something into the middle.
//
//      makeNode('a')  → { value: 'a', next: null }
//
//      const list = new LinkedList();
//      list.push('a');
//      list.push('b');
//      list.head.value       → 'a'
//      list.head.next.value  → 'b'
//      list.tail.value       → 'b'
//      list.toArray()        → ['a', 'b']
//      list.length           → 2
//
//  `this.head`, `this.tail` and `this.length` are yours to maintain. Keep
//  the tail pointer honest so push never has to walk the list.

import { test, eq, ok } from '../../_lib/check.js';

export function makeNode(value) {
  throw new Error('TODO');
}

export class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(value) {
    throw new Error('TODO');
  }

  toArray() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('makeNode holds a value and points nowhere yet', () => {
  eq(makeNode('a'), { value: 'a', next: null });
});

test('nodes can be chained together by hand', () => {
  const first = makeNode(1);
  const second = makeNode(2);
  first.next = second;
  eq(first.next.value, 2);
  eq(first.next.next, null);
});

test('push on an empty list sets both head and tail', () => {
  const list = new LinkedList();
  list.push('only');
  eq(list.head.value, 'only');
  eq(list.tail.value, 'only');
  eq(list.head.next, null);
});

test('push appends at the tail', () => {
  const list = new LinkedList();
  list.push('a');
  list.push('b');
  list.push('c');
  eq(list.head.value, 'a');
  eq(list.head.next.value, 'b');
  eq(list.tail.value, 'c');
  eq(list.tail.next, null);
});

test('toArray walks the chain from head to tail', () => {
  const list = new LinkedList();
  for (const n of [10, 20, 30]) list.push(n);
  eq(list.toArray(), [10, 20, 30]);
});

test('an empty list has no head and an empty array form', () => {
  const list = new LinkedList();
  eq(list.toArray(), []);
  ok(list.head === null);
  eq(list.length, 0);
});

test('length grows with every push', () => {
  const list = new LinkedList();
  for (const n of [1, 2, 3, 4]) list.push(n);
  eq(list.length, 4);
});

test('application: a playlist keeps songs in the order added', () => {
  const playlist = new LinkedList();
  for (const song of ['intro', 'verse', 'chorus']) playlist.push(song);
  eq(playlist.toArray(), ['intro', 'verse', 'chorus']);
  eq(playlist.tail.value, 'chorus');
});
