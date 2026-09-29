// ─────────────────────────────────────────────────────────────────────────
//  13 · events.once with a signal — SOLUTION                ★☆☆ warm-up
//  run: node 13-once-with-signal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one line, three things you would otherwise hand-roll.
//  once() resolves with the full argument list because events are
//  variadic — `emitter.emit('ready', 'db', 5432)` has no single "value".
//  It subscribes to 'error' at the same time, so an emitter that fails
//  rejects your promise instead of leaving it pending forever. And it
//  removes BOTH listeners on the way out, whichever way it settles —
//  including on abort, which is what stops a timed-out wait from leaking
//  a handler onto a long-lived emitter.
//  The rejection on abort is an AbortError (`error.name`), the same
//  shape fetch() and fs promises use, so one `if (err.name ===
//  'AbortError')` branch handles cancellation everywhere.
//  Wrong turn: `new Promise((res) => emitter.once('ready', res))`. It
//  drops extra arguments, ignores 'error', cannot be cancelled, and
//  leaves a listener behind on every path that is not the happy one.

import { test, eq, ok } from '../../_lib/check.js';
import { EventEmitter, once } from 'node:events';

export function waitFor(emitter, eventName, signal) {
  return once(emitter, eventName, { signal });
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
