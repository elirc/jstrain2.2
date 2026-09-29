// ─────────────────────────────────────────────────────────────────────────
//  31 · order · the cost of wrapping a promise — SOLUTION  ★★★ stretch
//  run: node 31-order-resolve-promise.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the sync pass prints 'script start', then 'C async start'
//  (an async function body runs synchronously up to its first await —
//  there is no await here, so the whole body runs now), then 'script end'.
//  Tick 1: `Promise.resolve(inner)` returned `inner` ITSELF — the spec
//  short-circuits when the argument is already a native promise — so A's
//  handler is a plain first-tick reaction. 't1' follows it.
//  B and D both RESOLVE a promise WITH another promise. That triggers
//  NewPromiseResolveThenableJob: tick 1 schedules a job, tick 2 runs it and
//  calls inner.then(resolveOuter), tick 3 delivers. So B and D fire on
//  tick 3, two ticks behind A, after 't2' has already gone by.
//  `return somePromise` from an async function is exactly this pattern,
//  which is the folklore "returning a promise from async costs two ticks"
//  — and why `return await p` is sometimes FASTER, not slower.
//  Wrong turn: assuming all three are equivalent because they all "wrap a
//  promise". Identity short-circuit vs thenable adoption is a real 2-tick
//  difference, and it decides who wins a race.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 10) resolve(out); // all ten logs are in
    };
    log('script start');
    const inner = Promise.resolve('inner');
    Promise.resolve(inner).then(() => log('A resolve(p)'));
    new Promise((res) => res(inner)).then(() => log('B executor res(p)'));
    (async () => {
      log('C async start');
      return inner;
    })().then(() => log('D async returned p'));
    Promise.resolve()
      .then(() => log('t1'))
      .then(() => log('t2'))
      .then(() => log('t3'))
      .then(() => log('t4'));
    log('script end');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [
  'script start',
  'C async start',
  'script end',
  'A resolve(p)',
  't1',
  't2',
  'B executor res(p)',
  'D async returned p',
  't3',
  't4',
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

test('knows the async body runs before script end', async () => {
  requireAnswer();
  ok(answer.indexOf('C async start') < answer.indexOf('script end'));
});

test('knows which wrapper is free', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('A resolve(p)'), real.indexOf('A resolve(p)'));
});

test('knows the two that pay for thenable adoption', async () => {
  requireAnswer();
  const real = await capture();
  eq(
    [answer.indexOf('B executor res(p)'), answer.indexOf('D async returned p')],
    [real.indexOf('B executor res(p)'), real.indexOf('D async returned p')]
  );
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
