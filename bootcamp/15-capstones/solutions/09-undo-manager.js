// ─────────────────────────────────────────────────────────────────────────
//  09 · undo manager — SOLUTION                             ★★★ capstone
//  concepts: command pattern · stacks · composites · injected clocks
//  time: 35–45 min · 4 stages · 25 tests
//  run: node 09-undo-manager.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. Two arrays and a command object. `done` is the undo
//  stack, `undone` is the redo stack, and a command is any object with
//  `do()` and `undo()` — the manager never learns what a command means.
//  That is the whole point of the command pattern: history stops being
//  "a copy of the document at every keystroke" (which is what people try
//  first, and why their editor eats 400MB) and becomes a list of tiny
//  reversible functions. The document is never cloned; it is replayed.
//
//  The one invariant that keeps it honest: every state reachable by
//  undoing must be reachable again by redoing, so a NEW command has to
//  throw the redo stack away. You just created a different future.
//
//  Stage 1 — the two stacks. undo(): pop from `done`, call undo(), push
//  onto `undone`. redo() is the same three lines with the arrays swapped.
//  Returning true/false instead of throwing is what lets a UI wire the
//  Ctrl+Z key to `undo()` without asking any questions first.
//
//  Stage 2 — capacity. `while (done.length > limit) done.shift()` from
//  the FRONT: history is bounded from the oldest end, and what falls off
//  is gone forever, not "compressed". Labels come almost free once every
//  entry carries one, and they are what turns a grey menu item into
//  "Undo Rename Layer".
//
//  Stage 3 — grouping. `composite()` is the pattern with a name: an
//  object with do/undo that happens to contain a list of commands. Since
//  it satisfies the same shape as a leaf command, the stack cannot tell
//  the difference — that is the Composite pattern, and it is why nesting
//  works with no extra code. Undo runs the children BACKWARDS; anything
//  else undoes step 2 while step 1's effect is still there.
//
//  Stage 4 — coalescing. Coalescing is grouping the machine does for
//  you: same `key`, close enough in time, merge into the entry already
//  on top. That is why `composite()` gets reused here — a burst of six
//  keystrokes is exactly a group of six commands. Three details:
//    · The clock is INJECTED (`now`). A history engine that reads
//      Date.now() directly is untestable without sleeping, and a test
//      that sleeps is a test that flakes on a loaded CI box.
//    · Merging restarts the window (`time = at`). Otherwise a burst is
//      cut off 300ms after it started rather than after it stopped.
//    · `mergeable` is cleared by undo/redo/endGroup. Without it: type
//      "ab", undo, type "c" — and "c" silently joins an entry the user
//      already stepped out of, so one Ctrl+Z now deletes both.
//
//  Classic wrong turn: making undo() call `command.do()` in reverse
//  "because it is symmetric". It is not. Reversing a command needs the
//  data it destroyed, which is why `del()` below captures the deleted
//  character in a closure at do() time — an undo stack is as much a
//  store of lost data as it is a store of functions.

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

// One entry made out of many commands. It has the same shape as a leaf
// command, so nothing above it needs to know it is a list.
function composite(label, key, commands) {
  return {
    label,
    key,
    do: () => {
      for (const c of commands) c.do();
    },
    undo: () => {
      for (let i = commands.length - 1; i >= 0; i -= 1) commands[i].undo();
    },
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
    this.mergeable = false; // stage 4: may the top entry still absorb?
  }

  // stage 1 — run it, record it, and kill the redo future.
  // stage 3 — inside a group, collect instead of recording.
  // stage 4 — or merge into the entry already on top.
  execute(command) {
    command.do();
    this.undone.length = 0;

    const open = this.groups.at(-1);
    if (open) {
      open.commands.push(command);
      return this;
    }

    const at = this.now();
    if (this.#absorbs(command, at)) {
      const top = this.done.pop();
      const merged = composite(top.label, top.key, [top, command]);
      this.done.push({ ...merged, time: at });
      return this;
    }
    this.#record({
      label: command.label ?? null,
      key: command.key ?? null,
      do: command.do,
      undo: command.undo,
      time: at,
    });
    return this;
  }

  // stage 1 — pop, revert, keep it for redo.
  undo() {
    if (!this.canUndo()) return false;
    const entry = this.done.pop();
    entry.undo();
    this.undone.push(entry);
    this.mergeable = false; // stage 4: stepping out ends the burst
    return true;
  }

  // stage 1 — the mirror image, arrays swapped.
  redo() {
    if (!this.canRedo()) return false;
    const entry = this.undone.pop();
    entry.do();
    this.done.push(entry);
    this.mergeable = false;
    return true;
  }

  canUndo() {
    return this.done.length > 0;
  }

  canRedo() {
    return this.undone.length > 0;
  }

  size() {
    return this.done.length;
  }

  // stage 2 — what the menu item should say, or null to grey it out.
  undoLabel() {
    return this.done.at(-1)?.label ?? null;
  }

  redoLabel() {
    return this.undone.at(-1)?.label ?? null;
  }

  clear() {
    this.done.length = 0;
    this.undone.length = 0;
    this.mergeable = false;
    return this;
  }

  // stage 3 — open a frame; every execute lands in it until endGroup.
  beginGroup(label = null) {
    this.groups.push({ label, commands: [] });
    this.mergeable = false;
    return this;
  }

  // stage 3 — close it into ONE composite entry. Empty groups vanish;
  // a nested group is just another command in its parent's list.
  endGroup() {
    const frame = this.groups.pop();
    if (!frame) throw new Error('endGroup() without beginGroup()');
    if (frame.commands.length === 0) return this;

    const merged = composite(frame.label, null, frame.commands);
    const parent = this.groups.at(-1);
    if (parent) parent.commands.push(merged);
    else this.#record({ ...merged, time: this.now() });
    this.mergeable = false; // a group never absorbs the next command
    return this;
  }

  // stage 2 — bounded from the oldest end.
  #record(entry) {
    this.done.push(entry);
    while (this.done.length > this.limit) this.done.shift();
    this.mergeable = true;
  }

  // stage 4 — every condition here is a bug someone shipped once.
  #absorbs(command, at) {
    const top = this.done.at(-1);
    return (
      this.coalesceMs > 0 &&
      this.mergeable &&
      top !== undefined &&
      command.key != null &&
      top.key === command.key &&
      at - top.time <= this.coalesceMs
    );
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
