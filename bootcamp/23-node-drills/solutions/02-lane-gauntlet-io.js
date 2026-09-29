// ─────────────────────────────────────────────────────────────────────────
//  02 · lane gauntlet · inside I/O callbacks — SOLUTION          ★★☆ core
//  run: node 02-lane-gauntlet-io.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough, lane by lane.
//
//  Snippet 1: the readFile callback runs in the POLL phase, so its own
//  'io' is first. Then ticks: 'tick'. Then microtasks, in the order they
//  were queued — 'promise' joined the queue during the sync body, and
//  'tick>micro' only during the tick drain, so 'promise' wins. Now libuv
//  moves on, and the phase AFTER poll is check: 'immediate', followed
//  immediately by its own tick, because ticks drain between callbacks.
//  The 0 ms timer has to wait for a timers phase, which is a whole loop
//  iteration away: last. Rule to keep: inside any I/O callback,
//  setImmediate always beats setTimeout(…, 0) — no race, no coin flip.
//
//  Snippet 2: phases decide this one entirely. 'outer-io' runs in poll;
//  'outer>immediate' was queued during poll, so it runs in this same
//  iteration's check phase. The inner readFile can only ever be delivered
//  in a POLL phase, and the earliest one left is the next iteration — so
//  it cannot possibly beat the immediate, no matter how fast the disk is
//  or how warm the page cache is. Then the inner callback's tick drains
//  before libuv reaches check for 'inner>immediate'.
//
//  Snippet 3: ticks first, including the tick a tick queued ('tick-2').
//  Then the microtask drain runs 'promise', which queues both a tick and
//  an immediate. The tick waits for the drain to finish — that is the
//  tick/microtask boundary again — so 'promise>tick' comes next. Both
//  immediates were registered before libuv reached check, so they share
//  one check phase in registration order: 'immediate' (sync body) then
//  'promise>immediate' (microtask drain). Wrong turn: assuming an
//  immediate scheduled "later in time" lands in a later phase.

import { test, eq, ok } from '../../_lib/check.js';
import { readFile } from 'node:fs';
import { fileURLToPath } from 'node:url';

const THIS_FILE = fileURLToPath(import.meta.url);

// ── snippet 1 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('io');
//      setImmediate(() => {
//        log('immediate');
//        process.nextTick(() => log('immediate>tick'));
//      });
//      setTimeout(() => log('timeout'), 0);
//      process.nextTick(() => {
//        log('tick');
//        queueMicrotask(() => log('tick>micro'));
//      });
//      Promise.resolve().then(() => log('promise'));
//    });
//
export function capture1() {
  return inIO(7, (log) => {
    log('io');
    setImmediate(() => {
      log('immediate');
      process.nextTick(() => log('immediate>tick'));
    });
    setTimeout(() => log('timeout'), 0);
    process.nextTick(() => {
      log('tick');
      queueMicrotask(() => log('tick>micro'));
    });
    Promise.resolve().then(() => log('promise'));
  });
}

// ── snippet 2 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('outer-io');
//      setImmediate(() => log('outer>immediate'));
//      readFile(THIS_FILE, () => {
//        log('inner-io');
//        setImmediate(() => log('inner>immediate'));
//        process.nextTick(() => log('inner>tick'));
//      });
//    });
//
export function capture2() {
  return inIO(5, (log) => {
    log('outer-io');
    setImmediate(() => log('outer>immediate'));
    readFile(THIS_FILE, () => {
      log('inner-io');
      setImmediate(() => log('inner>immediate'));
      process.nextTick(() => log('inner>tick'));
    });
  });
}

// ── snippet 3 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('io');
//      process.nextTick(() => {
//        log('tick-1');
//        process.nextTick(() => log('tick-2'));
//      });
//      Promise.resolve().then(() => {
//        log('promise');
//        process.nextTick(() => log('promise>tick'));
//        setImmediate(() => log('promise>immediate'));
//      });
//      setImmediate(() => log('immediate'));
//    });
//
export function capture3() {
  return inIO(7, (log) => {
    log('io');
    process.nextTick(() => {
      log('tick-1');
      process.nextTick(() => log('tick-2'));
    });
    Promise.resolve().then(() => {
      log('promise');
      process.nextTick(() => log('promise>tick'));
      setImmediate(() => log('promise>immediate'));
    });
    setImmediate(() => log('immediate'));
  });
}

// Provided: runs a snippet inside a readFile callback and resolves with
// the logs once all `count` of them have arrived.
function inIO(count, snippet) {
  return new Promise((resolve) => {
    readFile(THIS_FILE, () => {
      const out = [];
      snippet((message) => {
        out.push(message);
        if (out.length === count) resolve(out);
      });
    });
  });
}

const requireAnswer = (answer, name) => {
  if (answer.length === 0) throw new Error(`TODO: fill in \`${name}\``);
};

export const answer1 = [
  'io',
  'tick',
  'promise',
  'tick>micro',
  'immediate',
  'immediate>tick',
  'timeout',
];

export const answer2 = [
  'outer-io',
  'outer>immediate',
  'inner-io',
  'inner>tick',
  'inner>immediate',
];

export const answer3 = [
  'io',
  'tick-1',
  'tick-2',
  'promise',
  'promise>tick',
  'immediate',
  'promise>immediate',
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

test('snippet 2 gets the order exactly right', async () => {
  requireAnswer(answer2, 'answer2');
  eq(answer2, await capture2());
});

test('snippet 3 lists every log exactly once', async () => {
  requireAnswer(answer3, 'answer3');
  eq([...answer3].sort(), [...(await capture3())].sort());
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
