// ─────────────────────────────────────────────────────────────────────────
//  09 · undo manager                                        ★★★ capstone
//  concepts: command pattern · stacks · composites · injected clocks
//  time: 35–45 min · 4 stages · 25 tests
//  run: node 09-undo-manager.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  Every editor you have ever used has this file inside it: VS Code,
//  Figma, Photoshop, Word. Ctrl+Z is not "restore a snapshot" — snapshots
//  of a big document are far too expensive to take on every keystroke. It
//  is a stack of small reversible commands. And the interesting part is
//  not the stack: it is that typing "hello" has to undo as one word, not
//  as five keystrokes, or your users will hate you.
//
//  STAGES — do them in order, run the file after each one
//    1. execute / undo / redo ... two stacks and the rule that links them
//    2. capacity + labels ....... bounded history, "Undo Paste"
//    3. grouping ................ many commands recorded as one entry
//    4. coalescing ★ ............ typing bursts merge, on an injected clock
//
//  THE SPEC
//
//    A command is any object with do() and undo() — the manager never
//    learns what one means:
//
//      { label: 'type', key: 'type', do() {…}, undo() {…} }
//
//      const history = new UndoManager();
//      history.execute(cmd)     // calls cmd.do(), then records it
//      history.undo()           → true  (false if there is nothing left)
//      history.redo()           → true
//      history.canUndo()  history.canRedo()  history.size()
//      history.undoLabel()      → 'type'  (null when that stack is empty)
//      history.clear()
//
//    A fresh execute() must throw the redo stack away: you have just
//    created a different future and the old one is unreachable.
//
//    stage 2 — `new UndoManager({ limit: 3 })` keeps the newest three
//    entries. Older ones fall off the FRONT and are gone for good.
//
//    stage 3 — everything between beginGroup(label) and endGroup() is one
//    entry, undone in reverse order. Groups nest. An empty group records
//    nothing, and endGroup() with no group open throws.
//
//      history.beginGroup('paste');
//      history.execute(a); history.execute(b);
//      history.endGroup();               // size() === 1
//
//    stage 4 — `new UndoManager({ coalesceMs: 300, now: () => t })`.
//    A command whose `key` matches the entry on top of the stack, within
//    coalesceMs of that entry's most recent command, merges into it. No
//    key, a different key, or coalesceMs 0 (the default) → never merge.
//    Undo, redo and endGroup all end the current burst. The clock is
//    injected, so these tests never sleep and never flake.
//
//  hint (stages 3 + 4): write ONE helper that turns a list of commands
//  into a single command-shaped object — do() forwards, undo() forwards
//  backwards. Grouping is that helper called by hand; coalescing is the
//  same helper called by a clock.

import { test, eq, throws } from '../../_lib/check.js';

// ── scaffolding for the tests — no need to change any of this ────────────

// makeDoc() → a one-string "document" plus two command factories:
//   doc.type('a') → appends 'a'        (coalesce key 'type')
//   doc.del()     → removes the last character, remembering it
function makeDoc() {
  const doc = { text: '' };
  doc.type = (ch) => ({
    label: 'type',
    key: 'type',
    do: () => {
      doc.text += ch;
    },
    undo: () => {
      doc.text = doc.text.slice(0, -ch.length);
    },
  });
  doc.del = () => {
    let removed = '';
    return {
      label: 'delete',
      key: 'delete',
      do: () => {
        removed = doc.text.slice(-1);
        doc.text = doc.text.slice(0, -1);
      },
      undo: () => {
        doc.text += removed;
      },
    };
  };
  return doc;
}

// step(trace, name) → a command that only records that it ran, so a test
// can assert the ORDER in which a group was applied and reverted.
function step(trace, name) {
  return {
    label: name,
    do: () => trace.push(`do:${name}`),
    undo: () => trace.push(`undo:${name}`),
  };
}

export class UndoManager {
  constructor({ limit = 100, coalesceMs = 0, now = () => Date.now() } = {}) {
    this.limit = limit; // stage 2: how many entries to keep
    this.coalesceMs = coalesceMs; // stage 4: 0 disables merging
    this.now = now; // stage 4: injected clock, in ms
    this.done = []; // undo stack — oldest first
    this.undone = []; // redo stack
    this.groups = []; // stage 3: open beginGroup frames
  }

  // stage 1 — run the command, record it, drop the redo stack.
  // stage 3 — while a group is open, collect it instead of recording it.
  // stage 4 — or merge it into the entry already on top.
  execute(command) {
    throw new Error('TODO');
  }

