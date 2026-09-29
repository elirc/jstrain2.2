// ─────────────────────────────────────────────────────────────────────────
//  01 · EventEmitter — SOLUTION                             ★★★ capstone
//  concepts: maps · closures · callbacks · defensive iteration
//  time: 30–40 min · 4 stages · 21 tests
//  run: node 01-event-emitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. One Map: event name → array of listener functions. That
//  is the whole data model. A Map (not a plain object) because event names
//  are arbitrary user strings — 'constructor', '__proto__' and 'toString'
//  are all legal event names and a plain object would trip over them. The
//  array preserves registration order for free, which is half the spec.
//
//  Stage 1 — on/emit. `on` is push, `emit` is a loop. The only decision is
//  the return value of emit: Node returns true/false for "did anyone
//  hear this", which is how you detect an unhandled 'error' event.
//
//  Stage 2 — off/once. `once` is the WRAPPER pattern: register a function
//  that removes itself and then delegates. That creates a problem —
//  off(event, original) can no longer find the wrapper — so the wrapper
//  carries a back-pointer, `wrapper.listener = listener`, and off matches
//  either. Node does exactly this (`listener.listener`). Removing the
//  wrapper BEFORE calling the delegate also means a once listener that
//  re-emits its own event does not recurse forever.
//
//  Stage 3 — unsubscribe. `on` returns a closure over (event, listener).
//  This is the modern shape (RxJS, Svelte stores, useEffect cleanup): the
//  caller can't lose the handle, and it works with anonymous arrow
//  functions, which off() alone cannot remove.
//
//  Stage 4 — wildcards and robustness. Two lines matter:
//    · `for (const l of [...list])` — iterate a COPY. Listeners are allowed
//      to call off() (or on()) while emit runs; mutating an array you are
//      iterating skips elements. This is the single most common bug in
//      hand-rolled emitters.
//    · try/catch per listener — an emitter is a fan-out, and one broken
//      subscriber must not take out the other nine. Swallowing silently is
//      also wrong, hence the onError escape hatch.
//
//  Classic wrong turn: storing listeners in a Set to make off() O(1). Sets
//  do preserve insertion order, but then you cannot register the same
//  function twice for one event — which Node explicitly allows, and which
//  every "why did my handler fire only once" bug report is about.

import { test, eq, ok, spy } from '../../_lib/check.js';

export class EventEmitter {
  constructor({ onError } = {}) {
    this.onError = onError; // stage 4: called as onError(err, event)
    this.events = new Map(); // event name → array of listener functions
  }

  // stage 1 + 3 — append, then hand back a closure that undoes it.
  on(event, listener) {
    const list = this.events.get(event);
    if (list) list.push(listener);
    else this.events.set(event, [listener]);
    return () => this.off(event, listener);
  }

  // stage 2 — `l.listener === listener` is the once() back-pointer check.
  off(event, listener) {
    const list = this.events.get(event);
    if (!list) return this;
    const i = list.findIndex((l) => l === listener || l.listener === listener);
    if (i !== -1) list.splice(i, 1);
    if (list.length === 0) this.events.delete(event);
    return this;
  }

  // stage 2 — the wrapper pattern: unregister first, then delegate.
  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };
    wrapper.listener = listener;
    return this.on(event, wrapper);
  }

  // stage 1 + 4 — direct listeners first, then '*' listeners, each one
  // isolated from the others. `[...list]` snapshots against mutation.
  emit(event, ...args) {
    let ran = false;
    const direct = this.events.get(event);
    if (direct) {
      for (const listener of [...direct]) {
        ran = true;
        this.#safeCall(listener, args, event);
      }
    }
    if (event !== '*') {
      const wildcard = this.events.get('*');
      if (wildcard) {
        for (const listener of [...wildcard]) {
          ran = true;
          this.#safeCall(listener, [event, ...args], event);
        }
      }
    }
    return ran;
  }

  // stage 1 — `?? 0` so an event nobody ever used reports 0, not undefined.
  listenerCount(event) {
    return this.events.get(event)?.length ?? 0;
  }

  // stage 4 — one bad subscriber must not abort the fan-out.
  #safeCall(listener, args, event) {
    try {
      listener(...args);
    } catch (err) {
      this.onError?.(err, event);
    }
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
