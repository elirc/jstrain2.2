// ─────────────────────────────────────────────────────────────────────────
//  04 · divide (error-first callback)                      ★☆☆ warm-up
//  concepts: callbacks · error-first convention
//  run: node 04-callback-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before promises, Node's whole standard library spoke error-first
//  callbacks: `cb(err)` on failure, `cb(null, value)` on success.
//
//  Write divide(a, b, cb) that follows the convention:
//
//      divide(10, 2, (err, val) => ...)   → err = null, val = 5
//      divide(1, 0,  (err, val) => ...)   → err = Error('cannot divide
//                                            by zero'), val = undefined
//
//  One more rule, and it is the one people get wrong: NEVER call the
//  callback synchronously. Always hand it to the event loop first, so
//  the caller's next line runs before your callback does.

import { test, eq, ok } from '../../_lib/check.js';

const runDivide = (a, b) =>
  new Promise((resolve) => divide(a, b, (err, val) => resolve([err, val])));

export function divide(a, b, cb) {
  throw new Error('TODO');
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