  // stage 1 — revert the newest entry and keep it for redo. false when
  // there is nothing left.
  undo() {
    throw new Error('TODO');
  }

  // stage 1 — the mirror image of undo().
  redo() {
    throw new Error('TODO');
  }

  canUndo() {
    throw new Error('TODO');
  }

  canRedo() {
    throw new Error('TODO');
  }

  // stage 2 — how many entries are still undoable.
  size() {
    throw new Error('TODO');
  }

  // stage 2 — what the menu item should say, or null to grey it out.
  undoLabel() {
    throw new Error('TODO');
  }

  redoLabel() {
    throw new Error('TODO');
  }

  clear() {
    throw new Error('TODO');
  }

  // stage 3 — open a frame; every execute lands in it until endGroup().
  beginGroup(label = null) {
    throw new Error('TODO');
  }

  // stage 3 — close it into ONE entry. Empty groups vanish; a nested
  // group is just another command in its parent's list.
  endGroup() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: execute / undo / redo ───────────────────────────────────────

test('execute runs the command and records it', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.execute(doc.type('a'));
  eq(doc.text, 'a');
  eq(history.canUndo(), true);
  eq(history.canRedo(), false);
});

test('undo reverts the last command and reports true', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.execute(doc.type('a'));
  eq(history.undo(), true);
  eq(doc.text, '');
});

test('undo on an empty history returns false and changes nothing', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  eq(history.undo(), false);
  eq(history.redo(), false);
  eq(doc.text, '');
});

test('redo re-applies what undo took away', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.execute(doc.type('a'));
  history.undo();
  eq(history.redo(), true);
  eq(doc.text, 'a');
  eq(history.canRedo(), false);
});

test('undo and redo walk the whole stack, newest first', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  for (const ch of 'abc') history.execute(doc.type(ch));
  eq(doc.text, 'abc');
  history.undo();
  eq(doc.text, 'ab');
  history.undo();
  history.undo();
  eq(doc.text, '');
  history.redo();
  history.redo();
  history.redo();
  eq(doc.text, 'abc');
});

test('canUndo and canRedo track both stacks', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  eq([history.canUndo(), history.canRedo()], [false, false]);
  history.execute(doc.type('a'));
  eq([history.canUndo(), history.canRedo()], [true, false]);
  history.undo();
  eq([history.canUndo(), history.canRedo()], [false, true]);
});

test('a new command throws the redo stack away', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  history.undo();
  eq(history.canRedo(), true);
  history.execute(doc.type('z')); // a different future
  eq(history.canRedo(), false);
  eq(doc.text, 'az');
});

// ── stage 2: capacity, labels, clear ─────────────────────────────────────

test('size counts the entries you can still undo', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  eq(history.size(), 0);
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  eq(history.size(), 2);
  history.undo();
  eq(history.size(), 1);
});

test('the limit drops the oldest entry, not the newest', () => {
  const doc = makeDoc();
  const history = new UndoManager({ limit: 3 });
  for (const ch of 'abcde') history.execute(doc.type(ch));
  eq(doc.text, 'abcde');
  eq(history.size(), 3);
});

test('what fell off the end can never be undone', () => {
  const doc = makeDoc();
  const history = new UndoManager({ limit: 3 });
  for (const ch of 'abcde') history.execute(doc.type(ch));
  let undos = 0;
  while (history.undo()) undos += 1;
  eq(undos, 3);
  eq(doc.text, 'ab', 'the first two edits are permanent now');
});

test('undoLabel and redoLabel name the next move', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  eq(history.undoLabel(), null);
  history.execute(doc.type('a'));
  history.execute(doc.del());
  eq(history.undoLabel(), 'delete');
  eq(history.redoLabel(), null);
  history.undo();
  eq(history.undoLabel(), 'type');
  eq(history.redoLabel(), 'delete');
});

test('clear empties both stacks without touching the document', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  history.undo();
  history.clear();
  eq([history.canUndo(), history.canRedo()], [false, false]);
  eq(history.size(), 0);
  eq(doc.text, 'a');
});

// ── stage 3: grouping ────────────────────────────────────────────────────

test('commands inside a group become a single entry', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.beginGroup('paste');
  history.execute(doc.type('h'));
  history.execute(doc.type('i'));
  history.endGroup();
  eq(doc.text, 'hi');
  eq(history.size(), 1);
  eq(history.undoLabel(), 'paste');
});

