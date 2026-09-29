// ─────────────────────────────────────────────────────────────────────────
//  40 · firstSuccess (fallback chain) — SOLUTION            ★★☆ core
//  run: node 40-fallback-any.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: call every loader to start the work, hand the promises to
//  `Promise.any`, and catch its AggregateError to relabel it. `any` is the
//  only combinator with "first SUCCESS" semantics — race would hand you
//  the fastest FAILURE, and all would reject the moment one mirror died.
//  The catch does two things and no more: it builds a message a human can
//  act on, and it re-attaches `errors` so nothing is lost. Use
//  `{ cause: err }` too if you want the original AggregateError in the
//  stack — the rule is that a wrapper must never be a black hole.
//  Note the empty-list case. `Promise.any([])` rejects immediately with an
//  AggregateError whose `errors` is `[]`, which is exactly the behaviour
//  you want; `Promise.race([])` by contrast hangs forever.
//  This is a fan-out, not a sequence: all three mirrors are hit. If you
//  need "try 2 only if 1 fails", that is a reduce over `.catch`, and it
//  trades latency for load.
//  Wrong turn: `catch (e) { throw new Error('all failed'); }`. You now
//  have an alert that says nothing and no way to tell a DNS failure from
//  a 403.

import { test, eq, rejects, sleep } from '../../_lib/check.js';

export const ok_ = (value, ms) => () => sleep(ms).then(() => value);
export const bad = (message, ms) => () =>
  sleep(ms).then(() => {
    throw new Error(message);
  });

export async function firstSuccess(loaders, label = 'source') {
  try {
    return await Promise.any(loaders.map((load) => load()));
  } catch (err) {
    const reasons = err.errors ?? [];
    const wrapped = new Error(
      `all ${loaders.length} ${label} attempts failed`,
      { cause: err }
    );
    wrapped.errors = reasons;
    throw wrapped;
  }
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
