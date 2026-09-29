// ─────────────────────────────────────────────────────────────────────────
//  17 · myAny — SOLUTION                                   ★★★ stretch
//  run: node 17-my-any.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is myPromiseAll with success and failure swapped.
//  Pass `resolve` straight into the success slot so the first fulfilment
//  wins, and in the failure slot record the reason at its index and
//  decrement the countdown. When the countdown hits zero every input has
//  rejected, so reject with `new AggregateError(errors, message)`.
//  The empty list is the odd one out: with nothing to wait for, it must
//  reject immediately with an AggregateError carrying an empty list.
//  AggregateError is a real built-in (ES2021) and it is what real
//  Promise.any throws — read e.errors, not e.message, to see what failed.
//  Wrong turn: rejecting on the first failure. That is Promise.all's
//  job; any must keep hoping until nothing is left.

import { test, eq, ok } from '../../_lib/check.js';

export const after = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const failIn = (ms, message) => {
  const p = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  p.catch(() => {}); // keeps an unfinished exercise from crashing Node
  return p;
};

const reasonOf = (promise) => promise.then(() => null, (e) => e);

export function myAny(items) {
  const list = [...items];
  return new Promise((resolve, reject) => {
    const errors = new Array(list.length);
    let left = list.length;
    const fail = () =>
      reject(new AggregateError(errors, 'All promises were rejected'));
    if (left === 0) {
      fail();
      return;
    }
    list.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[i] = reason;
        left -= 1;
        if (left === 0) fail();
      });
    });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the only fulfilment', async () => {
  eq(await myAny([failIn(5, 'a'), after(20, 'ok')]), 'ok');
});

test('resolves with the fastest fulfilment', async () => {
  eq(await myAny([after(60, 'slow'), after(5, 'fast')]), 'fast');
});

test('rejects with an AggregateError when all reject', async () => {
  const err = await reasonOf(myAny([failIn(5, 'a'), failIn(10, 'b')]));
  ok(err instanceof AggregateError, `got ${err && err.name}`);
});

test('collects the reasons in input order', async () => {
  const err = await reasonOf(myAny([failIn(20, 'slow'), failIn(5, 'fast')]));
  eq(err.errors.map((e) => e.message), ['slow', 'fast']);
});

test('an empty list rejects with an empty AggregateError', async () => {
  const err = await reasonOf(myAny([]));
  ok(err instanceof AggregateError);
  eq(err.errors, []);
});

test('accepts plain values', async () => {
  eq(await myAny([failIn(5, 'a'), 'plain']), 'plain');
});
