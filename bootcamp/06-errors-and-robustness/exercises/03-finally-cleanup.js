// ─────────────────────────────────────────────────────────────────────────
//  03 · finally cleanup                                       ★★☆ core
//  concepts: try/finally · resource lifetimes
//  run: node 03-finally-cleanup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Anything you open you must close: file handles, database connections,
//  spinners, locks. "Close it at the end of the function" is a bug — the
//  end of the function is exactly where you never arrive when something
//  throws.
//
//  withFile(file, fn) borrows a file for the duration of one callback:
//    - open it, run fn(file), return whatever fn returned
//    - close it afterwards — ALWAYS, including when fn throws
//    - do not swallow the error: it must still reach the caller
//
//      withFile(f, (h) => h.read())  → 'notes.txt contents'
//      withFile(f, () => { throw e; })  → throws e, and f is closed
//
//  hint: `try { ... } finally { ... }` is legal with no catch at all.

import { test, eq, ok } from '../../_lib/check.js';

export function withFile(file, fn) {
  throw new Error('TODO');
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
