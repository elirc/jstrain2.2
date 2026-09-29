// ─────────────────────────────────────────────────────────────────────────
//  17 · myAny                                              ★★★ stretch
//  concepts: combinators · AggregateError · failure accumulation
//  run: node 17-my-any.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Promise.any is race's optimistic cousin: the first FULFILMENT wins,
//  and rejections are ignored unless every single input rejects.
//
//      await myAny([failIn(5,'a'), after(20,'ok')])  → 'ok'
//      await myAny([failIn(5,'a'), failIn(10,'b')])  → rejects with an
//          AggregateError whose .errors is [Error('a'), Error('b')]
//      await myAny([])                               → rejects, same way
//
//  Build the AggregateError yourself: `new AggregateError(errors, msg)`.
//  Its .errors array must follow INPUT order, not failure order — three
//  mirrors of myPromiseAll, flipped.
//
//  hint: count down rejections; resolve on the very first success

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
  throw new Error('TODO');
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
