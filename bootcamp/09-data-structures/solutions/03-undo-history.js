// ─────────────────────────────────────────────────────────────────────────
//  03 · undo history — SOLUTION                               ★★☆ core
//  run: node 03-undo-history.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: undo is "the past, most recent first" — a stack. set()
//  pushes the value being *replaced*; undo() pops it back. Both are O(1),
//  and memory is O(number of edits), which is why real editors cap the
//  stack or store diffs instead of whole snapshots.
//  The classic wrong turn: pushing the NEW value in set(). Then the first
//  undo hands back the state you are already in, and every undo is off by
//  one. Also note undo() returns undefined on an empty past rather than
//  throwing — an editor should ignore a stray Ctrl+Z, not crash.
//  Redo is the mirror image: a second stack that undo() pushes onto.

import { test, eq } from '../../_lib/check.js';

export class UndoHistory {
  constructor(initial) {
    this.value = initial;
    this.past = [];
  }

  set(next) {
    this.past.push(this.value);
    this.value = next;
    return this;
  }

  undo() {
    if (this.past.length === 0) return undefined;
    this.value = this.past.pop();
    return this.value;
  }

  canUndo() {
    return this.past.length > 0;
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
