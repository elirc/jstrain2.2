// ─────────────────────────────────────────────────────────────────────────
//  03 · order · async/await desugaring — SOLUTION          ★★☆ core
//  run: node 03-order-async-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: calling outer() runs its body synchronously until the
//  first await — that is why 'outer start' and 'inner' print before
//  'script end'. `await inner()` then hands the rest of outer's body to
//  the microtask queue, exactly like inner().then(rest).
//  So the sync pass prints: script start, outer start, inner, script end.
//  Microtask queue in registration order: outer's continuation
//  ('outer end') was queued before the `.then(then A)` handler, so it
//  goes first; 'then B' is only queued once 'then A' resolves, one tick
//  later. Timers come dead last: 'timeout'.
//  Wrong turn: thinking `await` blocks the file. It only suspends the
//  async function; the caller keeps running the next line immediately.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  const out = [];
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  const log = (m) => {
    out.push(m);
    if (out.length === 8) finish(out); // all eight logs are in
  };
  const inner = async () => {
    log('inner');
  };
  const outer = async () => {
    log('outer start');
    await inner();
    log('outer end');
  };
  log('script start');
  setTimeout(() => log('timeout'), 0);
  outer();
  Promise.resolve()
    .then(() => log('then A'))
    .then(() => log('then B'));
  log('script end');
  return done;
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [
  'script start',
  'outer start',
  'inner',
  'script end',
  'outer end',
  'then A',
  'then B',
  'timeout',
];

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

test('knows the timer callback runs last', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer[answer.length - 1], real[real.length - 1]);
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
