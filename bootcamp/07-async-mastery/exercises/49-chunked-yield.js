// ─────────────────────────────────────────────────────────────────────────
//  49 · processChunked (the fix for 48)                    ★★★ stretch
//  concepts: macrotask yielding · fairness · injection
//  run: node 49-chunked-yield.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 48 starved the timer queue. The fix is to hand control back to
//  the EVENT LOOP — not just the microtask queue — every so often.
//  Build `processChunked(items, work, { chunkSize, yieldControl })`:
//
//      await processChunked(twelveItems, work, { chunkSize: 4 })
//      → yields after item 4 and item 8. Exactly two yields, never three.
//
//  Rules:
//    · `work(item, index)` runs for every item, awaited, one at a time
//    · results come back in input order
//    · after every `chunkSize`-th item, `await yieldControl()` — but NEVER
//      after the final item; a trailing yield is pure wasted latency
//    · `yieldControl` defaults to a real macrotask hop:
//          () => new Promise((resolve) => setTimeout(resolve, 0))
//    · an empty list resolves [] and yields nothing
//
//  hint: the yield condition is about the item you just finished, and the
//  guard you keep forgetting is "unless it was the last one".

import { test, eq, ok, spy } from '../../_lib/check.js';

export const range = (n) => Array.from({ length: n }, (_, i) => i);

export function processChunked(items, work, options = {}) {
  throw new Error('TODO');
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
