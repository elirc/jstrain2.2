// ─────────────────────────────────────────────────────────────────────────
//  01 · EventEmitter                                       ★★★ capstone
//  concepts: maps · closures · callbacks · defensive iteration
//  time: 30–40 min · 4 stages · 21 tests
//  run: node 01-event-emitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  Node's `events` module in miniature. Every socket, stream and process
//  signal in Node flows through an EventEmitter; the browser's
//  addEventListener is the same idea with a different coat of paint. Once
//  you have built one, "pub/sub", "event bus" and "observer pattern" all
//  stop being buzzwords — they are the 60 lines below.
//
//  STAGES — do them in order, run the file after each one
//    1. on / emit ......... register listeners, call them in order
//    2. off / once ........ remove a listener; fire-once listeners
//    3. unsubscribe ....... on() hands back a function that removes it
//    4. wildcard + safety . '*' listeners; one bad listener can't win
//
//  THE SPEC
//
//      const bus = new EventEmitter();
//      const stop = bus.on('tick', (n) => console.log(n));
//      bus.emit('tick', 1)        → true   (someone was listening)
//      bus.emit('silence')        → false  (nobody was)
//      stop();                              // same as bus.off('tick', fn)
//
//      bus.once('boot', fn)       // fn runs on the first emit, then goes
//      bus.off('boot', fn)        // must also cancel a once listener
//      bus.listenerCount('tick')  → 1
//
//    stage 4 — wildcards get the event name pushed in front of the args:
//
//      bus.on('*', (event, ...args) => ...)
//      bus.emit('save', 1, 2)     → the '*' listener sees ('save', 1, 2)
//
//    stage 4 — robustness: a listener that throws must not stop the
//    listeners after it. Catch it and hand it to `this.onError(err, event)`
//    if the emitter was given one; otherwise swallow it.
//
//  hint (stage 4): a listener is allowed to call off() while emit is
//  running. Iterate over a *copy* of the list and that whole class of bug
//  disappears.

import { test, eq, ok, spy } from '../../_lib/check.js';

export class EventEmitter {
  constructor({ onError } = {}) {
    this.onError = onError; // stage 4: called as onError(err, event)
    this.events = new Map(); // event name → array of listener functions
  }

  // stage 1 — register `listener` for `event`.
  // stage 3 — return a function that unregisters it again.
  on(event, listener) {
    throw new Error('TODO');
  }

  // stage 2 — remove one listener. Must also match the ORIGINAL function
  // of a once() listener, not just the wrapper you registered.
  off(event, listener) {
    throw new Error('TODO');
  }

  // stage 2 — like on(), but the listener is removed before it runs.
  once(event, listener) {
    throw new Error('TODO');
  }

  // stage 1 — call every listener for `event` with `...args`.
  // stage 4 — then every '*' listener with (event, ...args); survive a
  // listener that throws. Returns true if at least one listener ran.
  emit(event, ...args) {
    throw new Error('TODO');
  }

