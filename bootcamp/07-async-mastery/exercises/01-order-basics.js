// ─────────────────────────────────────────────────────────────────────────
//  01 · order · sync vs then vs timeout                    ★☆☆ warm-up
//  concepts: event loop · microtasks · macrotasks
//  run: node 01-order-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Predict the output. This snippet runs top to bottom in a file:
//
//      log('script start');
//      setTimeout(() => log('timeout'), 0);
//      Promise.resolve().then(() => log('promise'));
//      log('script end');
//
//  Fill in `answer` with the four logged strings in the exact order
//  Node prints them:
//
//      export const answer = ['script start', ...];
//
//  Guess first, then run the tests — they compare your array against
//  the order the real snippet produces.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 4) resolve(out); // all four logs are in
    };
    log('script start');
    setTimeout(() => log('timeout'), 0);
    Promise.resolve().then(() => log('promise'));
    log('script end');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [];

// ──────────────────────────── tests ──────────────────────────────────────

test('answer is a list of strings', () => {
  requireAnswer();
  ok(Array.isArray(answer) && answer.every((s) => typeof s === 'string'));
});

test('has one entry per log the snippet prints', async () => {
  requireAnswer();
  eq(answer.length, (await capture()).length);
});

test('invents no logs the snippet never prints', async () => {
  requireAnswer();
  const real = await capture();
  ok(answer.every((s) => real.includes(s)));
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
