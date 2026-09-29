// ─────────────────────────────────────────────────────────────────────────
//  06 · EventBus                                                ★★☆ core
//  concepts: observer · pub/sub · unsubscribe
//  run: node exercises/06-observer-eventbus.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Checkout must not import the analytics module, the email module and
//  the audit module. It should announce `order:paid` and walk away.
//  Build the bus that makes that possible.
//
//      const bus = createEventBus();
//      const stop = bus.on('order:paid', (order) => ...);
//      bus.emit('order:paid', { id: 7 })   → 1   (handlers called)
//      stop();                             // same as bus.off(...)
//      bus.emit('order:paid', { id: 8 })   → 0
//
//  Rules:
//    · on(channel, handler)  returns an unsubscribe function
//    · off(channel, handler) returns true if it removed something
//    · emit(channel, payload) returns how many handlers ran
//    · handlers on one channel run in registration order
//    · a handler on '*' hears every channel and is called with
//      (payload, channelName) — the channel name second
//
//  Capstone 15/01 extends this with `once`, error isolation, and
//  ordering.
//
//  hint: iterate over a *copy* of the handler list — a handler is
//  allowed to unsubscribe itself mid-emit

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createEventBus() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a subscriber receives the payload', () => {
  const bus = createEventBus();
  const seen = spy();
  bus.on('order:paid', seen);
  bus.emit('order:paid', { id: 7 });
  eq(seen.calls, [[{ id: 7 }]]);
});

test('emit reports how many handlers ran', () => {
  const bus = createEventBus();
  bus.on('a', spy());
  bus.on('a', spy());
  eq(bus.emit('a', 1), 2);
  eq(bus.emit('nobody-listens', 1), 0);
});

test('handlers fire in registration order', () => {
  const bus = createEventBus();
  const marks = [];
  bus.on('a', () => marks.push('first'));
  bus.on('a', () => marks.push('second'));
  bus.emit('a');
  eq(marks, ['first', 'second']);
});

test('off removes exactly one handler', () => {
  const bus = createEventBus();
  const keep = spy();
  const drop = spy();
  bus.on('a', keep);
  bus.on('a', drop);
  eq(bus.off('a', drop), true);
  bus.emit('a', 1);
  eq(keep.callCount, 1);
  eq(drop.callCount, 0);
});

test('the function returned by on unsubscribes', () => {
  const bus = createEventBus();
  const handler = spy();
  const stop = bus.on('a', handler);
  bus.emit('a');
  stop();
  bus.emit('a');
  eq(handler.callCount, 1);
});

test('a wildcard handler hears every channel, with its name', () => {
  const bus = createEventBus();
  const audit = spy();
  bus.on('*', audit);
  bus.on('order:paid', spy());
  eq(bus.emit('order:paid', { id: 1 }), 2);
  bus.emit('user:login', { id: 2 });
  eq(audit.calls, [
    [{ id: 1 }, 'order:paid'],
    [{ id: 2 }, 'user:login'],
  ]);
});

test('removing something that was never added is harmless', () => {
  const bus = createEventBus();
  const handler = spy();
  const stop = bus.on('a', handler);
  stop();
  stop();
  eq(bus.off('a', handler), false);
  ok(bus.emit('a') === 0);
});
