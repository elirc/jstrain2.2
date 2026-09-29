// ─────────────────────────────────────────────────────────────────────────
//  40 · firstSuccess (fallback chain)                       ★★☆ core
//  concepts: Promise.any · AggregateError · error aggregation
//  run: node 40-fallback-any.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three CDN mirrors, one config file. Take whichever answers first — and
//  if they all die, produce ONE error that still says what each mirror
//  said. Build `firstSuccess(loaders, label)`:
//
//      await firstSuccess([slowOk, fastFail, mediumOk])  → mediumOk's value
//      await firstSuccess([bad1, bad2, bad3], 'mirror')
//        → rejects: Error('all 3 mirror attempts failed'),
//                   err.errors === [reason1, reason2, reason3]
//
//  Rules:
//    · `loaders` is an array of zero-argument functions returning promises
//    · every loader starts at once — a fan-out, not a sequence
//    · a rejection from a FASTER loader must not decide the outcome
//    · when everything fails, `.errors` holds the reasons in INPUT order
//    · an empty list rejects immediately, with `.errors` === []
//
//  hint: Promise.any already does the hard half, including the input
//  ordering of AggregateError.errors. Your job is not to lose it.

import { test, eq, rejects, sleep } from '../../_lib/check.js';

export const ok_ = (value, ms) => () => sleep(ms).then(() => value);
export const bad = (message, ms) => () =>
  sleep(ms).then(() => {
    throw new Error(message);
  });

export function firstSuccess(loaders, label = 'source') {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value of the fastest loader that works', async () => {
  eq(await firstSuccess([ok_('slow', 30), ok_('fast', 10)]), 'fast');
});

test('ignores a loader that fails first', async () => {
  eq(await firstSuccess([bad('mirror 1 down', 10), ok_('cfg', 20)]), 'cfg');
});

test('rejects only when every loader fails', async () => {
  await rejects(
    firstSuccess([bad('down 1', 10), bad('down 2', 15)]),
    'attempts failed'
  );
});

test('collects every reason, in input order', async () => {
  const err = await firstSuccess([
    bad('down 1', 20),
    bad('down 2', 10),
    bad('down 3', 15),
  ]).then(
    () => null,
    (e) => e
  );
  eq(
    err.errors.map((e) => e.message),
    ['down 1', 'down 2', 'down 3']
  );
});

test('names the count and the label in the message', async () => {
  const err = await firstSuccess(
    [bad('a', 10), bad('b', 10), bad('c', 10)],
    'mirror'
  ).then(
    () => null,
    (e) => e
  );
  eq(err.message, 'all 3 mirror attempts failed');
});

test('an empty list rejects instead of hanging forever', async () => {
  const err = await firstSuccess([], 'mirror').then(
    () => null,
    (e) => e
  );
  eq(err.message, 'all 0 mirror attempts failed');
  eq(err.errors, []);
});

test('calls every loader — this is a fan-out, not a sequence', async () => {
  let started = 0;
  const count = (fn) => () => {
    started += 1;
    return fn();
  };
  await firstSuccess([
    count(ok_('a', 20)),
    count(ok_('b', 10)),
    count(ok_('c', 15)),
  ]);
  eq(started, 3);
});
