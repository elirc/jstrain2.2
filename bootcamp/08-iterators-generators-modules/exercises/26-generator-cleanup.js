// ─────────────────────────────────────────────────────────────────────────
//  26 · readLines · firstMatching                              ★★☆ core
//  concepts: return() · throw() · try/finally inside a generator
//  run: node 26-generator-cleanup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A generator that owns a file handle, a DB cursor or a socket has a
//  problem an ordinary function does not: the consumer can walk away
//  mid-stream. `break`, an exception, an early `return` — all of them
//  abandon your loop wherever it was paused. The language gives you one
//  hook for that, and it is `finally`.
//
//      const handle = makeHandle(['a', 'b']);   // .open() / .close()
//      [...readLines(handle)]   → ['a', 'b']    handle.log →
//                                               ['open', 'close']
//
//  readLines: open the handle on the FIRST pull (not when it is
//  called), yield each line, and close it exactly once no matter how
//  the generator ends — drained, broken out of, .return()ed, or
//  .throw()n into.
//
//  firstMatching: return the first line the predicate likes, or
//  undefined, and leave no handle open behind you.
//
//  hint: for-of calls .return() on the generator when you break, which
//        resumes it just long enough to run the finally block

import { test, eq, throws } from '../../_lib/check.js';

// scaffolding: a fake file handle that records what happened to it.
// Do not edit.
function makeHandle(lines) {
  const log = [];
  return {
    lines,
    log,
    open() {
      log.push('open');
    },
    close() {
      log.push('close');
    },
  };
}

export function* readLines(handle) {
  throw new Error('TODO');
}

export function firstMatching(handle, predicate) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it opens on the first pull, not when you call it', () => {
  const handle = makeHandle(['a', 'b']);
  const lines = readLines(handle);
  eq(handle.log, [], 'calling a generator function runs no code');
  lines.next();
  eq(handle.log, ['open']);
});

test('draining it yields every line and closes once', () => {
  const handle = makeHandle(['a', 'b']);
  eq([...readLines(handle)], ['a', 'b']);
  eq(handle.log, ['open', 'close']);
});

test('breaking out of the loop still closes the handle', () => {
  const handle = makeHandle(['a', 'b', 'c']);
  for (const line of readLines(handle)) if (line === 'a') break;
  eq(handle.log, ['open', 'close']);
});

test('return() ends it early and hands back your value', () => {
  const handle = makeHandle(['a', 'b']);
  const lines = readLines(handle);
  lines.next();
  eq(lines.return('bye'), { value: 'bye', done: true });
  eq(handle.log, ['open', 'close']);
});

test('a spent generator does not close twice', () => {
  const handle = makeHandle(['a', 'b']);
  const lines = readLines(handle);
  lines.next();
  lines.return();
  lines.return();
  eq(lines.next(), { value: undefined, done: true });
  eq(handle.log, ['open', 'close']);
});

test('throw() propagates out but the finally still runs', () => {
  const handle = makeHandle(['a', 'b']);
  const lines = readLines(handle);
  lines.next();
  throws(() => lines.throw(new Error('disk on fire')), 'disk on fire');
  eq(handle.log, ['open', 'close']);
});

test('firstMatching returns the first hit and closes', () => {
  const handle = makeHandle(['no', 'yes', 'yes']);
  eq(firstMatching(handle, (line) => line === 'yes'), 'yes');
  eq(handle.log, ['open', 'close']);
});

test('firstMatching with no hit is undefined, and still closes', () => {
  const handle = makeHandle(['no', 'nope']);
  eq(firstMatching(handle, (line) => line === 'yes'), undefined);
  eq(handle.log, ['open', 'close']);
});
