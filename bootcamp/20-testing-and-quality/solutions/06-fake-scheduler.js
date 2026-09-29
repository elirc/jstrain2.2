// ─────────────────────────────────────────────────────────────────────────
//  06 · fake scheduler — SOLUTION                            ★★★ stretch
//  run: node 06-fake-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is `vi.useFakeTimers()` in thirty lines, and the shape
//  is a priority queue plus a virtual `now`.
//  The one design decision that matters is that `advance` is a LOOP, not a
//  filter-then-forEach. Snapshotting the due timers up front and running
//  them would miss every timer a callback schedules — which is exactly the
//  case that matters, because retries, polls and debounces all reschedule
//  themselves from inside their own callback. Each iteration re-asks "what
//  is the earliest timer due within the window?", so nested timers join the
//  same window naturally.
//  `now` moves to each timer's due time BEFORE the callback runs, so code
//  that reads the clock inside a callback sees the time it was scheduled
//  for, not the end of the window. Ties break by id: registration order,
//  same as the real event loop.
//  The iteration cap turns "my test hangs forever" into a readable error —
//  a self-rescheduling zero-delay timer is a real bug you want reported,
//  not a frozen terminal.
//  debounce needs no timer knowledge at all: it takes the scheduler as a
//  parameter. That is the whole lesson — the unit does not know its timers
//  are fake, and in production you pass `{ setTimeout, clearTimeout }`.

import { test, eq, throws } from '../../_lib/check.js';

const MAX_STEPS = 10_000;

export function createFakeScheduler() {
  let current = 0;
  let nextId = 1;
  let timers = [];

  const earliest = (target) => {
    let best = null;
    for (const t of timers) {
      if (t.due > target) continue;
      if (!best || t.due < best.due || (t.due === best.due && t.id < best.id)) {
        best = t;
      }
    }
    return best;
  };

  const drain = (target) => {
    let steps = 0;
    for (;;) {
      const next = earliest(target);
      if (!next) break;
      if (++steps > MAX_STEPS) throw new Error('too many timers');
      timers = timers.filter((t) => t !== next);
      current = next.due;
      next.fn();
    }
  };

  return {
    now: () => current,
    pending: () => timers.length,
    setTimeout(fn, ms = 0) {
      const id = nextId++;
      timers.push({ id, due: current + ms, fn });
      return id;
    },
    clearTimeout(id) {
      timers = timers.filter((t) => t.id !== id);
    },
    advance(ms) {
      const target = current + ms;
      drain(target);
      current = target;
      return current;
    },
    runAll() {
      drain(Infinity);
      return current;
    },
  };
}

export function debounce(fn, ms, scheduler) {
  let id = null;
  return (...args) => {
    if (id !== null) scheduler.clearTimeout(id);
    id = scheduler.setTimeout(() => {
      id = null;
      fn(...args);
    }, ms);
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('scheduling runs nothing, and pending() counts what is waiting', () => {
  const s = createFakeScheduler();
  const calls = [];
  s.setTimeout(() => calls.push('a'), 10);
  s.setTimeout(() => calls.push('b'), 20);
  eq(calls, []);
  eq(s.pending(), 2);
  eq(s.now(), 0);
  s.advance(10);
  eq(calls, ['a']);
  eq(s.pending(), 1);
});

test('advance runs the due callback and moves now', () => {
  const s = createFakeScheduler();
  let ranAt = null;
  s.setTimeout(() => {
    ranAt = s.now();
  }, 30);
  eq(s.advance(100), 100);
  eq(ranAt, 30);
  eq(s.now(), 100);
});

test('callbacks fire in due order, not registration order', () => {
  const s = createFakeScheduler();
  const order = [];
  s.setTimeout(() => order.push('late'), 100);
  s.setTimeout(() => order.push('early'), 10);
  s.setTimeout(() => order.push('mid'), 50);
  s.advance(100);
  eq(order, ['early', 'mid', 'late']);
});

test('clearTimeout stops a pending timer', () => {
  const s = createFakeScheduler();
  const calls = [];
  const id = s.setTimeout(() => calls.push('never'), 10);
  s.setTimeout(() => calls.push('yes'), 10);
  s.clearTimeout(id);
  eq(s.pending(), 1);
  s.runAll();
  eq(calls, ['yes']);
});

test('a timer scheduled inside a callback runs in the same window', () => {
  const s = createFakeScheduler();
  const order = [];
  s.setTimeout(() => {
    order.push('outer');
    s.setTimeout(() => order.push('inner'), 10);
  }, 20);
  s.advance(50);
  eq(order, ['outer', 'inner']);
  eq(s.pending(), 0);
  eq(s.now(), 50);
});

test('runAll drains a chain of nested timers, and refuses a runaway', () => {
  const s = createFakeScheduler();
  const order = [];
  const chain = (n) => {
    if (n === 0) return;
    s.setTimeout(() => {
      order.push(n);
      chain(n - 1);
    }, 1000);
  };
  chain(3);
  eq(s.runAll(), 3000);
  eq(order, [3, 2, 1]);

  const runaway = createFakeScheduler();
  const forever = () => runaway.setTimeout(forever, 0);
  forever();
  throws(() => runaway.runAll());
});

test('debounce fires once, with the latest arguments', () => {
  const s = createFakeScheduler();
  const calls = [];
  const save = debounce((value) => calls.push(value), 100, s);
  save('a');
  save('b');
  save('c');
  eq(s.pending(), 1);
  s.advance(99);
  eq(calls, []);
  s.advance(1);
  eq(calls, ['c']);
  eq(s.pending(), 0);
});

test('every call restarts the debounce countdown', () => {
  const s = createFakeScheduler();
  const calls = [];
  const save = debounce((value) => calls.push(value), 100, s);
  save('a');
  s.advance(90);
  save('b');
  s.advance(90);
  eq(calls, []);
  s.advance(10);
  eq(calls, ['b']);
});
