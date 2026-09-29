// ─────────────────────────────────────────────────────────────────────────
//  25 · pollUntil — SOLUTION                               ★★☆ core
//  run: node 25-poll-until.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an infinite for-loop with two exits. Await the check —
//  that one await makes a sync predicate and an async one behave
//  identically. Truthy? return the value, so callers get the row they
//  were waiting for. Otherwise compare the clock against a deadline
//  captured before the loop, throw if it has passed, and sleep one
//  interval.
//  Order matters: checking before sleeping means a ready condition
//  returns immediately, and checking the deadline before sleeping means
//  you never sleep past a timeout you already blew.
//  Wrong turn: setInterval. It keeps firing while a slow check is still
//  running, so you get overlapping checks and a timer to clean up.

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

// A check that stays null until its Nth call, then returns `value`.
export function makeCheck(n, value = 'ready') {
  let calls = 0;
  return spy(() => {
    calls += 1;
    return calls >= n ? value : null;
  });
}

export async function pollUntil(check, options = {}) {
  const { intervalMs = 10, timeoutMs = 200 } = options;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() >= deadline) throw new Error('poll timed out');
    await sleep(intervalMs);
  }
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
