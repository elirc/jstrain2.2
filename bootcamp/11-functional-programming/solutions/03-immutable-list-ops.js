// ─────────────────────────────────────────────────────────────────────────
//  03 · immutable list ops — SOLUTION                       ★☆☆ warm-up
//  run: node 03-immutable-list-ops.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every immutable list operation is one of three shapes.
//    add    → spread into a new array literal
//    remove → filter (it always returns a new array)
//    update → map, returning `{ ...item, ...changes }` for the hit and the
//             ORIGINAL item for every miss
//  Returning the original object on a miss is not laziness, it is the
//  point: only the changed branch gets a new identity, so a downstream
//  `prev === next` check per item still works.
//  Classic wrong turn: `const copy = [...todos]; copy[1].done = true;`
//  — the copy holds the same item objects, so you mutated shared state.

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
  return [...todos, todo];
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

export function updateTodo(todos, id, changes) {
  return todos.map((todo) => (todo.id === id ? { ...todo, ...changes } : todo));
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
