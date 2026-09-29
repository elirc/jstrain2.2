// ─────────────────────────────────────────────────────────────────────────
//  45 · toAsyncIterator (push API → for await)             ★★★ stretch
//  concepts: async iterators · buffering · listener hygiene
//  run: node 45-emitter-async-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An emitter PUSHES whenever it likes; `for await` PULLS when it is
//  ready. Bridging the two is a queue with two sides. Build
//  `toAsyncIterator(emitter, name, { endEvent })`:
//
//      const rows = toAsyncIterator(db, 'row');
//      for await (const row of rows) { ... }   // ends on the 'end' event
//
//  Rules:
//    · yields the FIRST argument of each `name` event, in order
//    · events that arrive before the consumer asks are BUFFERED, never
//      dropped — a slow consumer must miss nothing
//    · the `endEvent` (default 'end') finishes the loop
//    · an 'error' event makes the loop throw
//    · finishing, throwing, or `break` all remove EVERY listener it added
//
//  hint: two arrays. One holds values nobody has asked for yet; the other
//  holds `resolve` functions for consumers who asked too early. At any
//  moment at least one of them is empty.

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
  throw new Error('TODO');
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
