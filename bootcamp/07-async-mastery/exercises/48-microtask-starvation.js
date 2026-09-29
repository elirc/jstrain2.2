// ─────────────────────────────────────────────────────────────────────────
//  48 · drainInMicrotasks (build the starvation bug)        ★★☆ core
//  concepts: microtask queue · starvation · event-loop fairness
//  run: node 48-microtask-starvation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "It hangs, but the CPU is pegged and my 0ms timer never fires." This
//  exercise builds that bug ON PURPOSE so you can recognise it.
//  `drainInMicrotasks(items, work)` processes a list one item per
//  MICROTASK — never a timer:
//
//      await drainInMicrotasks([1, 2, 3], (n) => n * 2)   → [2, 4, 6]
//
//  Rules:
//    · yield a microtask BEFORE each item, so nothing runs synchronously
//    · call `work(item, index)` in index order, results in input order
//    · never touch setTimeout / setImmediate — microtasks only
//    · if `work` throws, reject and stop
//
//  The tests then assert the consequence: a `setTimeout(..., 0)` queued
//  BEFORE the call cannot run until every single item is done.
//
//  hint: `await null` is a microtask hop and nothing else. So is
//  `await Promise.resolve()`.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export const range = (n) => Array.from({ length: n }, (_, i) => i);

export function drainInMicrotasks(items, work) {
  throw new Error('TODO');
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
