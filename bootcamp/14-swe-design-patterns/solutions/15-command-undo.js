// ─────────────────────────────────────────────────────────────────────────
//  15 · editor commands with undo — SOLUTION                 ★★★ stretch
//  concepts: command · undo/redo stacks · capturing state
//  run: node solutions/15-command-undo.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — package "do this" as an object, so an action can be stored,
//  queued, logged, replayed and reversed.
//  Undo is just a second method plus two stacks: `done` and `undone`.
//  The subtle part is `deleteCommand`. Its undo needs the characters it
//  removed, and those exist only at execute time — so execute captures
//  them in the closure. That "capture what you destroy" rule is the one
//  juniors miss; a delete command built from `at` and `count` alone can
//  put the length back but not the text.
//  `run` clearing the redo stack is the other real-world rule: once you
//  type over an undone edit, that branch of history is gone.
//  When NOT to use: if you never need history, `doc = insert(doc, ...)`
//  is fine — commands add a layer whose only payoff is replayability.
//  In the wild: Redux actions (+ redux-undo), Photoshop's history panel,
//  database write-ahead logs, CQRS commands, git's reflog.

import { test, eq } from '../../_lib/check.js';

export function insertCommand(text, at) {
  return {
    name: 'insert',
    execute: (doc) => doc.slice(0, at) + text + doc.slice(at),
    undo: (doc) => doc.slice(0, at) + doc.slice(at + text.length),
  };
}

export function deleteCommand(at, count) {
  let removed = '';
  return {
    name: 'delete',
    execute(doc) {
      removed = doc.slice(at, at + count);
      return doc.slice(0, at) + doc.slice(at + count);
    },
    undo: (doc) => doc.slice(0, at) + removed + doc.slice(at),
  };
}

export function createEditor(initial = '') {
  let doc = initial;
  const done = [];
  const undone = [];

  return {
    text: () => doc,
    history: () => done.map((command) => command.name),

    run(command) {
      doc = command.execute(doc);
      done.push(command);
      undone.length = 0;
      return doc;
    },

    undo() {
      const command = done.pop();
      if (!command) return false;
      doc = command.undo(doc);
      undone.push(command);
      return true;
    },

    redo() {
      const command = undone.pop();
      if (!command) return false;
      doc = command.execute(doc);
      done.push(command);
      return true;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('insert puts text at a position', () => {
  const ed = createEditor('hello world');
  ed.run(insertCommand('brave ', 6));
  eq(ed.text(), 'hello brave world');
});

test('undoing an insert removes exactly what it added', () => {
  const ed = createEditor('hello world');
  ed.run(insertCommand('brave ', 6));
  eq(ed.undo(), true);
  eq(ed.text(), 'hello world');
});

test('delete removes a range', () => {
  const ed = createEditor('hello brave world');
  ed.run(deleteCommand(0, 6));
  eq(ed.text(), 'brave world');
});

test('undoing a delete restores the exact characters', () => {
  const ed = createEditor('hello brave world');
  ed.run(deleteCommand(6, 6));
  eq(ed.text(), 'hello world');
  ed.undo();
  eq(ed.text(), 'hello brave world');
});

test('redo re-applies what undo took back', () => {
  const ed = createEditor('hello world');
  ed.run(insertCommand('!', 11));
  ed.undo();
  eq(ed.redo(), true);
  eq(ed.text(), 'hello world!');
  eq(ed.history(), ['insert']);
});

test('commands unwind last-in first-out', () => {
  const ed = createEditor('a');
  ed.run(insertCommand('b', 1));
  ed.run(insertCommand('c', 2));
  ed.run(deleteCommand(0, 1));
  eq([ed.text(), ...ed.history()], ['bc', 'insert', 'insert', 'delete']);
  ed.undo();
  eq(ed.text(), 'abc');
  ed.undo();
  eq(ed.text(), 'ab');
  eq(ed.history(), ['insert']);
});

test('a new command clears the redo stack', () => {
  const ed = createEditor('a');
  ed.run(insertCommand('b', 1));
  ed.undo();
  ed.run(insertCommand('z', 1));
  eq(ed.redo(), false);
  eq(ed.text(), 'az');
});

test('undo and redo on empty stacks report false', () => {
  const ed = createEditor('a');
  eq(ed.undo(), false);
  eq(ed.redo(), false);
  eq(ed.text(), 'a');
  eq(ed.history(), []);
});
