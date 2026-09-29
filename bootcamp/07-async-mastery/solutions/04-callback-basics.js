// ─────────────────────────────────────────────────────────────────────────
//  04 · divide (error-first callback) — SOLUTION           ★☆☆ warm-up
//  run: node 04-callback-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape is `if (bad) { cb(err); return; } cb(null, v)`
//  — the early return is what stops one call turning into two.
//  The setTimeout(..., 0) is not decoration. A function that sometimes
//  calls back synchronously and sometimes later is "releasing Zalgo":
//  callers cannot know whether their own setup code has run yet, so bugs
//  appear only under fast/slow conditions. Real async APIs are always
//  async, even on the error path.
//  Wrong turn: `return cb(err)` is fine, but `cb(err)` with no return
//  falls through and calls the callback a second time on success.

import { test, eq, ok } from '../../_lib/check.js';

const runDivide = (a, b) =>
  new Promise((resolve) => divide(a, b, (err, val) => resolve([err, val])));

export function divide(a, b, cb) {
  setTimeout(() => {
    if (b === 0) {
      cb(new Error('cannot divide by zero'));
      return;
    }
    cb(null, a / b);
  }, 0);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reports the quotient as the second argument', async () => {
  eq(await runDivide(10, 2), [null, 5]);
});

test('passes a null error on success', async () => {
  const [err] = await runDivide(9, 3);
  eq(err, null);
});

test('reports division by zero as an Error', async () => {
  const [err] = await runDivide(1, 0);
  ok(err instanceof Error, 'the first argument should be an Error');
  ok(/zero/i.test(err.message), 'the message should mention zero');
});

test('passes no value when it fails', async () => {
  const [, val] = await runDivide(1, 0);
  eq(val, undefined);
});

test('never calls the callback synchronously', async () => {
  const order = [];
  await new Promise((resolve) => {
    divide(4, 2, () => {
      order.push('callback');
      resolve();
    });
    order.push('divide returned');
  });
  eq(order, ['divide returned', 'callback']);
});
