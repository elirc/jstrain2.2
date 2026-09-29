// ─────────────────────────────────────────────────────────────────────────
//  01 · lane gauntlet · anchored in a timer — SOLUTION           ★★☆ core
//  run: node 01-lane-gauntlet-timer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough, lane by lane.
//
//  Snippet 1 is the tick/microtask boundary in both directions. 'sync'
//  first, always. Then the nextTick queue: 'tick', whose `.then` joins the
//  microtask queue BEHIND the one registered during the sync body. So the
//  microtask drain prints 'promise' then 'tick>promise'. The tick queued
//  from inside 'promise' does NOT interrupt that drain: Node runs ticks,
//  then drains microtasks to empty, then loops back for ticks — so
//  'promise>tick' comes after the last microtask. Only then does libuv
//  reach the check phase for 'immediate'.
//
//  Snippet 2 is the check phase in slow motion. Both setImmediates were
//  registered during the timers phase, so both run in the same check
//  phase, in registration order. The pair "drain ticks, drain microtasks"
//  runs BETWEEN callbacks, in every phase — that is why immediate-1's tick
//  and promise both print before immediate-2 ever starts. The 0 ms timer
//  was created inside the timers phase, so it cannot run until the next
//  trip around the loop: last.
//
//  Snippet 3 is chain ordering. `.then` callbacks are queued when their
//  promise settles, not when they are written. 'then-1' and 'other-then'
//  are both queued during the sync body, in that order; 'then-2' only
//  joins the queue when 'then-1' returns — by then 'other-then' is
//  already ahead of it. Wrong turn: reading a `.then` chain as a block
//  that runs to completion before other microtasks get a turn.

import { test, eq, ok } from '../../_lib/check.js';

// ── snippet 1 ────────────────────────────────────────────────────────────
//
//      process.nextTick(() => {
//        log('tick');
//        Promise.resolve().then(() => log('tick>promise'));
//      });
//      Promise.resolve().then(() => {
//        log('promise');
//        process.nextTick(() => log('promise>tick'));
//      });
//      setImmediate(() => log('immediate'));
//      log('sync');
//
export function capture1() {
  return anchored(6, (log) => {
    process.nextTick(() => {
      log('tick');
      Promise.resolve().then(() => log('tick>promise'));
    });
    Promise.resolve().then(() => {
      log('promise');
      process.nextTick(() => log('promise>tick'));
    });
    setImmediate(() => log('immediate'));
    log('sync');
  });
}

// ── snippet 2 ────────────────────────────────────────────────────────────
//
//      setTimeout(() => log('timeout'), 0);
//      setImmediate(() => {
//        log('immediate-1');
//        process.nextTick(() => log('immediate-1>tick'));
//        Promise.resolve().then(() => log('immediate-1>promise'));
//      });
//      setImmediate(() => log('immediate-2'));
//      log('sync');
//
export function capture2() {
  return anchored(6, (log) => {
    setTimeout(() => log('timeout'), 0);
    setImmediate(() => {
      log('immediate-1');
      process.nextTick(() => log('immediate-1>tick'));
      Promise.resolve().then(() => log('immediate-1>promise'));
    });
    setImmediate(() => log('immediate-2'));
    log('sync');
  });
}

// ── snippet 3 ────────────────────────────────────────────────────────────
//
//      Promise.resolve()
//        .then(() => log('then-1'))
//        .then(() => log('then-2'));
//      Promise.resolve().then(() => log('other-then'));
//      process.nextTick(() => log('tick'));
//      setImmediate(() => log('immediate'));
//      log('sync');
//
export function capture3() {
  return anchored(6, (log) => {
    Promise.resolve()
      .then(() => log('then-1'))
      .then(() => log('then-2'));
    Promise.resolve().then(() => log('other-then'));
    process.nextTick(() => log('tick'));
    setImmediate(() => log('immediate'));
    log('sync');
  });
}

// Provided: runs a snippet inside a timer callback and resolves with the
// logs once all `count` of them have arrived.
function anchored(count, snippet) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const out = [];
      snippet((message) => {
        out.push(message);
        if (out.length === count) resolve(out);
      });
    }, 0);
  });
}

const requireAnswer = (answer, name) => {
  if (answer.length === 0) throw new Error(`TODO: fill in \`${name}\``);
};

export const answer1 = [
  'sync',
  'tick',
  'promise',
  'tick>promise',
  'promise>tick',
  'immediate',
];

export const answer2 = [
  'sync',
  'immediate-1',
  'immediate-1>tick',
  'immediate-1>promise',
  'immediate-2',
  'timeout',
];

export const answer3 = [
  'sync',
  'tick',
  'then-1',
  'other-then',
  'then-2',
  'immediate',
];

// ──────────────────────────── tests ──────────────────────────────────────

test('all three answers are filled in with strings', () => {
  for (const [answer, name] of [
    [answer1, 'answer1'],
    [answer2, 'answer2'],
    [answer3, 'answer3'],
  ]) {
    requireAnswer(answer, name);
    ok(answer.every((s) => typeof s === 'string'), `${name} holds strings`);
  }
});

test('snippet 1 lists every log exactly once', async () => {
  requireAnswer(answer1, 'answer1');
  eq([...answer1].sort(), [...(await capture1())].sort());
});

test('snippet 1 gets the order exactly right', async () => {
  requireAnswer(answer1, 'answer1');
  eq(answer1, await capture1());
});

test('snippet 2 lists every log exactly once', async () => {
  requireAnswer(answer2, 'answer2');
  eq([...answer2].sort(), [...(await capture2())].sort());
});

test('snippet 2 gets the order exactly right', async () => {
  requireAnswer(answer2, 'answer2');
  eq(answer2, await capture2());
});

test('snippet 3 gets the order exactly right', async () => {
  requireAnswer(answer3, 'answer3');
  eq(answer3, await capture3());
});

test('all three snippets print the same order every run', async () => {
  requireAnswer(answer1, 'answer1');
  eq(await capture1(), await capture1());
  eq(await capture2(), await capture2());
  eq(await capture3(), await capture3());
});
