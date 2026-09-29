// ─────────────────────────────────────────────────────────────────────────
//  08 · linked list: nodes and push — SOLUTION             ★☆☆ warm-up
//  run: node 08-linked-list-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a node is just an object with a `next` reference, and the
//  list is the object that remembers where the chain starts (head), where
//  it ends (tail) and how long it is. push is O(1) *because* of the tail
//  pointer — without it you would walk the whole chain every time, making
//  push O(n). Two cases only: empty list (head and tail both become the new
//  node) or not (old tail.next points at it, then tail moves).
//  toArray is the pattern you will reuse in every later exercise: start at
//  head, `while (node) { ...; node = node.next; }`.
//  Trade-off: no random access. `list[5]` does not exist and never will —
//  reaching index 5 means five hops. You buy O(1) splicing with O(n) reads.

import { test, eq, ok } from '../../_lib/check.js';

export function makeNode(value) {
  return { value, next: null };
}

export class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(value) {
    const node = makeNode(value);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length += 1;
    return this;
  }

  toArray() {
    const out = [];
    let node = this.head;
    while (node !== null) {
      out.push(node.value);
      node = node.next;
    }
    return out;
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
