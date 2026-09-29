// ─────────────────────────────────────────────────────────────────────────
//  03 · order · async/await desugaring                     ★★☆ core
//  concepts: async functions · await · microtasks
//  run: node 03-order-async-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The classic interview snippet. `await` is not a pause button for the
//  program — it is a `.then` in disguise.
//
//      async function inner() { log('inner'); }
//      async function outer() {
//        log('outer start');
//        await inner();
//        log('outer end');
//      }
//      log('script start');
//      setTimeout(() => log('timeout'), 0);
//      outer();
//      Promise.resolve().then(() => log('then A')).then(() => log('then B'));
//      log('script end');
//
//  Fill `answer` with the eight strings in printed order.
//
//  hint: an async body runs synchronously up to the first await

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

test('knows the timer callback runs last', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer[answer.length - 1], real[real.length - 1]);
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
