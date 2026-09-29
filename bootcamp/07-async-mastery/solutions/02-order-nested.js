// ─────────────────────────────────────────────────────────────────────────
//  02 · order · nested microtasks vs timers — SOLUTION     ★★☆ core
//  run: node 02-order-nested.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: 'sync' first — synchronous code always wins. Then the
//  microtask queue drains: 'p1' runs, and the microtask IT queues
//  ('p1-then') is appended to the SAME queue and runs in this same
//  drain. Draining means "until empty", not "the ones queued so far".
//  Now the timers phase: 't1' runs and queues a microtask. In Node 11+
//  (and in browsers) the microtask queue is drained after EACH macrotask
//  callback, so 't1-then' runs before 't2' — not after all timers.
//  Wrong turn: expecting t1, t2, t1-then. That was old Node 10 behaviour
//  where all expired timers ran back to back.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 6) resolve(out); // all six logs are in
    };
    setTimeout(() => {
      log('t1');
      Promise.resolve().then(() => log('t1-then'));
    }, 0);
    setTimeout(() => log('t2'), 0);
    Promise.resolve().then(() => {
      log('p1');
      Promise.resolve().then(() => log('p1-then'));
    });
    log('sync');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = ['sync', 'p1', 'p1-then', 't1', 't1-then', 't2'];

// ──────────────────────────── tests ──────────────────────────────────────

test('answer is a list of strings', () => {
  requireAnswer();
  ok(Array.isArray(answer) && answer.every((s) => typeof s === 'string'));
});

test('has one entry per log the snippet prints', async () => {
  requireAnswer();
  eq(answer.length, (await capture()).length);
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('puts the synchronous log first', async () => {
  requireAnswer();
  eq(answer[0], (await capture())[0]);
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
