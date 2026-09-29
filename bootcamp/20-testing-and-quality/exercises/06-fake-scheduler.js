// ─────────────────────────────────────────────────────────────────────────
//  06 · fake scheduler                                       ★★★ stretch
//  concepts: virtual time · priority queues · timer injection
//  run: node 06-fake-scheduler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A test for a 100ms debounce that really waits 100ms is a test you will
//  eventually delete, because on a busy CI box it flakes. Build the timer
//  wheel instead: `setTimeout` that only pretends, plus an `advance` your
//  test drives. This is `vi.useFakeTimers()` / `jest.advanceTimersByTime`.
//
//      const s = createFakeScheduler();
//      const id = s.setTimeout(() => console.log('hi'), 100);  // id 1, 2...
//      s.pending()      → 1        s.now()  → 0
//      s.advance(50)    → 50       nothing has run
//      s.advance(50)    → 100      'hi'; pending() is 0
//      s.clearTimeout(id)          removes a waiting timer
//      s.runAll()                  runs everything left, however far away
//
//  Rules that matter:
//    · timers fire in DUE order (ties: whichever was scheduled first)
//    · now() moves to a timer's due time BEFORE its callback runs
//    · a timer scheduled from inside a callback still fires if it lands
//      inside the same advance window — and runAll keeps going
//    · a timer that reschedules itself forever must THROW, not hang
//
//  Then `debounce(fn, ms, scheduler)`: fn runs once, `ms` after the last
//  call, with that last call's arguments.
//
//  hint: keep `{ id, due, fn }` in one array. advance() is a loop that
//  re-asks "what is the earliest timer due by the target?" every pass —
//  snapshotting the list once misses everything the callbacks schedule.

import { test, eq, throws } from '../../_lib/check.js';

export function createFakeScheduler() {
  throw new Error('TODO');
}

export function debounce(fn, ms, scheduler) {
  throw new Error('TODO');
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
