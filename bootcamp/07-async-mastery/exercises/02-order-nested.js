// ─────────────────────────────────────────────────────────────────────────
//  02 · order · nested microtasks vs timers                ★★☆ core
//  concepts: event loop · queue draining
//  run: node 02-order-nested.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same game, harder: callbacks that schedule more callbacks.
//
//      setTimeout(() => {
//        log('t1');
//        Promise.resolve().then(() => log('t1-then'));
//      }, 0);
//      setTimeout(() => log('t2'), 0);
//      Promise.resolve().then(() => {
//        log('p1');
//        Promise.resolve().then(() => log('p1-then'));
//      });
//      log('sync');
//
//  Fill `answer` with the six strings in printed order. The question
//  that decides it: when a timer callback queues a microtask, does that
//  microtask run before or after the NEXT timer?
//
//  hint: the microtask queue is drained to empty between macrotasks

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 6) resolve(out); // all six logs are in
    };
    setTimeout(() => {
      log('t1');
      Promise.resolve().then(() => log('t1-then'));
    }, 0);
    setTimeout(() => log('t2'), 0);
    Promise.resolve().then(() => {
      log('p1');
      Promise.resolve().then(() => log('p1-then'));
    });
    log('sync');
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

test('puts the synchronous log first', async () => {
  requireAnswer();
  eq(answer[0], (await capture())[0]);
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
