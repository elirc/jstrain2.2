// ─────────────────────────────────────────────────────────────────────────
//  49 · processChunked (the fix for 48) — SOLUTION         ★★★ stretch
//  run: node 49-chunked-yield.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an index loop, because the yield condition is arithmetic
//  on the index — `(i + 1) % chunkSize === 0` means "I just finished a
//  whole chunk". The second half of the condition, `i < last`, is the bit
//  everyone forgets: a yield after the final item buys nothing and adds a
//  whole macrotask of latency to every call.
//  `setTimeout(resolve, 0)` is what makes this a real fix. Awaiting a
//  promise only drains microtasks (that was exercise 48); reaching the
//  TIMERS phase is what lets a pending timer, an incoming socket, or a
//  browser paint finally get a turn.
//  chunkSize is the dial between throughput and responsiveness: 1 is
//  maximally fair and slow, Infinity is exercise 48 again. Tune it by how
//  long one item takes, aiming for a yield every few milliseconds.
//  Injecting `yieldControl` is what makes the count testable without
//  waiting on real timers — and it lets a caller swap in `setImmediate`,
//  `scheduler.yield()`, or a no-op in tests.
//  Wrong turn: `if (i % chunkSize === 0)`. That yields BEFORE the first
//  item (i = 0) and gets the chunk boundaries off by one.

import { test, eq, ok, spy } from '../../_lib/check.js';

export const range = (n) => Array.from({ length: n }, (_, i) => i);

const macrotask = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function processChunked(items, work, options = {}) {
  const { chunkSize = 4, yieldControl = macrotask } = options;
  const results = [];
  const last = items.length - 1;

  for (let i = 0; i < items.length; i += 1) {
    results.push(await work(items[i], i));
    if (i < last && (i + 1) % chunkSize === 0) await yieldControl();
  }

  return results;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the results in input order', async () => {
  const out = await processChunked(range(6), (n) => n * 2, { chunkSize: 2 });
  eq(out, [0, 2, 4, 6, 8, 10]);
});

test('runs work one item at a time, in index order', async () => {
  const meter = { running: 0, peak: 0 };
  const seen = [];
  await processChunked(
    range(6),
    async (item, index) => {
      meter.running += 1;
      meter.peak = Math.max(meter.peak, meter.running);
      seen.push(index);
      await null;
      meter.running -= 1;
      return item;
    },
    { chunkSize: 2, yieldControl: async () => {} }
  );
  eq(seen, [0, 1, 2, 3, 4, 5]);
  eq(meter.peak, 1);
});

test('yields once per completed chunk', async () => {
  const yieldControl = spy(async () => {});
  await processChunked(range(12), (n) => n, { chunkSize: 4, yieldControl });
  eq(yieldControl.callCount, 2, 'after items 4 and 8 — not after item 12');
});

test('never yields after the final item', async () => {
  const yieldControl = spy(async () => {});
  await processChunked(range(10), (n) => n, { chunkSize: 4, yieldControl });
  eq(yieldControl.callCount, 2, 'after items 4 and 8; item 10 ends the run');
});

test('never yields when the chunk is bigger than the list', async () => {
  const yieldControl = spy(async () => {});
  await processChunked(range(3), (n) => n, { chunkSize: 20, yieldControl });
  eq(yieldControl.callCount, 0);
});

test('an empty list resolves [] and yields nothing', async () => {
  const yieldControl = spy(async () => {});
  eq(await processChunked([], (n) => n, { chunkSize: 4, yieldControl }), []);
  eq(yieldControl.callCount, 0);
});

test('awaits whatever work returns', async () => {
  const out = await processChunked(
    ['a', 'b'],
    async (item) => item.toUpperCase(),
    { chunkSize: 1, yieldControl: async () => {} }
  );
  eq(out, ['A', 'B']);
});

test('the default yield really lets a waiting timer run', async () => {
  const trace = [];
  setTimeout(() => trace.push('timer'), 0);
  await processChunked(
    range(12),
    (n) => {
      trace.push(n);
      return n;
    },
    { chunkSize: 4 }
  );
  const at = trace.indexOf('timer');
  ok(at > 0, 'the timer must not run before any work');
  ok(at < trace.length - 1, 'the timer must run BEFORE the last item');
});
