// ─────────────────────────────────────────────────────────────────────────
//  48 · drainInMicrotasks (the starvation bug) — SOLUTION   ★★☆ core
//  run: node 48-microtask-starvation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a plain loop with `await null` in it. `await` on a
//  non-promise still suspends the function and schedules the rest as a
//  microtask, so each item costs exactly one hop — and that hop is the
//  bug.
//  The microtask queue is drained to EMPTY before the event loop moves on
//  to timers. Every continuation here queues the next one, so the queue
//  never empties, so no timer, no I/O callback, and (in a browser) no
//  paint gets a turn until item 40 is done. The starvation test proves it:
//  a 0ms timer queued BEFORE the call still has not fired afterwards.
//  This is why "just await something" is not a fix for a blocking loop.
//  Awaiting a MICROTASK yields to other promise callbacks and nothing
//  else. To be a good citizen you have to reach the macrotask queue —
//  which is exercise 49.
//  Wrong turn: believing `await` means "let other work happen". It means
//  "let other MICROTASKS happen". The distinction is invisible until a
//  timer, a socket, or a health check quietly stops responding.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export const range = (n) => Array.from({ length: n }, (_, i) => i);

export async function drainInMicrotasks(items, work) {
  const results = [];
  for (let i = 0; i < items.length; i += 1) {
    await null; // one microtask hop — never a timer
    results.push(work(items[i], i));
  }
  return results;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the results in input order', async () => {
  eq(await drainInMicrotasks([1, 2, 3], (n) => n * 2), [2, 4, 6]);
});

test('calls work once per item, in index order', async () => {
  const seen = [];
  await drainInMicrotasks(['a', 'b', 'c'], (item, index) => {
    seen.push(`${index}:${item}`);
    return item;
  });
  eq(seen, ['0:a', '1:b', '2:c']);
});

test('an empty list resolves with an empty array', async () => {
  eq(await drainInMicrotasks([], (n) => n), []);
});

test('processes nothing synchronously', async () => {
  const seen = [];
  const running = drainInMicrotasks([1, 2, 3], (n) => {
    seen.push(n);
    return n;
  });
  eq(seen, [], 'the first item must wait for a microtask');
  await running;
  eq(seen, [1, 2, 3]);
});

test('starves a timer that was queued before it', async () => {
  const trace = [];
  setTimeout(() => trace.push('timer'), 0);
  await drainInMicrotasks(range(40), (n) => {
    trace.push(n);
    return n;
  });
  eq(trace.includes('timer'), false, 'microtasks run to exhaustion first');
  await sleep(10);
  eq(trace[trace.length - 1], 'timer');
  eq(trace.length, 41);
});

test('a throwing work function rejects and stops the drain', async () => {
  const seen = [];
  await rejects(
    drainInMicrotasks(['a', 'b', 'c'], (item) => {
      if (item === 'b') throw new Error('bad item');
      seen.push(item);
      return item;
    }),
    'bad item'
  );
  eq(seen, ['a']);
});

test('keeps the results even for a long list', async () => {
  const out = await drainInMicrotasks(range(50), (n) => n + 1);
  eq(out.length, 50);
  ok(out[0] === 1 && out[49] === 50);
});