test('undoing a group reverts its commands in reverse order', () => {
  const trace = [];
  const history = new UndoManager();
  history.beginGroup('refactor');
  history.execute(step(trace, 'one'));
  history.execute(step(trace, 'two'));
  history.execute(step(trace, 'three'));
  history.endGroup();
  eq(trace, ['do:one', 'do:two', 'do:three']);
  history.undo();
  eq(trace.slice(3), ['undo:three', 'undo:two', 'undo:one']);
});

test('redoing a group replays it forwards, as one step', () => {
  const doc = makeDoc();
  const history = new UndoManager();
  history.beginGroup('paste');
  history.execute(doc.type('h'));
  history.execute(doc.type('i'));
  history.endGroup();
  history.undo();
  eq(doc.text, '');
  eq(history.redo(), true);
  eq(doc.text, 'hi');
  eq(history.canRedo(), false);
});

test('a group that did nothing records nothing', () => {
  const history = new UndoManager();
  history.beginGroup('noop');
  history.endGroup();
  eq(history.size(), 0);
  eq(history.canUndo(), false);
  throws(() => history.endGroup(), 'endGroup');
});

test('nested groups collapse into the outer one', () => {
  const trace = [];
  const history = new UndoManager();
  history.beginGroup('outer');
  history.execute(step(trace, 'a'));
  history.beginGroup('inner');
  history.execute(step(trace, 'b'));
  history.execute(step(trace, 'c'));
  history.endGroup();
  history.execute(step(trace, 'd'));
  history.endGroup();
  eq(history.size(), 1);
  eq(history.undoLabel(), 'outer');
  history.undo();
  eq(trace.slice(4), ['undo:d', 'undo:c', 'undo:b', 'undo:a']);
});

// ── stage 4: coalescing ★ ────────────────────────────────────────────────

test('same key inside the window merges into one entry', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  history.execute(doc.type('a'));
  t = 40;
  history.execute(doc.type('b'));
  eq(doc.text, 'ab');
  eq(history.size(), 1, 'one burst, one entry');
});

test('undoing a burst reverts every keystroke in it', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  for (const ch of 'hello') {
    history.execute(doc.type(ch));
    t += 50;
  }
  eq(doc.text, 'hello');
  eq(history.size(), 1);
  history.undo();
  eq(doc.text, '', 'the whole word goes, not just the "o"');
});

test('redo replays the whole burst', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  for (const ch of 'hey') {
    history.execute(doc.type(ch));
    t += 10;
  }
  history.undo();
  eq(doc.text, '');
  history.redo();
  eq(doc.text, 'hey');
});

test('a pause longer than the window starts a new entry', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  history.execute(doc.type('a'));
  t = 301;
  history.execute(doc.type('b'));
  eq(history.size(), 2);
  history.undo();
  eq(doc.text, 'a');
});

test('every merge restarts the window', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  history.execute(doc.type('a')); // t = 0
  t = 200;
  history.execute(doc.type('b')); // 200ms after 'a'
  t = 400;
  history.execute(doc.type('c')); // 400ms after 'a', 200 after 'b'
  eq(history.size(), 1, 'the gap that counts is since the LAST keystroke');
  history.undo();
  eq(doc.text, '');
});

test('a different key, or no key at all, never merges', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  eq(history.size(), 1);
  history.execute(doc.del()); // key 'delete' — different burst
  eq(history.size(), 2);
  history.execute({ label: 'x', do: () => {}, undo: () => {} });
  history.execute({ label: 'x', do: () => {}, undo: () => {} });
  eq(history.size(), 4, 'no key means never merge, even twice in a row');
});

test('undo ends the burst — the next keystroke starts a new entry', () => {
  let t = 0;
  const doc = makeDoc();
  const history = new UndoManager({ coalesceMs: 300, now: () => t });
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  history.undo(); // steps out of the burst; doc.text is now ''
  history.execute(doc.type('c'));
  eq(history.size(), 1);
  history.undo();
  eq(doc.text, '', 'undo removed only "c"');
  eq(history.canUndo(), false);
});

test('coalescing stays off until you ask for a window', () => {
  const doc = makeDoc();
  const history = new UndoManager(); // no coalesceMs
  history.execute(doc.type('a'));
  history.execute(doc.type('b'));
  eq(history.size(), 2, 'same key, but the default must not merge');
});
