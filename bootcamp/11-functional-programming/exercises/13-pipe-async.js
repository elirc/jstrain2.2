// ─────────────────────────────────────────────────────────────────────────
//  13 · pipeAsync                                           ★★★ stretch
//  concepts: composition · promises · error short-circuiting
//  run: node 13-pipe-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `pipe` breaks the moment a step returns a promise: the next step gets
//  a Promise object instead of a value. Build the async version — it
//  awaits between steps and stops dead at the first failure.
//
//      const load = pipeAsync(fetchUser, addOrders, toDto);
//      await load(7)                    → the finished DTO
//
//      await pipeAsync(a, boom, c)(1)   → rejects with boom's error,
//                                         and c is NEVER called
//
//  Same rules as pipe: left to right, the first function receives every
//  argument, and no functions at all means the input comes back. Plain
//  synchronous functions must still work as steps.
//
//  hint: an `async` function returns a promise no matter what is inside
//  it, and `await` on a non-promise just gives you the value back.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export function pipeAsync(...fns) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('threads a value through async steps', async () => {
  const run = pipeAsync(
    async (n) => n + 1,
    async (n) => n * 10
  );
  eq(await run(1), 20);
});

test('plain synchronous steps work too', async () => {
  const run = pipeAsync((n) => n + 1, async (n) => n * 2, String);
  eq(await run(4), '10');
});

test('the first step receives every argument', async () => {
  const run = pipeAsync(async (a, b) => a + b, (n) => n * 2);
  eq(await run(2, 3), 10);
});

test('steps run one after another, not at the same time', async () => {
  const log = [];
  const step = (tag, ms) => async (text) => {
    await sleep(ms);
    log.push(tag);
    return text + tag;
  };
  const run = pipeAsync(step('a', 20), step('b', 1));
  eq(await run(''), 'ab');
  eq(log, ['a', 'b'], 'a must finish before b starts');
});

test('rejects with the error thrown by the failing step', async () => {
  const run = pipeAsync(
    async (n) => n,
    async () => {
      throw new Error('step two blew up');
    }
  );
  await rejects(() => run(1), 'step two blew up');
});

test('the steps after a failure never run', async () => {
  const reached = [];
  const run = pipeAsync(
    async () => {
      throw new Error('nope');
    },
    async (n) => {
      reached.push(n);
      return n;
    }
  );
  await rejects(() => run(1));
  eq(reached, []);
});

test('with no steps the input comes back', async () => {
  eq(await pipeAsync()('untouched'), 'untouched');
});

test('the pipeline can be run more than once', async () => {
  const run = pipeAsync(async (n) => n * 2);
  eq(await run(2), 4);
  eq(await run(3), 6);
  ok(typeof run === 'function');
});
