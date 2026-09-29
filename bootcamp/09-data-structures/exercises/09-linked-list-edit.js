// ─────────────────────────────────────────────────────────────────────────
//  09 · linked list: find, insertAt, removeAt                 ★★☆ core
//  concepts: pointer surgery · traversal · off-by-one
//  run: node 09-linked-list-edit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Now the part arrays are bad at: putting something in the middle without
//  moving everything after it. `push` and `toArray` are already written;
//  add the three editing operations.
//
//      const list = new LinkedList();      // a → b → c
//      list.find((v) => v > 'a')  → 'b'    first value the test accepts
//      list.find((v) => v > 'z')  → undefined
//
//      list.insertAt(0, 'z')   → true      z → a → b → c
//      list.insertAt(2, 'q')   → true      z → a → q → b → c
//      list.insertAt(99, 'x')  → false     out of range, nothing changes
//      (index === length is allowed: it appends)
//
//      list.removeAt(0)   → 'z'            returns the removed VALUE
//      list.removeAt(99)  → undefined
//
//  Keep `head`, `tail` and `length` correct after every edit.
//
//  hint: to touch index i, stop the walk at i - 1 — you need the node
//  BEFORE the one you are changing

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
    throw new Error('TODO');
  }

  insertAt(index, value) {
    throw new Error('TODO');
  }

  removeAt(index) {
    throw new Error('TODO');
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
