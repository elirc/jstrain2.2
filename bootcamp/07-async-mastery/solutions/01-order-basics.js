// ─────────────────────────────────────────────────────────────────────────
//  01 · order · sync vs then vs timeout — SOLUTION         ★☆☆ warm-up
//  run: node 01-order-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the call stack runs to completion before anything async
//  happens, so both plain log() calls print first: 'script start',
//  'script end'. Now the stack is empty and Node drains the MICROTASK
//  queue — .then/.catch/.finally callbacks and await resumptions live
//  there — so 'promise' is third. Only when the microtask queue is
//  completely empty does the event loop move on to the next MACROTASK,
//  which is the timer callback: 'timeout'.
//  setTimeout(fn, 0) never means "now". It means "in the timers phase of
//  a later loop turn, after all synchronous code and after every pending
//  microtask". A .then registered later still wins.

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

export const answer = ['script start', 'script end', 'promise', 'timeout'];

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
