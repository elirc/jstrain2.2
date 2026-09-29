// ─────────────────────────────────────────────────────────────────────────
//  16 · events meet promises — SOLUTION                       ★★☆ core
//  run: node 16-event-promise.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the promise executor sets up both outcomes and each one
//  tears the other down. On the happy path clearTimeout kills the timer;
//  on the timeout path emitter.off removes the listener. Skip either and
//  you get the two classic bugs: a process that will not exit because a
//  timer is still pending, or a listener list that grows on every request
//  until Node prints the MaxListenersExceededWarning.
//  emitter.once removes its own listener when it fires, which is why the
//  happy path only has to clear the timer.
//  createBus is a facade: callers get on/emit/once and never see the
//  emitter, so nothing outside can remove your listeners or emit 'error'
//  at you. on() returns the unsubscribe, once() reuses waitForEvent.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function waitForEvent(emitter, eventName, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const onEvent = (payload) => {
      clearTimeout(timer);
      resolve(payload);
    };
    const timer = setTimeout(() => {
      emitter.off(eventName, onEvent);
      reject(new Error(`timed out waiting for "${eventName}"`));
    }, timeoutMs);
    emitter.once(eventName, onEvent);
  });
}

export function createBus() {
  const emitter = new EventEmitter();
  return {
    emit(type, payload) {
      emitter.emit(type, payload);
    },
    on(type, handler) {
      emitter.on(type, handler);
      return () => emitter.off(type, handler);
    },
    once(type, timeoutMs) {
      return waitForEvent(emitter, type, timeoutMs);
    },
  };
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
