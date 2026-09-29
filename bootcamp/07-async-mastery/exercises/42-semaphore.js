// ─────────────────────────────────────────────────────────────────────────
//  42 · Semaphore (acquire / release)                      ★★★ stretch
//  concepts: concurrency limits · waiter queues · fairness
//  run: node 42-semaphore.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The database allows 5 connections and 50 handlers want one. A semaphore
//  is the primitive underneath every "max N at a time": a counter plus a
//  queue of people waiting for it.
//
//      const s = new Semaphore(2);
//      await s.acquire();          → returns at once, available 2 → 1
//      await s.acquire();          → returns at once, available 1 → 0
//      s.acquire();                → PENDING, waiting === 1
//      s.release();                → wakes that waiter (FIFO)
//
//  Build the class: `acquire()`, `release()`, and the getters `available`
//  and `waiting`. Releasing more than you took must never push
//  `available` above `max`.
//
//  hint: when a slot is released and someone is queued, the slot goes
//  STRAIGHT to them — the counter never goes back up.

import { test, eq, sleep } from '../../_lib/check.js';

export class Semaphore {
  constructor(max) {
    throw new Error('TODO');
  }

  acquire() {
    throw new Error('TODO');
  }

  release() {
    throw new Error('TODO');
  }

  get available() {
    throw new Error('TODO');
  }

  get waiting() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lets the first `max` acquirers straight through', async () => {
  const s = new Semaphore(2);
  await s.acquire();
  await s.acquire();
  eq(s.available, 0);
  eq(s.waiting, 0);
});

test('makes the next acquirer wait', async () => {
  const s = new Semaphore(1);
  await s.acquire();
  let got = false;
  s.acquire().then(() => {
    got = true;
  });
  await sleep(10);
  eq(got, false, 'no slot is free, so this must still be pending');
  eq(s.waiting, 1);
  s.release();
  await sleep(10);
  eq(got, true);
});

test('wakes the longest waiter first', async () => {
  const s = new Semaphore(1);
  await s.acquire();
  const woke = [];
  const a = s.acquire().then(() => woke.push('a'));
  const b = s.acquire().then(() => woke.push('b'));
  const c = s.acquire().then(() => woke.push('c'));
  eq(s.waiting, 3);
  s.release();
  await a;
  s.release();
  await b;
  s.release();
  await c;
  eq(woke, ['a', 'b', 'c']);
});

test('never lets more than `max` hold a slot at once', async () => {
  const s = new Semaphore(2);
  const meter = { running: 0, peak: 0 };
  const task = async () => {
    await s.acquire();
    meter.running += 1;
    meter.peak = Math.max(meter.peak, meter.running);
    await sleep(12);
    meter.running -= 1;
    s.release();
  };
  await Promise.all(Array.from({ length: 6 }, task));
  eq(meter.peak, 2);
  eq(meter.running, 0);
  eq(s.available, 2, 'every slot must be back in the pool');
});

test('release with nobody waiting returns the slot to the pool', async () => {
  const s = new Semaphore(2);
  await s.acquire();
  eq(s.available, 1);
  s.release();
  eq(s.available, 2);
});

test('an extra release cannot push available past max', async () => {
  const s = new Semaphore(1);
  s.release();
  s.release();
  eq(s.available, 1);
});

test('a released slot goes to the waiter, not back to the counter', async () => {
  const s = new Semaphore(1);
  await s.acquire();
  const queued = s.acquire();
  s.release();
  await queued;
  eq(s.available, 0, 'the waiter now holds the only slot');
  eq(s.waiting, 0);
});
