// ─────────────────────────────────────────────────────────────────────────
//  20 · memento snapshots                                        ★★☆ core
//  concepts: memento · originator/caretaker · snapshot vs replay
//  run: node exercises/20-memento-editor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 15 undid edits by reversing each command. Some state is not
//  reversible that way — you just want a photograph of "how it was".
//
//  Build an editor that can hand out an opaque snapshot of ALL of its
//  state (text and cursor together) and swallow one back:
//
//      const ed = createEditor('draft');   // cursor starts at the end
//      const snap = ed.save();             // a memento
//      ed.moveTo(0); ed.type('final ');
//      ed.restore(snap);                   → text 'draft', cursor 5
//
//  Then a caretaker that holds mementos without ever looking inside:
//
//      const history = createHistory(ed, 2);   // keep the last 2
//      history.checkpoint();  history.undo()   → true, editor rewound
//      history.depth()                          → how many are stored
//
//  hint: a memento must be a *copy* of the state, frozen, so later
//  edits — and the caretaker — cannot rewrite the past

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createEditor(initial = '') {
  // text(), cursor(), type(s), moveTo(i), deleteBack(n), save(), restore(m)
  throw new Error('TODO');
}

export function createHistory(editor, limit = Infinity) {
  // checkpoint(), undo() -> boolean, depth()
  throw new Error('TODO');
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
