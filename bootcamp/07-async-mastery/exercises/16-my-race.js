// ─────────────────────────────────────────────────────────────────────────
//  16 · myRace                                             ★★☆ core
//  concepts: combinators · first settlement wins · settle-once
//  run: node 16-my-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Promise.race settles with whichever input settles FIRST — fulfilled
//  or rejected, whichever comes in first.
//
//      await myRace([after(30,'slow'), after(5,'fast')])   → 'fast'
//      await myRace([after(30,'slow'), failIn(5,'boom')])  → rejects 'boom'
//      myRace([])                                          → never settles
//
//  Losers are not cancelled — they finish, and their results are simply
//  ignored. That "ignored" is free: a promise settles once. This is the
//  engine behind timeouts, which you build two exercises from now.
//
//  hint: attach the SAME resolve/reject to every input

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
  throw new Error('TODO');
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
