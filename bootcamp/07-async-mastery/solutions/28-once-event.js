// ─────────────────────────────────────────────────────────────────────────
//  28 · once (event → promise) — SOLUTION                  ★★★ stretch
//  run: node 28-once-event.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: register three handlers (the event, 'error', abort) and
//  give them one shared cleanup that removes all three. Because a
//  promise settles once, the first handler to fire wins and the others
//  just disappear — you never need a `settled` flag.
//  Listener hygiene is the point of the exercise. A long-lived emitter
//  plus a helper that leaks one listener per call is how you meet the
//  "MaxListenersExceededWarning: 11 error listeners added" warning in
//  production. The 'error' listener matters twice over: an EventEmitter
//  with no 'error' listener THROWS when something emits one, so
//  forgetting it turns a handled rejection into a crash.
//  Wrong turn: `emitter.once(name, resolve)` — resolve gets only the
//  first event argument, and the error listener is left dangling.

import { test, eq, rejects } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

const emitLater = (emitter, name, ...args) =>
  setTimeout(() => {
    // An 'error' with no listener throws — skip it while this is a TODO.
    if (name === 'error' && emitter.listenerCount('error') === 0) return;
    emitter.emit(name, ...args);
  }, 5);

export function once(emitter, name, options = {}) {
  const { signal } = options;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      emitter.off(name, onEvent);
      emitter.off('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };
    const onEvent = (...args) => {
      cleanup();
      resolve(args);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    emitter.on(name, onEvent);
    emitter.on('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
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
