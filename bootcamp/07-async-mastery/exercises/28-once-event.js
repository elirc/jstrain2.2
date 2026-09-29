// ─────────────────────────────────────────────────────────────────────────
//  28 · once (event → promise)                             ★★★ stretch
//  concepts: EventEmitter · adapters · listener hygiene
//  run: node 28-once-event.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The last adapter you need: events into promises. Streams, sockets and
//  child processes all speak EventEmitter, and awaiting one event is the
//  most common thing you want.
//
//      await once(server, 'listening')       → []
//      await once(job, 'done')               → [result, meta]  (event args)
//      await once(job, 'done')               → rejects if 'error' fires
//
//  Signature: `once(emitter, name, { signal } = {})`. Resolve with the
//  ARRAY of event arguments. Reject if the emitter emits 'error', or if
//  the signal aborts. Whatever happens, remove every listener you added
//  — the tests check listenerCount on both paths.
//
//  hint: one cleanup function, called from all three handlers

import { test, eq, rejects } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

const emitLater = (emitter, name, ...args) =>
  setTimeout(() => {
    // An 'error' with no listener throws — skip it while this is a TODO.
    if (name === 'error' && emitter.listenerCount('error') === 0) return;
    emitter.emit(name, ...args);
  }, 5);

export function once(emitter, name, options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the event arguments as an array', async () => {
  const em = new EventEmitter();
  emitLater(em, 'done', 'result', { at: 1 });
  eq(await once(em, 'done'), ['result', { at: 1 }]);
});

test('resolves with [] for an event that carries nothing', async () => {
  const em = new EventEmitter();
  emitLater(em, 'listening');
  eq(await once(em, 'listening'), []);
});

test('ignores events with a different name', async () => {
  const em = new EventEmitter();
  emitLater(em, 'other', 'nope');
  emitLater(em, 'done', 'yes');
  eq(await once(em, 'done'), ['yes']);
});

test('rejects when the emitter emits an error', async () => {
  const em = new EventEmitter();
  emitLater(em, 'error', new Error('socket died'));
  await rejects(once(em, 'done'), 'socket died');
});

test('leaves no listeners behind after resolving', async () => {
  const em = new EventEmitter();
  emitLater(em, 'done', 1);
  await once(em, 'done');
  eq([em.listenerCount('done'), em.listenerCount('error')], [0, 0]);
});

test('leaves no listeners behind after rejecting', async () => {
  const em = new EventEmitter();
  emitLater(em, 'error', new Error('boom'));
  await rejects(once(em, 'done'), 'boom');
  eq([em.listenerCount('done'), em.listenerCount('error')], [0, 0]);
});

test('rejects when the signal aborts, and cleans up', async () => {
  const em = new EventEmitter();
  const c = new AbortController();
  const p = once(em, 'done', { signal: c.signal });
  setTimeout(() => c.abort(new Error('gave up')), 5);
  await rejects(p, 'gave up');
  eq(em.listenerCount('done'), 0);
});
