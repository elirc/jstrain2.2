// ─────────────────────────────────────────────────────────────────────────
//  15 · EventEmitter                                       ★☆☆ warm-up
//  concepts: node:events · on/emit · once · off
//  run: node 15-event-emitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  EventEmitter is Node's in-process publish/subscribe. Servers, streams
//  and processes are all emitters, so learning the four calls — on, once,
//  emit, off — unlocks most of the standard library.
//
//      const stop = subscribe(emitter, 'data', (x) => console.log(x));
//      emitter.emit('data', 1);   // handler runs, synchronously
//      stop();                    // handler is detached again
//
//      const seen = collect(emitter, 'data');   // an array that fills up
//      emitter.emit('data', 'a');
//      seen                                     → ['a']
//
//      firstOnly(emitter, 'ready', fn)   // fn runs at most one time
//
//  subscribe returns an unsubscribe function — a habit worth keeping,
//  because a listener you cannot remove is a memory leak with a delay.

import { test, eq, ok, spy, throws } from '../../_lib/check.js';
import { EventEmitter } from 'node:events';

export function subscribe(emitter, eventName, handler) {
  throw new Error('TODO');
}

export function collect(emitter, eventName) {
  throw new Error('TODO');
}

export function firstOnly(emitter, eventName, handler) {
  throw new Error('TODO');
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
