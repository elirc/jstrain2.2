// ─────────────────────────────────────────────────────────────────────────
//  32 · order · awaiting things that are already done       ★★☆ core
//  concepts: await · microtasks · thenables
//  run: node 32-order-await-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Nothing here is slow: a number, a resolved promise, a hand-rolled
//  thenable that calls back immediately. They still do not resume on the
//  same tick. t1..t4 is the ruler:
//
//      log('script start');
//      (async () => { await 42; log('A await 42'); })();
//      (async () => { await Promise.resolve(); log('B await resolved'); })();
//      (async () => { await { then: (res) => res() };
//                     log('C await thenable'); })();
//      Promise.resolve()
//        .then(() => log('t1')).then(() => log('t2'))
//        .then(() => log('t3')).then(() => log('t4'));
//      log('script end');
//
//  Two of A/B/C resume on the same tick; one is late. Fill in `answer`
//  with all nine logs in order:
//
//      export const answer = ['script start', ...];
//
//  hint: `await` on a NATIVE promise or a plain value is one hop. A
//  foreign thenable has to be wrapped first — and wrapping costs a job.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 9) resolve(out); // all nine logs are in
    };
    log('script start');
    (async () => {
      await 42;
      log('A await 42');
    })();
    (async () => {
      await Promise.resolve();
      log('B await resolved');
    })();
    (async () => {
      await { then: (res) => res() };
      log('C await thenable');
    })();
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

test('knows no async body resumes before the sync pass ends', async () => {
  requireAnswer();
  const end = answer.indexOf('script end');
  ok(['A await 42', 'B await resolved', 'C await thenable'].every(
    (s) => answer.indexOf(s) > end
  ));
});

test('spots the one that resumes a tick late', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('C await thenable'), real.indexOf('C await thenable'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
