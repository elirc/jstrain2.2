// ─────────────────────────────────────────────────────────────────────────
//  02 · order · the four Node lanes — SOLUTION                 ★★☆ core
//  run: node 02-order-lanes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: 'sync' first, always. Then Node empties the nextTick
//  queue — including ticks queued BY a tick, which is why 'tick-2' shows
//  up before any promise. Only when that queue is empty does V8 drain the
//  microtask queue, in registration order: the `.then` was attached
//  before queueMicrotask, so 'promise' then 'microtask'. Now control
//  returns to libuv, which reaches the check phase and runs 'immediate'.
//  The 20 ms timer waits for a later timers phase, so it is last.
//  Wrong turn: treating nextTick as "just another microtask". It is a
//  separate, higher-priority queue — and that is exactly why an endless
//  nextTick loop can starve promises AND timers at the same time.
//  Second wrong turn: expecting this order everywhere. Schedule the same
//  snippet from inside a `.then` and the ticks move BEHIND the
//  microtasks, because a tick queued during a microtask drain cannot run
//  until that drain finishes. capture() wraps it in a timer callback so
//  the exercise has one right answer.

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

export const answer = [
  'sync',
  'tick-1',
  'tick-2',
  'promise',
  'microtask',
  'immediate',
  'timeout',
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
