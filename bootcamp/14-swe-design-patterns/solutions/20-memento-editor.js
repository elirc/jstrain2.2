// ─────────────────────────────────────────────────────────────────────────
//  20 · memento snapshots — SOLUTION                             ★★☆ core
//  concepts: memento · originator/caretaker · snapshot vs replay
//  run: node solutions/20-memento-editor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — let an object publish a snapshot of its own state that
//  somebody else can store and hand back later, without that somebody
//  ever learning how the state is shaped.
//  Three roles: the *originator* (the editor) makes and eats mementos,
//  the *memento* is an opaque frozen value, the *caretaker* (the
//  history) only stacks them. The caretaker never reads `.text` — that
//  is the whole point, and it is why swapping the editor's internals
//  breaks nothing.
//  Memento vs command/undo (exercise 15): a command knows how to REVERSE
//  one operation, so it can undo only what it recorded and it composes
//  with a redo stack. A memento REPLACES the entire state, so it rolls
//  back edits nobody recorded — including changes made behind the
//  editor's back. Rule of thumb: reversible fine-grained edits → command;
//  coarse "checkpoint the world" → memento.
//  The copy is mandatory. `save()` returning the live state object gives
//  you a snapshot that mutates along with the editor, and the bug looks
//  like "undo does nothing".
//  When NOT to use: big state plus frequent checkpoints — every snapshot
//  is a full copy. That is where you switch to commands or structural
//  sharing (immer, persistent data structures).
//  In the wild: React `useState` snapshots in time-travel devtools, VM
//  and DB checkpoints/savepoints, `git stash`, canvas undo buffers.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createEditor(initial = '') {
  let text = initial;
  let cursor = initial.length;

  return {
    text: () => text,
    cursor: () => cursor,

    type(insert) {
      text = text.slice(0, cursor) + insert + text.slice(cursor);
      cursor += insert.length;
      return text;
    },

    moveTo(index) {
      cursor = Math.max(0, Math.min(index, text.length));
      return cursor;
    },

    deleteBack(count) {
      const from = Math.max(0, cursor - count);
      text = text.slice(0, from) + text.slice(cursor);
      cursor = from;
      return text;
    },

    // originator: only this object knows what "all of my state" means
    save: () => Object.freeze({ text, cursor }),

    restore(memento) {
      text = memento.text;
      cursor = memento.cursor;
      return text;
    },
  };
}

export function createHistory(editor, limit = Infinity) {
  const snapshots = [];

  return {
    checkpoint() {
      snapshots.push(editor.save());
      while (snapshots.length > limit) snapshots.shift();
      return snapshots.length;
    },

    undo() {
      const memento = snapshots.pop();
      if (!memento) return false;
      editor.restore(memento);
      return true;
    },

    depth: () => snapshots.length,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the editor types at the cursor and tracks it', () => {
  const ed = createEditor('hello');
  eq([ed.text(), ed.cursor()], ['hello', 5]);
  ed.moveTo(0);
  ed.type('oh ');
  eq([ed.text(), ed.cursor()], ['oh hello', 3]);
  ed.deleteBack(3);
  eq([ed.text(), ed.cursor()], ['hello', 0]);
});

test('restore puts back text and cursor together', () => {
  const ed = createEditor('hello');
  const snap = ed.save();
  ed.moveTo(0);
  ed.type('oh ');
  ed.restore(snap);
  eq([ed.text(), ed.cursor()], ['hello', 5]);
});

test('restore rolls back edits nobody recorded', () => {
  const ed = createEditor('draft');
  const history = createHistory(ed);
  history.checkpoint();
  ed.type('!');
  ed.moveTo(0);
  ed.type('final ');
  eq(ed.text(), 'final draft!');
  eq(history.undo(), true);
  eq([ed.text(), ed.cursor()], ['draft', 5]);
});

test('the caretaker rewinds to the most recent checkpoint first', () => {
  const ed = createEditor('');
  const history = createHistory(ed);
  ed.type('a');
  history.checkpoint();
  ed.type('b');
  history.checkpoint();
  ed.type('c');
  eq(history.depth(), 2);
  history.undo();
  eq(ed.text(), 'ab');
  history.undo();
  eq(ed.text(), 'a');
});

test('the history keeps only the last `limit` snapshots', () => {
  const ed = createEditor('');
  const history = createHistory(ed, 2);
  for (const ch of ['a', 'b', 'c']) {
    ed.type(ch);
    history.checkpoint();
  }
  ed.type('d');
  eq(history.depth(), 2);
  eq(history.undo(), true);
  eq(ed.text(), 'abc');
  eq(history.undo(), true);
  eq(ed.text(), 'ab');
  eq(history.undo(), false);
  eq(ed.text(), 'ab');
});

test('a memento is a value: restore it as often as you like', () => {
  const ed = createEditor('base');
  const snap = ed.save();
  ed.type(' one');
  ed.restore(snap);
  eq(ed.text(), 'base');
  ed.type(' two');
  ed.restore(snap);
  eq(ed.text(), 'base');
});

test('a memento cannot be rewritten after the fact', () => {
  const ed = createEditor('locked');
  const snap = ed.save();
  throws(() => {
    snap.text = 'tampered';
  });
  ed.type('!');
  ed.restore(snap);
  eq(ed.text(), 'locked');
});

test('editing continues from the restored cursor', () => {
  const ed = createEditor('hello');
  const snap = ed.save();
  ed.type(' world');
  ed.restore(snap);
  ed.type('!');
  eq([ed.text(), ed.cursor()], ['hello!', 6]);
  ok(ed.text().length === 6);
});
