// ─────────────────────────────────────────────────────────────────────────
//  13 · events.once with a signal                           ★☆☆ warm-up
//  concepts: node:events · once · AbortSignal · listener hygiene
//  run: node 13-once-with-signal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `events.once(emitter, name)` turns "the next time this fires" into a
//  promise — and it resolves with an ARRAY, because an event can carry
//  any number of arguments. It also watches 'error' for you, so a failing
//  emitter rejects instead of hanging.
//
//      await waitFor(server, 'listening')     → []
//      await waitFor(socket, 'data')          → [chunk]
//
//  Add the escape hatch. With a signal, "wait for an event that may never
//  come" stops being a permanent leak:
//
//      waitFor(emitter, 'ready', controller.signal)
//      controller.abort()   → the promise rejects with an AbortError
//
//  hint: once() takes an options object as its third argument

import { test, eq, ok } from '../../_lib/check.js';
import { EventEmitter, once } from 'node:events';

export function waitFor(emitter, eventName, signal) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the arguments the event carried', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready', 'db', 5432), 5);
  eq(await waitFor(emitter, 'ready'), ['db', 5432]);
});

test('an event with no arguments resolves with an empty array', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready'), 5);
  eq(await waitFor(emitter, 'ready'), []);
});

test('passing no signal at all still works', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('tick', 1), 5);
  eq(await waitFor(emitter, 'tick', undefined), [1]);
});

test('an already-aborted signal rejects with an AbortError', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  controller.abort();
  const outcome = await waitFor(emitter, 'never', controller.signal).then(
    () => 'resolved',
    (error) => error.name
  );
  eq(outcome, 'AbortError');
});

test('aborting while you wait rejects', async () => {
  const emitter = new EventEmitter();
  const controller = new AbortController();
  const waiting = waitFor(emitter, 'never', controller.signal);
  const outcome = waiting.then(() => 'resolved', (error) => error.name);
  setTimeout(() => controller.abort(), 10);
  eq(await outcome, 'AbortError');
  eq(emitter.listenerCount('never'), 0);
});

test('it leaves no listener behind once it settles', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready'), 5);
  await waitFor(emitter, 'ready');
  eq(emitter.listenerCount('ready'), 0);
  eq(emitter.listenerCount('error'), 0);
});

test("an 'error' event rejects with that error", async () => {
  const emitter = new EventEmitter();
  const waiting = waitFor(emitter, 'ready');
  setTimeout(() => emitter.emit('error', new Error('socket died')), 5);
  const message = await waiting.then(
    () => 'resolved',
    (error) => error.message
  );
  eq(message, 'socket died');
  ok(emitter.listenerCount('error') === 0, 'and it unsubscribes');
});
