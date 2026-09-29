// ─────────────────────────────────────────────────────────────────────────
//  01 · lane gauntlet · anchored in a timer                     ★★☆ core
//  concepts: event loop · nextTick queue · microtasks · check phase
//  run: node 01-lane-gauntlet-timer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You saw the four lanes in module 17. Now do it cold, three times.
//
//  Each snippet below runs inside a `setTimeout(…, 0)` callback, which is
//  what makes the answer deterministic instead of a coin flip. Read each
//  one, predict the printed order, and fill in the matching array. No
//  running it first and copying the output — that is not the drill.
//
//      answer1 → ['sync', …]   six strings
//      answer2 → ['sync', …]   six strings
//      answer3 → ['sync', …]   six strings

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

export const answer1 = [];

export const answer2 = [];

export const answer3 = [];

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
