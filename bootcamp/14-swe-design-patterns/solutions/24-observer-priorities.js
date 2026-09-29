// ─────────────────────────────────────────────────────────────────────────
//  24 · observer, the hard parts — SOLUTION                    ★★★ stretch
//  concepts: observer · priorities · re-entrancy · once
//  run: node solutions/24-observer-priorities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — same as exercise 06 (announce without knowing who listens),
//  but hardened for the thing that actually happens in production: the
//  listener list changes WHILE you are walking it.
//  Three moving parts:
//  · Entries, not bare functions. Each subscription is an object with
//    `{ handler, priority, seq }`, so the same function can be
//    registered twice and unsubscribed independently, and so ties can
//    break on `seq` — `sort` is stable in modern JS but relying on that
//    across a re-sort of a mutated array is how ordering bugs hide.
//  · Iterate a copy AND re-check membership. The copy satisfies "added
//    during emit runs next time". The `includes` check satisfies
//    "removed during emit does not run" — a copy alone happily calls a
//    handler that was torn down two lines ago, which in a UI means
//    setState on an unmounted component.
//  · Remove `once` BEFORE invoking. If you remove it after, a handler
//    that re-emits its own event re-enters and fires itself again;
//    `once` that fires twice is worse than no `once`.
//  When NOT to use: priorities are a smell if you need more than two
//  tiers — "runs before the logger" is an ordering dependency the type
//  system cannot see. If order really matters, that is a pipeline
//  (exercise 18), not a bus.
//  In the wild: Node's EventEmitter (`once`, `prependListener`),
//  Fastify/hapi hook ordering, jQuery's event list snapshot, WordPress
//  `add_action($hook, $fn, $priority)`, DOM `{ once: true }`.

import { test, eq, spy, ok } from '../../_lib/check.js';

export function createBus() {
  const events = new Map();
  let seq = 0;

  const remove = (event, entry) => {
    const list = events.get(event);
    if (!list) return false;
    const index = list.indexOf(entry);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  };

  return {
    on(event, handler, { priority = 0, once = false } = {}) {
      const entry = { handler, priority, once, seq: seq++ };
      const list = events.get(event) ?? [];
      list.push(entry);
      list.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
      events.set(event, list);
      return () => remove(event, entry);
    },

    emit(event, payload) {
      const list = events.get(event);
      if (!list) return 0;
      let ran = 0;
      for (const entry of [...list]) {
        if (!list.includes(entry)) continue; // unsubscribed mid-emit
        if (entry.once) remove(event, entry); // remove BEFORE running
        entry.handler(payload);
        ran += 1;
      }
      return ran;
    },

    size: (event) => (events.get(event) ?? []).length,
  };
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
