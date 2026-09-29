// ─────────────────────────────────────────────────────────────────────────
//  07 · delay                                              ★☆☆ warm-up
//  concepts: new Promise · setTimeout · resolve
//  run: node 07-delay.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The one promise you will hand-roll forever. delay(ms) returns a
//  promise that resolves — with nothing — after ms milliseconds.
//
//      await delay(20);            → continues ~20ms later
//      delay(20).then(() => ...)   → same thing, .then style
//
//  Use the Promise constructor: `new Promise((resolve) => ...)`. The
//  function you pass runs immediately; resolve() is what you schedule.

import { test, eq, ok } from '../../_lib/check.js';

const since = (t0) => Date.now() - t0;

export function delay(ms) {
  throw new Error('TODO');
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
