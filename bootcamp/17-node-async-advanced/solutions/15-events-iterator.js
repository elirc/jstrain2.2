// ─────────────────────────────────────────────────────────────────────────
//  15 · events as an async iterator — SOLUTION              ★★★ stretch
//  run: node 15-events-iterator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `on()` subscribes the moment you call it and queues every
//  event in an internal buffer, so the three synchronous emits in the
//  burst test are all still there when the loop gets around to asking for
//  them. That buffering is the difference between an iterator and a
//  listener: a listener that awaits inside itself misses nothing but runs
//  handlers concurrently; a for-await loop processes strictly one at a
//  time and lets the queue grow — real back-pressure, and a real memory
//  risk if you never drain it.
//  Each iteration yields the ARGUMENT ARRAY, so `[value]` destructures
//  the first argument out.
//  Aborting is the designed exit: the iterator rejects with an
//  AbortError and, on the way out, removes its listeners. Catching that
//  one error name and returning normally turns "cancelled" into a
//  result instead of a failure — while a genuine error still propagates.
//  Wrong turn: `break`ing out of the loop and expecting cleanup by
//  magic. break DOES call the iterator's return() and does unsubscribe,
//  but you need a condition to break on — and "the caller changed their
//  mind" arrives as a signal, not as an event.

import { test, eq, ok, sleep } from '../../_lib/check.js';
import { EventEmitter, on } from 'node:events';

// Returns a promise for the collected values.
export async function collectUntilAborted(emitter, eventName, signal) {
  const collected = [];
  try {
    for await (const [value] of on(emitter, eventName, { signal })) {
      collected.push(value);
    }
  } catch (error) {
    if (error.name !== 'AbortError') throw error; // a real failure
  }
  return collected;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('collects the values emitted before the abort, in order', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 'a');
  await sleep(5);
  emitter.emit('tick', 'b');
  await sleep(5);
  controller.abort();
  eq(await collecting, ['a', 'b']);
});

test('a synchronous burst is buffered, not dropped', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 1);
  emitter.emit('tick', 2);
  emitter.emit('tick', 3);
  await sleep(5);
  controller.abort();
  eq(await collecting, [1, 2, 3]);
});

test('an abort with nothing emitted gives an empty list', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  controller.abort();
  eq(await collecting, []);
});

test('an already-aborted signal returns an empty list right away', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  controller.abort();
  eq(await collectUntilAborted(emitter, 'tick', controller.signal), []);
});

test('it unsubscribes when it stops', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 1);
  ok(emitter.listenerCount('tick') > 0, 'it should be listening while it runs');
  await sleep(5);
  controller.abort();
  await collecting;
  eq(emitter.listenerCount('tick'), 0);
});

test('the abort is swallowed — it resolves, it does not reject', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const collecting = collectUntilAborted(emitter, 'tick', controller.signal);
  await sleep(5);
  emitter.emit('tick', 'only');
  await sleep(5);
  controller.abort();
  const outcome = await collecting.then(
    (values) => values,
    (error) => `rejected: ${error.name}`
  );
  eq(outcome, ['only']);
});
