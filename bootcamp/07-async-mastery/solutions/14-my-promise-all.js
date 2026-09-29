// ─────────────────────────────────────────────────────────────────────────
//  14 · myPromiseAll — SOLUTION                            ★★★ stretch
//  run: node 14-my-promise-all.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: you cannot push results as they arrive — that gives
//  completion order. Allocate the array up front and write each result
//  at its own index, then track a countdown of outstanding items;
//  resolve when it hits zero. The empty case must be handled before the
//  loop, because the countdown would never reach zero by itself.
//  Rejection is easier than it looks: pass `reject` straight in as the
//  second argument of .then. A promise ignores every settle call after
//  the first, so the first rejection wins and the rest are no-ops.
//  `Promise.resolve(item)` normalises plain values into promises.
//  Wrong turn: `left === 0` checked before the .then handlers run, or
//  using out.push — both fail the ordering test.

import { test, eq, ok, rejects } from '../../_lib/check.js';

export const after = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const failIn = (ms, message) => {
  const p = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  p.catch(() => {}); // keeps an unfinished exercise from crashing Node
  return p;
};

// A promise that never settles — nothing may wait on it.
const never = new Promise(() => {});

export function myPromiseAll(items) {
  const list = [...items];
  return new Promise((resolve, reject) => {
    const out = new Array(list.length);
    let left = list.length;
    if (left === 0) {
      resolve([]);
      return;
    }
    list.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        out[i] = value;
        left -= 1;
        if (left === 0) resolve(out);
      }, reject);
    });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with every value', async () => {
  eq(await myPromiseAll([after(5, 1), after(10, 2)]), [1, 2]);
});

test('keeps input order, not completion order', async () => {
  eq(await myPromiseAll([after(30, 'a'), after(5, 'b')]), ['a', 'b']);
});

test('accepts plain values alongside promises', async () => {
  eq(await myPromiseAll([1, after(5, 2), Promise.resolve(3)]), [1, 2, 3]);
});

test('resolves with [] for an empty list', async () => {
  eq(await myPromiseAll([]), []);
});

test('rejects with the first rejection reason', async () => {
  await rejects(myPromiseAll([after(30, 'a'), failIn(5, 'boom')]), 'boom');
});

test('rejects without waiting for the pending ones', async () => {
  const p = myPromiseAll([never, failIn(5, 'early')]);
  await rejects(p, 'early');
});

test('returns a fresh array', async () => {
  const input = [1, 2];
  const out = await myPromiseAll(input);
  ok(out !== input, 'do not hand back the input array');
});
