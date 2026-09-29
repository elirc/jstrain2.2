// ─────────────────────────────────────────────────────────────────────────
//  06 · EventBus — SOLUTION                                     ★★☆ core
//  concepts: observer · pub/sub · unsubscribe
//  run: node solutions/06-observer-eventbus.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — let a publisher announce that something happened without
//  knowing who cares, so subscribers can appear and vanish freely.
//  A Map of channel → array of handlers is the whole pattern. Two
//  details separate a toy bus from a usable one: `on` hands back an
//  unsubscribe (callers lose track of function identity otherwise), and
//  `emit` iterates a *copy*, so a handler that removes itself mid-emit
//  cannot make the loop skip its neighbour.
//  When NOT to use: a bus turns a call graph invisible. If exactly one
//  thing reacts, call it directly — "who fires this?" at 3am is misery.
//  Leaks are the other cost: every `on` without an `off` pins its
//  closure forever.
//  In the wild: Node's EventEmitter, the DOM's addEventListener,
//  Redux subscribers, socket.io, RxJS Subjects.
//  Capstone 15/01 extends this with `once`, error isolation, and
//  ordering.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createEventBus() {
  const channels = new Map();

  function off(channel, handler) {
    const list = channels.get(channel);
    if (!list) return false;
    const index = list.indexOf(handler);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }

  function on(channel, handler) {
    if (!channels.has(channel)) channels.set(channel, []);
    channels.get(channel).push(handler);
    return () => off(channel, handler);
  }

  function emit(channel, payload) {
    let delivered = 0;
    for (const handler of [...(channels.get(channel) ?? [])]) {
      handler(payload);
      delivered += 1;
    }
    if (channel !== '*') {
      for (const handler of [...(channels.get('*') ?? [])]) {
        handler(payload, channel);
        delivered += 1;
      }
    }
    return delivered;
  }

  return { on, off, emit };
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
