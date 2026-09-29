// ─────────────────────────────────────────────────────────────────────────
//  03 · finally cleanup — SOLUTION                            ★★☆ core
//  run: node 03-finally-cleanup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `finally` runs on every way out of the block — normal
//  return, thrown error, even an early `return` inside the try. That is
//  the whole point: cleanup is not the happy path's job. No catch is
//  needed here, because withFile has nothing to say about the error; it
//  only promises the file gets closed on the way past.
//  The trap to know: a `return` (or `throw`) inside `finally` REPLACES
//  whatever the try was doing —
//      function bad() { try { return 1; } finally { return 2; } }  // → 2
//      function worse() { try { throw e; } finally { return 2; } } // → 2
//  the error vanishes. Never return from finally; only clean up there.

import { test, eq, ok } from '../../_lib/check.js';

export function withFile(file, fn) {
  file.open();
  try {
    return fn(file);
  } finally {
    file.close();
  }
}

// ── given: a resource that records what happens to it ────────────────────

export function makeFile(name) {
  const log = [];
  const file = {
    name,
    log,
    isOpen: false,
    open() {
      file.isOpen = true;
      log.push('open');
    },
    close() {
      file.isOpen = false;
      log.push('close');
    },
    read() {
      if (!file.isOpen) throw new Error('read on a closed file');
      log.push('read');
      return `${name} contents`;
    },
  };
  return file;
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns whatever the body returned', () => {
  const file = makeFile('notes.txt');
  eq(withFile(file, (handle) => handle.read()), 'notes.txt contents');
});

test('opens before the body runs and closes after', () => {
  const file = makeFile('notes.txt');
  withFile(file, (handle) => handle.read());
  eq(file.log, ['open', 'read', 'close']);
});

test('the file is closed once the happy path is done', () => {
  const file = makeFile('notes.txt');
  withFile(file, (handle) => handle.read());
  eq(file.isOpen, false);
});

test('lets the body error escape to the caller', () => {
  const file = makeFile('notes.txt');
  const caught = thrownBy(() =>
    withFile(file, () => {
      throw new Error('parse failed');
    })
  );
  eq(caught.message, 'parse failed');
});

test('closes the file even when the body throws', () => {
  const file = makeFile('notes.txt');
  thrownBy(() =>
    withFile(file, () => {
      throw new Error('parse failed');
    })
  );
  eq(file.log, ['open', 'close']);
  eq(file.isOpen, false);
});

test('closes exactly once', () => {
  const file = makeFile('notes.txt');
  withFile(file, (handle) => handle.read());
  eq(file.log.filter((entry) => entry === 'close').length, 1);
});

test('the body really does get an open file', () => {
  const file = makeFile('notes.txt');
  withFile(file, (handle) => {
    ok(handle.isOpen);
    return null;
  });
});
