// ─────────────────────────────────────────────────────────────────────────
//  15 · EventEmitter — SOLUTION                            ★☆☆ warm-up
//  run: node 15-event-emitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: off() matches listeners by identity, so the unsubscribe
//  closure has to capture the exact function that was registered. Wrap
//  the handler (`(...args) => handler(...args)`) and you have created a
//  new function that off() will never find — the leak that keeps a whole
//  request object alive for the life of the process.
//  collect returns the array immediately and pushes into it later; that
//  works because arrays are mutable references, and it is the shape most
//  test helpers use.
//  once() removes itself after the first delivery, which the listenerCount
//  assertion proves.
//  The last test is the one to remember: 'error' is special. An emitter
//  with no 'error' listener THROWS the error instead of dropping it, and
//  in async code that becomes an uncaught exception that kills the
//  process. Every long-lived emitter needs an error listener.

import { test, eq, ok, spy, throws } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function subscribe(emitter, eventName, handler) {
  emitter.on(eventName, handler);
  return () => emitter.off(eventName, handler);
}

export function collect(emitter, eventName) {
  const seen = [];
  emitter.on(eventName, (payload) => seen.push(payload));
  return seen;
}

export function firstOnly(emitter, eventName, handler) {
  emitter.once(eventName, handler);
  return emitter;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a subscriber receives what is emitted', () => {
  const emitter = new EventEmitter();
  const handler = spy();
  subscribe(emitter, 'data', handler);
  emitter.emit('data', 42);
  eq(handler.calls, [[42]]);
});

test('handlers run synchronously, in the order they subscribed', () => {
  const emitter = new EventEmitter();
  const order = [];
  subscribe(emitter, 'data', () => order.push('first'));
  subscribe(emitter, 'data', () => order.push('second'));
  emitter.emit('data');
  eq(order, ['first', 'second']);
});

test('the returned function unsubscribes', () => {
  const emitter = new EventEmitter();
  const handler = spy();
  const stop = subscribe(emitter, 'data', handler);
  emitter.emit('data', 1);
  stop();
  emitter.emit('data', 2);
  eq(handler.callCount, 1);
  eq(emitter.listenerCount('data'), 0);
});

test('collect gathers payloads in order', () => {
  const emitter = new EventEmitter();
  const seen = collect(emitter, 'data');
  eq(seen, []);
  emitter.emit('data', 'a');
  emitter.emit('data', 'b');
  eq(seen, ['a', 'b']);
});

test('collect only hears its own event', () => {
  const emitter = new EventEmitter();
  const seen = collect(emitter, 'data');
  emitter.emit('other', 'nope');
  emitter.emit('data', 'yes');
  eq(seen, ['yes']);
});

test('firstOnly fires exactly once', () => {
  const emitter = new EventEmitter();
  const handler = spy();
  firstOnly(emitter, 'ready', handler);
  emitter.emit('ready', 1);
  emitter.emit('ready', 2);
  eq(handler.calls, [[1]]);
  eq(emitter.listenerCount('ready'), 0);
});

test('an "error" event with no listener throws', () => {
  const emitter = new EventEmitter();
  const stop = subscribe(emitter, 'data', () => {});
  ok(typeof stop === 'function');
  emitter.emit('unheard-of');
  throws(() => emitter.emit('error', new Error('boom')), 'boom');
});
