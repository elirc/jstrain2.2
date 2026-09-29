// ─────────────────────────────────────────────────────────────────────────
//  26 · readLines · firstMatching — SOLUTION                   ★★☆ core
//  run: node 26-generator-cleanup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `try { ...yield... } finally { close() }` is the whole
//  answer, and it works because of a rule that surprises people —
//  .return() does not just mark the generator done, it RESUMES it at
//  the paused yield as if a return statement had appeared there. Your
//  finally block therefore runs, on the generator's own stack, before
//  the { done: true } comes back.
//
//  Everything else routes through that one hook: `break` in a for-of
//  calls .return() for you, an exception thrown out of the loop body
//  does too, and .throw() resumes the yield with an exception, which
//  also unwinds through finally. Four exits, one cleanup path.
//
//  The `handle.open()` call sits before the try and above every yield,
//  so it does not run until the first pull — generators execute no code
//  until then, which is exactly what test one is checking.
//
//  firstMatching's early `return` inside for-of is the same mechanism
//  from the consumer side. Classic wrong turn: driving readLines with a
//  hand-written while + next() loop and returning out of it — that
//  leaves the generator suspended forever, and the handle open.

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
  handle.open();
  try {
    for (const line of handle.lines) yield line;
  } finally {
    handle.close();
  }
}

export function firstMatching(handle, predicate) {
  for (const line of readLines(handle)) {
    if (predicate(line)) return line;
  }
  return undefined;
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
