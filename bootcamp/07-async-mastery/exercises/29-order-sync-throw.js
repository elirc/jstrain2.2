// ─────────────────────────────────────────────────────────────────────────
//  29 · order · a throw inside a then chain                 ★★☆ core
//  concepts: microtasks · rejection propagation · skipped handlers
//  run: node 29-order-sync-throw.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Predict the output. Two independent chains start in the same tick, so
//  you can read the tick number off the second one:
//
//      log('script start');
//      Promise.resolve()
//        .then(() => { log('then 1'); throw new Error('boom'); })
//        .then(() => log('then 2'))
//        .catch((e) => log(`catch ${e.message}`))
//        .then(() => log('then 3'));
//      Promise.resolve()
//        .then(() => log('other A'))
//        .then(() => log('other B'))
//        .then(() => log('other C'));
//      log('script end');
//
//  One of those nine log calls never happens. Fill in `answer` with the
//  strings that DO get logged, in the exact order Node prints them:
//
//      export const answer = ['script start', ...];
//
//  hint: a skipped handler still costs its chain one microtask hop.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 8) resolve(out); // all eight logs are in
    };
    log('script start');
    Promise.resolve()
      .then(() => {
        log('then 1');
        throw new Error('boom');
      })
      .then(() => log('then 2'))
      .catch((e) => log(`catch ${e.message}`))
      .then(() => log('then 3'));
    Promise.resolve()
      .then(() => log('other A'))
      .then(() => log('other B'))
      .then(() => log('other C'));
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

test('leaves out the handler the rejection skips', async () => {
  requireAnswer();
  const real = await capture();
  eq(
    answer.filter((s) => !real.includes(s)),
    []
  );
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('puts the catch on the right tick of the other chain', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('catch boom'), real.indexOf('catch boom'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
