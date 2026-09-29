// ─────────────────────────────────────────────────────────────────────────
//  45 · toAsyncIterator (push API → for await) — SOLUTION  ★★★ stretch
//  run: node 45-emitter-async-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole bridge is two arrays that are never both
//  non-empty. `buffer` holds values the producer pushed before anyone
//  asked; `waiters` holds the resolve/reject pairs of consumers who asked
//  before anything arrived. `onData` looks for a waiter first and only
//  buffers if there is none; `next()` looks in the buffer first and only
//  parks a waiter if it is empty.
//  That buffer IS the backpressure story — or rather its absence. This
//  queue grows without limit, so a fast producer and a slow consumer will
//  eat memory. Real bridges bound the buffer and pause the source (that is
//  what `stream.Readable` does for you); knowing where the unbounded
//  growth lives is the point.
//  Listener hygiene: one `cleanup` used by end, error AND `return()`, so
//  `break`, `throw` and a normal finish all leave the emitter clean.
//  `for await` calls `return()` on break — implementing it is what makes
//  the loop safe to abandon.
//  Wrong turn: `emitter.on(name, resolveNext)` with no buffer. Every event
//  that lands between two `next()` calls is silently lost, and the bug
//  only shows up under load.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

// Emits after `ms`. An 'error' with no listener THROWS, so skip that
// while the exercise is still a TODO.
export const emitLater = (emitter, ms, name, ...args) =>
  setTimeout(() => {
    if (name === 'error' && emitter.listenerCount('error') === 0) return;
    emitter.emit(name, ...args);
  }, ms);

export function toAsyncIterator(emitter, name, { endEvent = 'end' } = {}) {
  const buffer = [];
  const waiters = [];
  let ended = false;
  let failure = null;

  const cleanup = () => {
    emitter.off(name, onData);
    emitter.off(endEvent, onEnd);
    emitter.off('error', onError);
  };

  const onData = (value) => {
    const waiter = waiters.shift();
    if (waiter) waiter.resolve({ value, done: false });
    else buffer.push(value);
  };

  const onEnd = () => {
    ended = true;
    cleanup();
    while (waiters.length) {
      waiters.shift().resolve({ value: undefined, done: true });
    }
  };

  const onError = (err) => {
    failure = err;
    cleanup();
    while (waiters.length) waiters.shift().reject(err);
  };

  emitter.on(name, onData);
  emitter.on(endEvent, onEnd);
  emitter.on('error', onError);

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      if (buffer.length) {
        return Promise.resolve({ value: buffer.shift(), done: false });
      }
      if (failure) return Promise.reject(failure);
      if (ended) return Promise.resolve({ value: undefined, done: true });
      return new Promise((resolve, reject) =>
        waiters.push({ resolve, reject })
      );
    },
    return() {
      ended = true;
      cleanup();
      return Promise.resolve({ value: undefined, done: true });
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('yields the payloads in order', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'row', 'a');
  emitLater(em, 12, 'row', 'b');
  emitLater(em, 14, 'end');
  const seen = [];
  for await (const row of rows) seen.push(row);
  eq(seen, ['a', 'b']);
});

test('buffers events emitted before the consumer asks', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  em.emit('row', 1);
  em.emit('row', 2);
  em.emit('row', 3);
  em.emit('end');
  const seen = [];
  for await (const row of rows) seen.push(row);
  eq(seen, [1, 2, 3], 'nothing may be dropped before the first next()');
});

test('ends straight away when the end event arrives first', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'end');
  const seen = [];
  for await (const row of rows) seen.push(row);
  eq(seen, []);
});

test('a slow consumer misses nothing', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'row', 1);
  emitLater(em, 12, 'row', 2);
  emitLater(em, 14, 'row', 3);
  emitLater(em, 16, 'end');
  const seen = [];
  for await (const row of rows) {
    await sleep(10);
    seen.push(row);
  }
  eq(seen, [1, 2, 3]);
});

test('an error event makes the loop throw', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'row', 'a');
  emitLater(em, 14, 'error', new Error('stream broke'));
  const seen = [];
  await rejects(async () => {
    for await (const row of rows) seen.push(row);
  }, 'stream broke');
  eq(seen, ['a']);
});

test('breaking out of the loop removes every listener', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'row', 1);
  emitLater(em, 12, 'row', 2);
  for await (const row of rows) {
    ok(row === 1);
    break;
  }
  eq(em.listenerCount('row'), 0);
  eq(em.listenerCount('end'), 0);
  eq(em.listenerCount('error'), 0);
});

test('cleans up when the stream ends normally', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row');
  emitLater(em, 10, 'end');
  for await (const row of rows) ok(row);
  eq(em.listenerCount('row'), 0);
  eq(em.listenerCount('end'), 0);
  eq(em.listenerCount('error'), 0);
});

test('honours a custom end event name', async () => {
  const em = new EventEmitter();
  const rows = toAsyncIterator(em, 'row', { endEvent: 'close' });
  emitLater(em, 10, 'row', 'only');
  emitLater(em, 12, 'close');
  const seen = [];
  for await (const row of rows) seen.push(row);
  eq(seen, ['only']);
});
