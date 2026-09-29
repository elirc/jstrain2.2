// ─────────────────────────────────────────────────────────────────────────
//  25 · pollUntil                                          ★★☆ core
//  concepts: polling loops · deadlines · async predicates
//  run: node 25-poll-until.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Half of integration testing is "wait until the thing is ready".
//  Poll a check function until it returns something truthy.
//
//      await pollUntil(() => jobStatus() === 'done')      → true
//      await pollUntil(() => findRow(id))                 → the row
//      await pollUntil(neverTrue, { timeoutMs: 40 })
//          → rejects with Error('poll timed out')
//
//  `pollUntil(check, { intervalMs = 10, timeoutMs = 200 })`. Check
//  first, THEN wait — a condition that is already true must not cost an
//  interval. check may be sync or async; resolve with its truthy value,
//  not with `true`. Stop calling it the moment it succeeds.
//
//  hint: `await check()` works for both sync and async checks

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

// A check that stays null until its Nth call, then returns `value`.
export function makeCheck(n, value = 'ready') {
  let calls = 0;
  return spy(() => {
    calls += 1;
    return calls >= n ? value : null;
  });
}

export function pollUntil(check, options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the truthy value, not just true', async () => {
  const check = makeCheck(1, { id: 7 });
  eq(await pollUntil(check), { id: 7 });
});

test('does not wait when the condition is already true', async () => {
  const t0 = Date.now();
  await pollUntil(makeCheck(1), { intervalMs: 50 });
  ok(Date.now() - t0 < 40, 'check first, sleep second');
});

test('keeps checking until the condition holds', async () => {
  const check = makeCheck(3);
  eq(await pollUntil(check, { intervalMs: 5 }), 'ready');
  eq(check.callCount, 3);
});

test('stops checking once it succeeds', async () => {
  const check = makeCheck(2);
  await pollUntil(check, { intervalMs: 5 });
  const after = check.callCount;
  await sleep(30);
  eq(check.callCount, after);
});

test('rejects when the condition never holds', async () => {
  const check = makeCheck(999);
  const p = pollUntil(check, { intervalMs: 5, timeoutMs: 40 });
  await rejects(p, 'poll timed out');
});

test('works with an async check', async () => {
  let calls = 0;
  const check = async () => {
    calls += 1;
    await sleep(1);
    return calls >= 2 ? 'async ready' : false;
  };
  eq(await pollUntil(check, { intervalMs: 5 }), 'async ready');
});
