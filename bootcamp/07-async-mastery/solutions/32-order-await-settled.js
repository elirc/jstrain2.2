// ─────────────────────────────────────────────────────────────────────────
//  32 · order · awaiting things that are already done — SOLUTION  ★★☆ core
//  run: node 32-order-await-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every async body runs synchronously up to its await, so
//  the sync pass is just 'script start' and 'script end' — nothing after
//  an await can beat it.
//  Tick 1 resumes A and B. `await 42` wraps the value with the internal
//  equivalent of Promise.resolve and schedules the continuation — one hop.
//  `await Promise.resolve()` used to cost three hops; since the 2019
//  "await optimisation" a NATIVE promise is also one hop. They were
//  suspended before the .then chain was built, so both beat 't1'.
//  C awaits a FOREIGN thenable — a plain object with a .then method. The
//  engine cannot trust it, so it queues a job to call that .then, and only
//  the callback from that job resolves the wrapper: two hops. C therefore
//  lands on tick 2, after 't1'.
//  The takeaway: `await` is never free, and "already settled" does not
//  mean "synchronous". Code after an await always runs in a later tick.
//  Wrong turn: assuming `await 42` is a no-op the compiler can skip. Put
//  one in a hot loop and you have added one microtask per iteration.

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

export const answer = [
  'script start',
  'script end',
  'A await 42',
  'B await resolved',
  't1',
  'C await thenable',
  't2',
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
