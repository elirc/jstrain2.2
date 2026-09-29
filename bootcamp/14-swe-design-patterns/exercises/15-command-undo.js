// ─────────────────────────────────────────────────────────────────────────
//  15 · editor commands with undo                            ★★★ stretch
//  concepts: command · undo/redo stacks · capturing state
//  run: node exercises/15-command-undo.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn "edit the document" into objects, and undo falls out for free.
//  A command knows how to do a thing AND how to take it back:
//
//      { name, execute(doc) → newDoc, undo(doc) → previousDoc }
//
//      const ed = createEditor('hello world');
//      ed.run(insertCommand('brave ', 6));  → 'hello brave world'
//      ed.undo();                           → 'hello world'   (true)
//      ed.redo();                           → 'hello brave world'
//
//      deleteCommand(at, count) removes count characters at `at`
//      ed.run(deleteCommand(0, 6))   'hello brave world' → 'brave world'
//      ed.undo()                     → 'hello brave world'
//
//  Editor API: text(), run(command), undo() → boolean, redo() → boolean,
//  history() → the names of the commands currently applied, oldest first.
//  Running a new command clears the redo stack — you cannot redo a
//  future you just overwrote.
//
//  hint: insert can compute its own undo from its arguments; delete
//  cannot — it has to remember the characters it removed, and the only
//  moment it can learn them is inside execute()

import { test, eq } from '../../_lib/check.js';

export function insertCommand(text, at) {
  throw new Error('TODO');
}

export function deleteCommand(at, count) {
  throw new Error('TODO');
}

export function createEditor(initial = '') {
  throw new Error('TODO');
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
