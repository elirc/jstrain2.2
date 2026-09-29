// ─────────────────────────────────────────────────────────────────────────
//  30 · order · finally is not a cheap then                 ★★☆ core
//  concepts: microtasks · .finally · pass-through cost
//  run: node 30-order-finally.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Predict the output. The t1..t5 chain is a tick counter running beside
//  the chain under test — read one against the other:
//
//      log('script start');
//      Promise.reject(new Error('nope'))
//        .finally(() => log('finally A'))
//        .catch((e) => log(`catch ${e.message}`))
//        .finally(() => log('finally B'));
//      Promise.resolve()
//        .then(() => log('t1')).then(() => log('t2'))
//        .then(() => log('t3')).then(() => log('t4'))
//        .then(() => log('t5'));
//      log('script end');
//
//  Both chains have their first handler registered in the same tick, so
//  'finally A' and 't1' land together. The question is where 'catch nope'
//  and 'finally B' fall in the t1..t5 ruler. Fill in `answer`:
//
//      export const answer = ['script start', ...];
//
//  hint: `.finally(cb)` has to wait for cb's return value before passing
//  the original outcome along — even when cb returns undefined.

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
    Promise.reject(new Error('nope'))
      .finally(() => log('finally A'))
      .catch((e) => log(`catch ${e.message}`))
      .finally(() => log('finally B'));
    Promise.resolve()
      .then(() => log('t1'))
      .then(() => log('t2'))
      .then(() => log('t3'))
      .then(() => log('t4'))
      .then(() => log('t5'));
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

test('keeps the t1..t5 counter in order', async () => {
  requireAnswer();
  eq(
    answer.filter((s) => /^t\d$/.test(s)),
    ['t1', 't2', 't3', 't4', 't5']
  );
});

test('knows how many ticks the first finally costs the catch', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('catch nope'), real.indexOf('catch nope'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
