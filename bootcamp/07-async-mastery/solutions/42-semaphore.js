// ─────────────────────────────────────────────────────────────────────────
//  42 · Semaphore (acquire / release) — SOLUTION           ★★★ stretch
//  run: node 42-semaphore.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two pieces of state — a count of free slots and a FIFO
//  array of `resolve` functions. `acquire` either spends a slot and
//  returns an already-resolved promise, or parks its resolve in the
//  queue (this is the deferred pattern from exercise 36, used for real).
//  `release` is where the subtlety lives: if anyone is queued, the slot
//  is HANDED to them — `free` is never incremented — because bumping the
//  counter and then waking someone opens a window where a brand-new
//  `acquire` steals the slot, and your longest waiter starves. Direct
//  hand-off is what makes the queue fair.
//  `Math.min(max, free + 1)` guards the double-release bug: a job whose
//  release runs in both a `.then` and a `.finally` would otherwise inflate
//  the limit permanently, and the leak only shows up under load.
//  Compare with mapLimit (exercise 23): that owns the work list, this owns
//  only the permission. A semaphore composes — the same instance can gate
//  three unrelated call sites sharing one connection pool.
//  Wrong turn: releasing outside a `finally`. One throw between acquire
//  and release and the slot is gone for the lifetime of the process.

import { test, eq, sleep } from '../../_lib/check.js';

export class Semaphore {
  #max;
  #free;
  #waiters = [];

  constructor(max) {
    this.#max = max;
    this.#free = max;
  }

  acquire() {
    if (this.#free > 0) {
      this.#free -= 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  release() {
    const next = this.#waiters.shift();
    if (next) next();
    else this.#free = Math.min(this.#max, this.#free + 1);
  }

  get available() {
    return this.#free;
  }

  get waiting() {
    return this.#waiters.length;
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
