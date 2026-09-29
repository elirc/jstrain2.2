// ─────────────────────────────────────────────────────────────────────────
//  03 · lane gauntlet · await in the mix — SOLUTION           ★★★ stretch
//  run: node 03-lane-gauntlet-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough, lane by lane.
//
//  Snippet 1: `run()` is not deferred — its body runs synchronously until
//  the first `await`, so 'fn-start' beats 'sync'. That first await queues
//  the resumption as microtask #1; the `.then` right after queues 'then-1'
//  as microtask #2. Ticks still go first ('tick'), then the drain
//  alternates between the two chains because each resumption re-queues at
//  the back: after-await-1, then-1, after-await-2, then-2. Two awaits and
//  a two-link chain interleave one for one. Then check: 'immediate'.
//
//  Snippet 2: the promise is resolved from inside a timer callback, so
//  'got:a' runs as a microtask right after that callback returns — still
//  in the timers phase. The tick registered by the resumed function drains
//  next (the microtask queue empties first), then libuv reaches check for
//  'after-a:immediate'. Only then does the loop come round to the second
//  timer. That is the shape of every "await a network call, then do more
//  work" handler: the continuation is a microtask on the callback that
//  resolved it, not a new phase.
//
//  Snippet 3: 'w-sync' before 'sync' for the same reason as snippet 1.
//  The interesting log is 'w-tick': it is queued from inside a microtask,
//  and Node drains the ENTIRE microtask queue — including 'w-2' and the
//  `.then` on the async function's own promise, 'w-done' — before going
//  back for ticks. So a nextTick queued during an await continuation is
//  not "next", it is after everything else already in flight. Wrong turn:
//  reading `process.nextTick` as "before the next microtask".

import { test, eq, ok } from '../../_lib/check.js';

// ── snippet 1 ────────────────────────────────────────────────────────────
//
//      async function run() {
//        log('fn-start');
//        await null;
//        log('after-await-1');
//        await null;
//        log('after-await-2');
//      }
//      run();
//      Promise.resolve()
//        .then(() => log('then-1'))
//        .then(() => log('then-2'));
//      process.nextTick(() => log('tick'));
//      setImmediate(() => log('immediate'));
//      log('sync');
//
export function capture1() {
  return anchored(8, (log) => {
    async function run() {
      log('fn-start');
      await null;
      log('after-await-1');
      await null;
      log('after-await-2');
    }
    run();
    Promise.resolve()
      .then(() => log('then-1'))
      .then(() => log('then-2'));
    process.nextTick(() => log('tick'));
    setImmediate(() => log('immediate'));
    log('sync');
  });
}

// ── snippet 2 ────────────────────────────────────────────────────────────
//
//      const wait = (ms, tag) =>
//        new Promise((resolve) => {
//          setTimeout(() => {
//            log(`timer:${tag}`);
//            resolve(tag);
//          }, ms);
//        });
//
//      (async () => {
//        log('start');
//        const a = await wait(10, 'a');
//        log(`got:${a}`);
//        setImmediate(() => log('after-a:immediate'));
//        process.nextTick(() => log('after-a:tick'));
//        const b = await wait(0, 'b');
//        log(`got:${b}`);
//      })();
//      log('sync');
//
export function capture2() {
  return anchored(8, (log) => {
    const wait = (ms, tag) =>
      new Promise((resolve) => {
        setTimeout(() => {
          log(`timer:${tag}`);
          resolve(tag);
        }, ms);
      });

    (async () => {
      log('start');
      const a = await wait(10, 'a');
      log(`got:${a}`);
      setImmediate(() => log('after-a:immediate'));
      process.nextTick(() => log('after-a:tick'));
      const b = await wait(0, 'b');
      log(`got:${b}`);
    })();
    log('sync');
  });
}

// ── snippet 3 ────────────────────────────────────────────────────────────
//
//      async function work() {
//        log('w-sync');
//        await Promise.resolve();
//        log('w-1');
//        process.nextTick(() => log('w-tick'));
//        await Promise.resolve();
//        log('w-2');
//      }
//      work().then(() => log('w-done'));
//      queueMicrotask(() => log('micro'));
//      process.nextTick(() => log('tick'));
//      setImmediate(() => log('immediate'));
//      log('sync');
//
export function capture3() {
  return anchored(9, (log) => {
    async function work() {
      log('w-sync');
      await Promise.resolve();
      log('w-1');
      process.nextTick(() => log('w-tick'));
      await Promise.resolve();
      log('w-2');
    }
    work().then(() => log('w-done'));
    queueMicrotask(() => log('micro'));
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
  'fn-start',
  'sync',
  'tick',
  'after-await-1',
  'then-1',
  'after-await-2',
  'then-2',
  'immediate',
];

export const answer2 = [
  'start',
  'sync',
  'timer:a',
  'got:a',
  'after-a:tick',
  'after-a:immediate',
  'timer:b',
  'got:b',
];

export const answer3 = [
  'w-sync',
  'sync',
  'tick',
  'w-1',
  'micro',
  'w-2',
  'w-done',
  'w-tick',
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
