// ─────────────────────────────────────────────────────────────────────────
//  16 · events meet promises                                  ★★☆ core
//  concepts: EventEmitter · promise bridging · timeouts · cleanup
//  run: node 16-event-promise.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Callbacks and promises meet at exactly this function: wait for the
//  next 'ready' (or 'close', or 'message'), but never wait forever.
//
//      const value = await waitForEvent(emitter, 'ready', 50);
//        · resolves with the payload of the first matching emit
//        · rejects with a message containing 'timed out' after 50ms
//        · leaves NO listener and NO pending timer behind, either way
//
//  Then wrap an emitter so callers never touch it directly:
//
//      const bus = createBus();
//      const off = bus.on('tick', (n) => console.log(n));  // off() detaches
//      bus.emit('tick', 1);
//      const next = await bus.once('tick', 50);            // a promise
//
//  hint: `new Promise((resolve, reject) => …)` around emitter.once, plus
//  a setTimeout you clear on the happy path — a stray timer keeps the
//  whole process alive for as long as it runs.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function waitForEvent(emitter, eventName, timeoutMs = 1000) {
  throw new Error('TODO');
}

export function createBus() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the payload of the next matching event', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready', { id: 7 }), 5);
  eq(await waitForEvent(emitter, 'ready', 100), { id: 7 });
});

test('ignores other events while it waits', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('noise', 'a'), 2);
  setTimeout(() => emitter.emit('ready', 'b'), 8);
  eq(await waitForEvent(emitter, 'ready', 100), 'b');
});

test('rejects when nothing arrives in time', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready', 1), 0);
  eq(await waitForEvent(emitter, 'ready', 100), 1);
  await rejects(() => waitForEvent(emitter, 'never', 20), 'timed out');
});

test('leaves no listener behind after resolving', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready', 1), 5);
  await waitForEvent(emitter, 'ready', 100);
  eq(emitter.listenerCount('ready'), 0);
});

test('leaves no listener behind after timing out', async () => {
  const emitter = new EventEmitter();
  setTimeout(() => emitter.emit('ready', 1), 0);
  eq(await waitForEvent(emitter, 'ready', 100), 1);
  await rejects(() => waitForEvent(emitter, 'never', 20));
  eq(emitter.listenerCount('never'), 0);
});

test('bus.on receives what bus.emit sends', () => {
  const bus = createBus();
  const handler = spy();
  bus.on('tick', handler);
  bus.emit('tick', 1);
  bus.emit('tick', 2);
  eq(handler.calls, [[1], [2]]);
});

test('bus.on hands back an off switch', () => {
  const bus = createBus();
  const handler = spy();
  const off = bus.on('tick', handler);
  ok(typeof off === 'function');
  off();
  bus.emit('tick', 1);
  eq(handler.callCount, 0);
});

test('bus.once resolves on the next emit', async () => {
  const bus = createBus();
  setTimeout(() => bus.emit('tick', 'now'), 5);
  eq(await bus.once('tick', 100), 'now');
});
