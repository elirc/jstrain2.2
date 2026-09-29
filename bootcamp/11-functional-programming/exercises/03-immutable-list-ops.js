// ─────────────────────────────────────────────────────────────────────────
//  03 · immutable list ops                                  ★☆☆ warm-up
//  concepts: immutability · map/filter · structural sharing
//  run: node 03-immutable-list-ops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three functions you will re-type in every app you ever build: add,
//  remove, update — each returning a NEW array and leaving the old one
//  exactly as it was. `push`, `splice` and `todos[i].done = true` are all
//  banned here (the fixture is frozen, so they throw anyway).
//
//      addTodo(todos, { id: 3, text: 'sleep', done: false })
//        → a 3-item array; todos still has 2
//      removeTodo(todos, 1)              → the list without id 1
//      updateTodo(todos, 2, { done: true })
//        → id 2 replaced by { ...it, done: true }; id 1 untouched
//
//  updateTodo merges `changes` over the matching item. An id that is not
//  in the list is not an error — you just get an equal copy back.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const todos = deepFreeze([
  { id: 1, text: 'pack', done: false },
  { id: 2, text: 'check in', done: false },
]);

export function addTodo(todos, todo) {
  throw new Error('TODO');
}

export function removeTodo(todos, id) {
  throw new Error('TODO');
}

export function updateTodo(todos, id, changes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('addTodo appends to the end', () => {
  const next = addTodo(todos, { id: 3, text: 'sleep', done: false });
  eq(next.length, 3);
  eq(next[2].text, 'sleep');
});

test('addTodo leaves the original list at its old length', () => {
  addTodo(todos, { id: 3, text: 'sleep', done: false });
  eq(todos.length, 2);
});

test('removeTodo drops the matching id', () => {
  eq(removeTodo(todos, 1), [{ id: 2, text: 'check in', done: false }]);
});

test('removing an id that is not there returns an equal copy', () => {
  const next = removeTodo(todos, 99);
  eq(next, todos);
  ok(next !== todos, 'still a new array');
});

test('updateTodo merges the changes into the matching item', () => {
  const next = updateTodo(todos, 2, { done: true });
  eq(next[1], { id: 2, text: 'check in', done: true });
});

test('updateTodo reuses the items it did not touch', () => {
  const next = updateTodo(todos, 2, { done: true });
  ok(next[0] === todos[0], 'unchanged items keep their identity');
});

test('updateTodo does not mutate the item it replaces', () => {
  updateTodo(todos, 2, { done: true });
  eq(todos[1].done, false);
});
