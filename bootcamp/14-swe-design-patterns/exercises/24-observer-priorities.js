// ─────────────────────────────────────────────────────────────────────────
//  24 · observer, the hard parts                              ★★★ stretch
//  concepts: observer · priorities · re-entrancy · once
//  run: node exercises/24-observer-priorities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 06 built a bus that works when everyone behaves. Production
//  buses get subscribed and unsubscribed *from inside a handler*, and
//  that is where toy implementations corrupt themselves.
//
//      const stop = bus.on('save', handler, { priority: 10, once: false });
//      bus.emit('save', payload)   → how many handlers actually ran
//      bus.size('save')            → how many are registered
//      stop()                      → true the first time, false after
//
//  Four rules, all testable:
//    1. higher priority first; equal priority keeps registration order
//    2. `once: true` runs at most once — and is removed BEFORE it runs,
//       so a handler that re-emits its own event cannot loop
//    3. unsubscribing a handler mid-emit means it does NOT run, even if
//       the emit already started
//    4. subscribing mid-emit means it runs on the NEXT emit, not this one
//
//  hint: `[...list]` alone satisfies rule 4 but not rule 3 — before
//  calling each entry, check it is still registered

import { test, eq, spy, ok } from '../../_lib/check.js';

export function createBus() {
  // on(event, handler, { priority = 0, once = false }) -> unsubscribe
  // emit(event, payload) -> number of handlers that ran
  // size(event) -> number registered
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('higher priority runs first, ties keep registration order', () => {
  const bus = createBus();
  const marks = [];
  bus.on('save', () => marks.push('log'), { priority: 0 });
  bus.on('save', () => marks.push('validate'), { priority: 10 });
  bus.on('save', () => marks.push('metrics'));
  bus.on('save', () => marks.push('audit'), { priority: 10 });
  bus.emit('save');
  eq(marks, ['validate', 'audit', 'log', 'metrics']);
});

test('emit reports how many handlers ran, and payloads pass through', () => {
  const bus = createBus();
  const seen = spy();
  bus.on('save', seen);
  bus.on('save', spy());
  eq(bus.emit('save', { id: 7 }), 2);
  eq(bus.emit('nobody-listens', 1), 0);
  eq(seen.calls, [[{ id: 7 }]]);
  eq(bus.size('nobody-listens'), 0);
});

test('a once handler runs exactly once and then is gone', () => {
  const bus = createBus();
  const boot = spy();
  bus.on('ready', boot, { once: true });
  eq(bus.size('ready'), 1);
  eq(bus.emit('ready'), 1);
  eq(bus.emit('ready'), 0);
  eq(boot.callCount, 1);
  eq(bus.size('ready'), 0);
});

test('a once handler is removed before it runs, so re-entry is safe', () => {
  const bus = createBus();
  const handler = spy(() => bus.emit('tick'));
  bus.on('tick', handler, { once: true });
  eq(bus.emit('tick'), 1);
  eq(handler.callCount, 1);
});

test('unsubscribing mid-emit stops a handler that had not run yet', () => {
  const bus = createBus();
  const late = spy();
  const stop = bus.on('x', late);
  bus.on('x', () => stop(), { priority: 10 });
  eq(bus.emit('x'), 1);
  eq(late.callCount, 0);
  eq(bus.size('x'), 1);
});

test('a handler that unsubscribes itself does not skip its neighbour', () => {
  const bus = createBus();
  const marks = [];
  const stop = bus.on('x', () => {
    marks.push('a');
    stop();
  });
  bus.on('x', () => marks.push('b'));
  bus.emit('x');
  eq(marks, ['a', 'b']);
  bus.emit('x');
  eq(marks, ['a', 'b', 'b']);
});

test('subscribing mid-emit waits for the next emit', () => {
  const bus = createBus();
  const added = spy();
  bus.on('x', () => bus.on('x', added));
  eq(bus.emit('x'), 1);
  eq(added.callCount, 0);
  eq(bus.size('x'), 2);
  eq(bus.emit('x'), 2);
  eq(added.callCount, 1);
});

test('unsubscribing twice is harmless and reports it', () => {
  const bus = createBus();
  const stop = bus.on('x', spy());
  eq(stop(), true);
  eq(stop(), false);
  ok(bus.emit('x') === 0);
});
