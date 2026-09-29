// ─────────────────────────────────────────────────────────────────────────
//  16 · myRace — SOLUTION                                  ★★☆ core
//  run: node 16-my-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three lines. Create one promise, then loop the inputs
//  and give each one `.then(resolve, reject)` — the same pair of settle
//  functions. First call through the door wins; every later call is
//  silently discarded by the promise machinery, which is exactly the
//  semantics you want.
//  The empty case needs no special handling: no inputs means nobody ever
//  calls resolve or reject, and a forever-pending promise is precisely
//  what the spec says Promise.race([]) returns.
//  Wrong turn: tracking a `settled` flag by hand. Harmless but
//  unnecessary — you cannot un-settle a promise anyway.

import { test, eq, rejects } from '../../_lib/check.js';

export const after = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const failIn = (ms, message) => {
  const p = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  p.catch(() => {}); // keeps an unfinished exercise from crashing Node
  return p;
};

export function myRace(items) {
  return new Promise((resolve, reject) => {
    for (const item of items) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the fastest value', async () => {
  eq(await myRace([after(60, 'slow'), after(5, 'fast')]), 'fast');
});

test('order in the array does not matter', async () => {
  eq(await myRace([after(5, 'fast'), after(60, 'slow')]), 'fast');
});

test('rejects when the first to settle is a rejection', async () => {
  await rejects(myRace([after(60, 'slow'), failIn(5, 'boom')]), 'boom');
});

test('a rejection after the race is over changes nothing', async () => {
  let rejectLate;
  const late = new Promise((_, reject) => {
    rejectLate = reject;
  });
  late.catch(() => {});
  const winner = myRace([after(5, 'fast'), late]);
  eq(await winner, 'fast');
  rejectLate(new Error('late'));
  eq(await winner, 'fast');
});

test('a plain value wins immediately', async () => {
  eq(await myRace([after(5, 'fast'), 'now']), 'now');
});

test('an empty list never settles', async () => {
  const winner = await Promise.race([myRace([]), after(20, 'still pending')]);
  eq(winner, 'still pending');
});
