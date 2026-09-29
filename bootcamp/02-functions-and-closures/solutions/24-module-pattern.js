// ─────────────────────────────────────────────────────────────────────────
//  24 · IIFE and the module pattern — SOLUTION             ★★★ stretch
//  run: node 24-module-pattern.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the IIFE runs once, at load, and its local variables
//  become the module's private state — the returned object is the only
//  handle anyone gets. That is the whole "module pattern", and it is why
//  `taskBoard.tasks` is undefined: there is no such property, only a
//  variable that five closures share.
//  `list()` returns `[...tasks]` so callers cannot splice the board from
//  the outside; without the copy the encapsulation is decorative.
//  `reset()` reassigns the same captured bindings — every method keeps
//  working because they reference the variables, not a snapshot.
//  Today you would reach for a module file or a class with #private
//  fields, but the closure underneath is exactly this.

import { test, eq, ok } from '../../_lib/check.js';

export const taskBoard = (function () {
  let tasks = [];
  let nextId = 1;

  return {
    add(title) {
      const task = { id: nextId, title, done: false };
      nextId += 1;
      tasks.push(task);
      return task;
    },
    complete(id) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return false;
      task.done = true;
      return true;
    },
    list() {
      return [...tasks];
    },
    stats() {
      const done = tasks.filter((t) => t.done).length;
      return { total: tasks.length, done, open: tasks.length - done };
    },
    reset() {
      tasks = [];
      nextId = 1;
    },
  };
})();

// ──────────────────────────── tests ──────────────────────────────────────

test('a fresh board is empty', () => {
  taskBoard.reset();
  eq(taskBoard.list(), []);
  eq(taskBoard.stats(), { total: 0, done: 0, open: 0 });
});

test('add returns the stored task with an incrementing id', () => {
  taskBoard.reset();
  eq(taskBoard.add('write tests'), {
    id: 1,
    title: 'write tests',
    done: false,
  });
  eq(taskBoard.add('ship it'), { id: 2, title: 'ship it', done: false });
});

test('list reports the tasks in insertion order', () => {
  taskBoard.reset();
  taskBoard.add('first');
  taskBoard.add('second');
  eq(
    taskBoard.list().map((t) => t.title),
    ['first', 'second']
  );
});

test('complete marks a task done and reports success', () => {
  taskBoard.reset();
  taskBoard.add('write tests');
  eq(taskBoard.complete(1), true);
  eq(taskBoard.list()[0].done, true);
});

test('completing an unknown id changes nothing', () => {
  taskBoard.reset();
  taskBoard.add('write tests');
  eq(taskBoard.complete(99), false);
  eq(taskBoard.list()[0].done, false);
});

test('list hands out a copy, not the private array', () => {
  taskBoard.reset();
  taskBoard.add('only one');
  const copy = taskBoard.list();
  copy.push({ id: 99, title: 'injected', done: false });
  eq(copy.length, 2);
  eq(taskBoard.list().length, 1);
});

test('stats counts done and open separately', () => {
  taskBoard.reset();
  taskBoard.add('a');
  taskBoard.add('b');
  taskBoard.add('c');
  taskBoard.complete(2);
  eq(taskBoard.stats(), { total: 3, done: 1, open: 2 });
});

test('the state is private and reset restarts the ids', () => {
  taskBoard.reset();
  eq(Object.keys(taskBoard).sort(), [
    'add',
    'complete',
    'list',
    'reset',
    'stats',
  ]);
  taskBoard.add('a');
  ok(taskBoard.tasks === undefined, 'the task list must not be a property');
  taskBoard.reset();
  eq(taskBoard.add('fresh').id, 1);
});