  // stage 1 — how many listeners are registered for `event`.
  listenerCount(event) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: on / emit ───────────────────────────────────────────────────

test('on registers a listener that emit calls', () => {
  const bus = new EventEmitter();
  const heard = spy();
  bus.on('ping', heard);
  bus.emit('ping');
  eq(heard.callCount, 1);
});

test('emit forwards every argument to the listener', () => {
  const bus = new EventEmitter();
  const heard = spy();
  bus.on('data', heard);
  bus.emit('data', 1, 'two', { three: 3 });
  eq(heard.calls[0], [1, 'two', { three: 3 }]);
});

test('listeners run in the order they were registered', () => {
  const bus = new EventEmitter();
  const order = [];
  bus.on('go', () => order.push('a'));
  bus.on('go', () => order.push('b'));
  bus.on('go', () => order.push('c'));
  bus.emit('go');
  eq(order, ['a', 'b', 'c']);
});

test('emitting an event nobody listens to returns false', () => {
  const bus = new EventEmitter();
  eq(bus.emit('nothing', 1), false);
});

test('emit returns true when at least one listener ran', () => {
  const bus = new EventEmitter();
  bus.on('hit', () => {});
  eq(bus.emit('hit'), true);
});

test('listenerCount counts the listeners of one event', () => {
  const bus = new EventEmitter();
  bus.on('a', () => {});
  bus.on('a', () => {});
  bus.on('b', () => {});
  eq(bus.listenerCount('a'), 2);
  eq(bus.listenerCount('never-used'), 0);
});

// ── stage 2: off / once ──────────────────────────────────────────────────

test('off removes exactly one listener', () => {
  const bus = new EventEmitter();
  const a = spy();
  const b = spy();
  bus.on('x', a);
  bus.on('x', b);
  bus.off('x', a);
  bus.emit('x');
  eq(a.callCount, 0);
  eq(b.callCount, 1);
});

test('off with a listener that was never added is a no-op', () => {
  const bus = new EventEmitter();
  const a = spy();
  bus.on('x', a);
  bus.off('x', () => {});
  bus.off('never-used', a);
  bus.emit('x');
  eq(a.callCount, 1);
});

test('once fires on the first emit only', () => {
  const bus = new EventEmitter();
  const a = spy();
  bus.once('boot', a);
  bus.emit('boot');
  bus.emit('boot');
  bus.emit('boot');
  eq(a.callCount, 1);
});

test('once forwards arguments just like on', () => {
  const bus = new EventEmitter();
  const a = spy();
  bus.once('boot', a);
  bus.emit('boot', 'fast', 42);
  eq(a.calls[0], ['fast', 42]);
});

test('a once listener is unregistered before it runs', () => {
  const bus = new EventEmitter();
  bus.once('boot', () => {});
  eq(bus.listenerCount('boot'), 1);
  bus.emit('boot');
  eq(bus.listenerCount('boot'), 0);
});

test('off cancels a once listener by its original function', () => {
  const bus = new EventEmitter();
  const a = spy();
  bus.once('boot', a);
  bus.off('boot', a);
  bus.emit('boot');
  eq(a.callCount, 0);
});

// ── stage 3: on() returns an unsubscribe function ────────────────────────

test('on returns a function that removes the listener', () => {
  const bus = new EventEmitter();
  const a = spy();
  const stop = bus.on('x', a);
  ok(typeof stop === 'function');
  bus.emit('x');
  stop();
  bus.emit('x');
  eq(a.callCount, 1);
});

test('the unsubscribe function is safe to call twice', () => {
  const bus = new EventEmitter();
  const a = spy();
  const b = spy();
  const stop = bus.on('x', a);
  bus.on('x', b);
  stop();
  stop();
  bus.emit('x');
  eq(a.callCount, 0);
  eq(b.callCount, 1);
});

test('once also returns a working unsubscribe', () => {
  const bus = new EventEmitter();
  const a = spy();
  const stop = bus.once('boot', a);
  stop();
  bus.emit('boot');
  eq(a.callCount, 0);
  eq(bus.listenerCount('boot'), 0);
});

// ── stage 4: wildcards and robustness ────────────────────────────────────

test("a '*' listener hears every event", () => {
  const bus = new EventEmitter();
  const all = spy();
  bus.on('*', all);
  bus.emit('one');
  bus.emit('two');
  eq(all.callCount, 2);
});

test("a '*' listener receives the event name, then the args", () => {
  const bus = new EventEmitter();
  const all = spy();
  bus.on('*', all);
  bus.emit('save', { id: 1 }, 'now');
  eq(all.calls[0], ['save', { id: 1 }, 'now']);
});

test('specific listeners run before wildcard listeners', () => {
  const bus = new EventEmitter();
  const order = [];
  bus.on('*', () => order.push('star'));
  bus.on('save', () => order.push('save'));
  bus.emit('save');
  eq(order, ['save', 'star']);
});

test('a listener that throws does not stop the ones after it', () => {
  const bus = new EventEmitter();
  const order = [];
  bus.on('x', () => order.push('first'));
  bus.on('x', () => {
    throw new Error('boom');
  });
  bus.on('x', () => order.push('third'));
  eq(bus.emit('x'), true);
  eq(order, ['first', 'third']);
});

test('onError receives the error and the event name', () => {
  const seen = [];
  const bus = new EventEmitter({
    onError: (err, event) => seen.push([err.message, event]),
  });
  bus.on('x', () => {
    throw new Error('boom');
  });
  bus.emit('x');
  eq(seen, [['boom', 'x']]);
});

test('removing a listener during emit does not skip the next one', () => {
  const bus = new EventEmitter();
  const order = [];
  const b = () => order.push('b');
  bus.on('t', () => {
    order.push('a');
    bus.off('t', b);
  });
  bus.on('t', b);
  bus.on('t', () => order.push('c'));
  bus.emit('t');
  eq(order, ['a', 'b', 'c']);
  bus.emit('t');
  eq(order, ['a', 'b', 'c', 'a', 'c']);
});
