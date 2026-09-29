// ─────────────────────────────────────────────────────────────────────────
//  14 · myPromiseAll                                       ★★★ stretch
//  concepts: combinators · counters · index-keyed results
//  run: node 14-my-promise-all.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Rebuild Promise.all from scratch, with new Promise and .then only.
//
//      await myPromiseAll([after(30,'a'), after(5,'b')])  → ['a', 'b']
//      await myPromiseAll([])                             → []
//      await myPromiseAll([ok, failsIn5ms])               → rejects
//
//  The three rules the tests enforce: results come back in INPUT order
//  even though 'b' settles first, an empty list resolves immediately
//  with [], and the first rejection rejects the whole thing without
//  waiting for anything still pending. Non-promise items are allowed.
//
//  hint: write results into `out[i]` and count down how many are left

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
  throw new Error('TODO');
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
