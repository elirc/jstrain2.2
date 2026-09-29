// ─────────────────────────────────────────────────────────────────────────
//  03 · undo history                                          ★★☆ core
//  concepts: stacks · state snapshots
//  run: node 03-undo-history.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Ctrl+Z is a stack. Every time the state changes you push the OLD value
//  onto a "past" pile; undo pops the pile back into place. Build the
//  generic version — it does not care whether the state is a string, a
//  number, or a whole document object.
//
//      const h = new UndoHistory('');
//      h.set('hi');
//      h.set('hi there');
//      h.value      → 'hi there'
//      h.undo()     → 'hi'          (returns the restored value)
//      h.value      → 'hi'
//      h.canUndo()  → true
//      h.undo(); h.undo()  → the second one returns undefined, value stays
//
//  `this.value` is the current state, `this.past` is the stack of previous
//  states (oldest first). undo() with nothing to undo is a no-op.
//
//  hint: set() must remember the value it is replacing, not the new one

import { test, eq } from '../../_lib/check.js';

export class UndoHistory {
  constructor(initial) {
    this.value = initial;
    this.past = [];
  }

  set(next) {
    throw new Error('TODO');
  }

  undo() {
    throw new Error('TODO');
  }

  canUndo() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('starts on the initial value with nothing to undo', () => {
  const h = new UndoHistory('start');
  eq(h.canUndo(), false);
  eq(h.value, 'start');
});

test('set replaces the current value and makes undo available', () => {
  const h = new UndoHistory(1);
  h.set(2);
  eq(h.value, 2);
  eq(h.canUndo(), true);
});

test('undo restores the previous value and returns it', () => {
  const h = new UndoHistory('a');
  h.set('b');
  eq(h.undo(), 'a');
  eq(h.value, 'a');
});

test('undo walks back one step at a time', () => {
  const h = new UndoHistory(0);
  h.set(1);
  h.set(2);
  h.set(3);
  eq(h.undo(), 2);
  eq(h.undo(), 1);
  eq(h.value, 1);
  eq(h.canUndo(), true);
});

test('undo with an empty past is a no-op returning undefined', () => {
  const h = new UndoHistory('only');
  eq(h.undo(), undefined);
  eq(h.value, 'only');
});

test('undoing everything lands back on the initial value', () => {
  const h = new UndoHistory('v0');
  h.set('v1');
  h.set('v2');
  h.undo();
  h.undo();
  eq(h.value, 'v0');
  eq(h.canUndo(), false);
});

test('application: an editor undoes two keystrokes', () => {
  const editor = new UndoHistory('');
  for (const text of ['h', 'he', 'hel', 'hell', 'hello']) editor.set(text);
  editor.undo();
  editor.undo();
  eq(editor.value, 'hel');
  editor.set('help');
  eq(editor.value, 'help');
  eq(editor.undo(), 'hel');
});
