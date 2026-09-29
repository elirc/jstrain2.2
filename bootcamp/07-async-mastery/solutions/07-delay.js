// ─────────────────────────────────────────────────────────────────────────
//  07 · delay — SOLUTION                                   ★☆☆ warm-up
//  run: node 07-delay.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new Promise(executor)` runs the executor synchronously
//  and hands you `resolve`. Anything that eventually calls resolve turns
//  the promise from pending to fulfilled — here, a timer.
//  Note what is NOT needed: no reject (a timer cannot fail), and no
//  value (resolve() fulfils with undefined). This one-liner is the
//  adapter pattern in miniature: wrap a callback-shaped API once, then
//  never write setTimeout in business logic again.

import { test, eq, ok } from '../../_lib/check.js';

const since = (t0) => Date.now() - t0;

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a promise', () => {
  const p = delay(1);
  ok(p instanceof Promise, 'delay(ms) should return a Promise');
});

test('resolves with undefined', async () => {
  eq(await delay(5), undefined);
});

test('does not resolve before its time', async () => {
  const t0 = Date.now();
  await delay(30);
  ok(since(t0) >= 25, `waited only ${since(t0)}ms`);
});

test('resolves in the right order for different delays', async () => {
  const order = [];
  await Promise.all([
    delay(50).then(() => order.push('slow')),
    delay(5).then(() => order.push('fast')),
  ]);
  eq(order, ['fast', 'slow']);
});

test('the promise stays pending until the timer fires', async () => {
  let settled = false;
  const p = delay(15).then(() => {
    settled = true;
  });
  ok(settled === false, 'delay must not resolve synchronously');
  await p;
  ok(settled);
});
