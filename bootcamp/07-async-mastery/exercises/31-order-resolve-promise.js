// ─────────────────────────────────────────────────────────────────────────
//  31 · order · the cost of wrapping a promise             ★★★ stretch
//  concepts: microtasks · thenable adoption · Promise.resolve
//  run: node 31-order-resolve-promise.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three ways to hand the SAME already-resolved promise onward. They do
//  not cost the same. t1..t4 is your tick ruler:
//
//      log('script start');
//      const inner = Promise.resolve('inner');
//      Promise.resolve(inner).then(() => log('A resolve(p)'));
//      new Promise((res) => res(inner)).then(() => log('B executor res(p)'));
//      (async () => { log('C async start'); return inner; })()
//        .then(() => log('D async returned p'));
//      Promise.resolve()
//        .then(() => log('t1')).then(() => log('t2'))
//        .then(() => log('t3')).then(() => log('t4'));
//      log('script end');
//
//  One of A/B/D is free, two of them are not. Fill in `answer` with all
//  ten logs in order:
//
//      export const answer = ['script start', ...];
//
//  hint: `Promise.resolve(p)` where p is already a native promise is
//  documented to return p ITSELF. Resolving with a thenable is not.

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
