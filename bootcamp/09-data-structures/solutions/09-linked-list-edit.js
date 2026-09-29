// ─────────────────────────────────────────────────────────────────────────
//  09 · linked list: find, insertAt, removeAt — SOLUTION      ★★☆ core
//  run: node 09-linked-list-edit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every edit is the same three steps — walk to the node
//  BEFORE the target, rewire two `next` pointers, patch the bookkeeping
//  (head, tail, length). Index 0 is special because there is no "node
//  before"; that is the branch people forget.
//  Cost: finding position i is O(i), but the splice itself is O(1) — no
//  elements move. An array is the mirror image: O(1) to find index i,
//  O(n) to splice because everything after it slides. That is the whole
//  array-vs-list trade, and why a list wins when you already hold a
//  reference to the spot (LRU chains, editor buffers, free lists).
//  Watch the tail: inserting at the end or removing the last node has to
//  move it, or a later push appends onto a node that is no longer in the
//  list.

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

  find(predicate) {
    let node = this.head;
    while (node !== null) {
      if (predicate(node.value)) return node.value;
      node = node.next;
    }
    return undefined;
  }

  insertAt(index, value) {
    if (index < 0 || index > this.length) return false;
    if (index === this.length) {
      this.push(value);
      return true;
    }
    const node = makeNode(value);
    if (index === 0) {
      node.next = this.head;
      this.head = node;
    } else {
      const before = this.#nodeAt(index - 1);
      node.next = before.next;
      before.next = node;
    }
    this.length += 1;
    return true;
  }

  removeAt(index) {
    if (index < 0 || index >= this.length) return undefined;
    let removed;
    if (index === 0) {
      removed = this.head;
      this.head = removed.next;
    } else {
      const before = this.#nodeAt(index - 1);
      removed = before.next;
      before.next = removed.next;
      if (removed === this.tail) this.tail = before;
    }
    if (this.head === null) this.tail = null;
    this.length -= 1;
    removed.next = null;
    return removed.value;
  }

  #nodeAt(index) {
    let node = this.head;
    for (let i = 0; i < index; i += 1) node = node.next;
    return node;
  }
}

const listOf = (...values) => {
  const list = new LinkedList();
  for (const value of values) list.push(value);
  return list;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('find returns the first value the predicate accepts', () => {
  const list = listOf(3, 8, 12, 20);
  eq(list.find((v) => v > 5), 8);
});

test('find returns undefined when nothing matches', () => {
  const list = listOf(1, 2, 3);
  eq(list.find((v) => v > 99), undefined);
});

test('insertAt(0) becomes the new head', () => {
  const list = listOf('a', 'b');
  eq(list.insertAt(0, 'z'), true);
  eq(list.toArray(), ['z', 'a', 'b']);
  eq(list.head.value, 'z');
  eq(list.length, 3);
});

test('insertAt in the middle relinks both sides', () => {
  const list = listOf('a', 'b', 'c');
  list.insertAt(1, 'q');
  eq(list.toArray(), ['a', 'q', 'b', 'c']);
  eq(list.tail.value, 'c');
});

test('insertAt at the end appends and moves the tail', () => {
  const list = listOf('a', 'b');
  list.insertAt(2, 'c');
  eq(list.toArray(), ['a', 'b', 'c']);
  eq(list.tail.value, 'c');
  eq(list.tail.next, null);
});

test('insertAt out of range is refused and changes nothing', () => {
  const list = listOf('a', 'b');
  eq(list.insertAt(9, 'x'), false);
  eq(list.insertAt(-1, 'x'), false);
  eq(list.toArray(), ['a', 'b']);
  eq(list.length, 2);
});

test('removeAt unlinks the node and fixes head, tail and length', () => {
  const list = listOf('a', 'b', 'c');
  eq(list.removeAt(1), 'b');
  eq(list.toArray(), ['a', 'c']);
  eq(list.removeAt(0), 'a');
  eq(list.head.value, 'c');
  eq(list.removeAt(0), 'c');
  ok(list.head === null && list.tail === null);
  eq(list.length, 0);
  eq(list.removeAt(0), undefined);
});

test('application: a task list takes a rush job and a cancellation', () => {
  const tasks = listOf('email', 'report', 'invoice');
  tasks.insertAt(0, 'hotfix');
  eq(tasks.toArray(), ['hotfix', 'email', 'report', 'invoice']);
  eq(tasks.removeAt(2), 'report');
  eq(tasks.find((t) => t.startsWith('inv')), 'invoice');
  eq(tasks.toArray(), ['hotfix', 'email', 'invoice']);
});
