// ─────────────────────────────────────────────────────────────────────────
//  10 · linked list: reverse in place — SOLUTION           ★★★ stretch
//  run: node 10-linked-list-reverse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three cursors, one pass. `prev` is the part already
//  flipped, `node` is the one being flipped, and `next` is a temporary
//  hold on the rest — you MUST save node.next before overwriting it, or
//  you have just cut the list off and lost everything downstream. That
//  single line is the whole exercise; the rest is bookkeeping.
//  O(n) time, O(1) extra space. Building a new list from toArray().reverse()
//  also "works" but allocates a second list and breaks every outside
//  reference to the old nodes — which is exactly what in-place structures
//  (LRU chains, intrusive lists in kernels) cannot tolerate.
//  Finish by swapping head and tail: after the loop `prev` is the last node
//  visited, i.e. the new head, and the old head is now the terminator.

import { test, eq, ok } from '../../_lib/check.js';

function makeNode(value) {
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

  reverse() {
    let prev = null;
    let node = this.head;
    while (node !== null) {
      const next = node.next; // save it before it is overwritten
      node.next = prev;
      prev = node;
      node = next;
    }
    this.tail = this.head;
    this.head = prev;
    return this;
  }
}

const listOf = (...values) => {
  const list = new LinkedList();
  for (const value of values) list.push(value);
  return list;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('reverses the values of a three-node list', () => {
  const list = listOf('a', 'b', 'c');
  list.reverse();
  eq(list.toArray(), ['c', 'b', 'a']);
});

test('head and tail swap ends, and the new tail terminates', () => {
  const list = listOf(1, 2, 3, 4);
  list.reverse();
  eq(list.head.value, 4);
  eq(list.tail.value, 1);
  eq(list.tail.next, null);
});

test('an empty list survives being reversed', () => {
  const list = new LinkedList();
  list.reverse();
  eq(list.toArray(), []);
  ok(list.head === null && list.tail === null);
});

test('a single node list is unchanged', () => {
  const list = listOf('only');
  list.reverse();
  eq(list.toArray(), ['only']);
  eq(list.head, list.tail);
});

test('reuses the same node objects instead of rebuilding', () => {
  const list = listOf('a', 'b', 'c');
  const first = list.head;
  const last = list.tail;
  list.reverse();
  ok(list.head === last, 'the old tail node itself is the new head');
  ok(list.tail === first, 'the old head node itself is the new tail');
  ok(list.head.next.next === first);
});

test('length is untouched and a second reverse restores the order', () => {
  const list = listOf(1, 2, 3);
  list.reverse();
  eq(list.length, 3);
  list.reverse();
  eq(list.toArray(), [1, 2, 3]);
});

test('reverse returns the list so calls can be chained', () => {
  const list = listOf('x', 'y');
  eq(list.reverse().toArray(), ['y', 'x']);
});

test('application: replay a route backwards to walk home', () => {
  const route = listOf('home', 'main st', 'oak ave', 'office');
  route.reverse();
  eq(route.toArray(), ['office', 'oak ave', 'main st', 'home']);
  eq(route.head.value, 'office');
});
