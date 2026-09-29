// ─────────────────────────────────────────────────────────────────────────
//  02 · order · the four Node lanes                            ★★☆ core
//  concepts: event loop · nextTick queue · check phase
//  run: node 02-order-lanes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Predict the output. The snippet below runs inside a callback (that is
//  what makes the answer stable — see the walkthrough):
//
//      setTimeout(() => log('timeout'), 20);
//      setImmediate(() => log('immediate'));
//      Promise.resolve().then(() => log('promise'));
//      queueMicrotask(() => log('microtask'));
//      process.nextTick(() => {
//        log('tick-1');
//        process.nextTick(() => log('tick-2'));
//      });
//      log('sync');
//
//  Fill `answer` with the seven strings in printed order. Two questions
//  decide it: does process.nextTick share a queue with queueMicrotask,
//  and where in the loop does setImmediate actually land?
//
//  hint: Node has FIVE places to be, not two — sync, the nextTick queue,
//  the microtask queue, and then libuv's phases (timers … check)

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
// The whole thing is scheduled from a timer callback on purpose: that
// pins down which queue is being drained when the snippet runs.
export function capture() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const out = [];
      const log = (m) => {
        out.push(m);
        if (out.length === 7) resolve(out); // all seven logs are in
      };
      setTimeout(() => log('timeout'), 20);
      setImmediate(() => log('immediate'));
      Promise.resolve().then(() => log('promise'));
      queueMicrotask(() => log('microtask'));
      process.nextTick(() => {
        log('tick-1');
        process.nextTick(() => log('tick-2'));
      });
      log('sync');
    }, 0);
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

test('the snippet prints the same order every run', async () => {
  requireAnswer();
  eq(await capture(), await capture());
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
