// ─────────────────────────────────────────────────────────────────────────
//  03 · lane gauntlet · await in the mix                     ★★★ stretch
//  concepts: async functions as microtasks · await resumption · timers
//  run: node 03-lane-gauntlet-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The boss of the three. Same rules — predict, then fill in — but now
//  async functions are in the mix, and one snippet resolves its promise
//  from inside a timer callback.
//
//  Two things decide these: an async function body runs synchronously up
//  to its first `await`, and what happens after an `await` is a
//  microtask like any other.
//
//      answer1 → eight strings
//      answer2 → eight strings
//      answer3 → nine strings

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
