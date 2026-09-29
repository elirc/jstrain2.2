// ─────────────────────────────────────────────────────────────────────────
//  24 · IIFE and the module pattern                        ★★★ stretch
//  concepts: IIFE · closures · encapsulation
//  run: node 24-module-pattern.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before `import`/`export` existed, this is how JavaScript got private
//  state: write a function, run it immediately, and return only the
//  public API. Everything else stays trapped in the closure.
//
//      const thing = (function () { ...private...; return { api }; })();
//
//  Build the task board that way — a singleton with five methods:
//
//      taskBoard.add('write tests')  → { id: 1, title: 'write tests',
//                                        done: false }
//      taskBoard.add('ship it')      → { id: 2, ... }
//      taskBoard.complete(1)         → true    (2 for an unknown id → false)
//      taskBoard.list()              → a COPY of the tasks, in order
//      taskBoard.stats()             → { total: 2, done: 1, open: 1 }
//      taskBoard.reset()             → empties it and restarts ids at 1
//      taskBoard.tasks               → undefined — nothing leaks
//
//  hint: the tasks array and the id counter are plain variables inside
//  the IIFE; list() must not hand out the array itself

import { test, eq, ok } from '../../_lib/check.js';

export const taskBoard = (function () {
  // TODO: private state lives here (the tasks and the next id)

  return {
    add(title) {
      throw new Error('TODO');
    },
    complete(id) {
      throw new Error('TODO');
    },
    list() {
      throw new Error('TODO');
    },
    stats() {
      throw new Error('TODO');
    },
    reset() {
      throw new Error('TODO');
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
