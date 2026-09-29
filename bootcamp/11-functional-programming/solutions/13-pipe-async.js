// ─────────────────────────────────────────────────────────────────────────
//  13 · pipeAsync — SOLUTION                                ★★★ stretch
//  run: node 13-pipe-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: mark the returned function `async` and the whole thing
//  falls out. `await` accepts non-promises, so sync steps need no special
//  case, and the short-circuit is free: if a step rejects, its `await`
//  throws, the loop stops, and the async function turns that throw back
//  into a rejected promise carrying the ORIGINAL error.
//  A `for...of` loop is the right tool here even though `reduce` looks
//  tempting. `fns.reduce(async (acc, fn) => fn(await acc), input)` also
//  works, but it builds the whole promise chain up front and reads worse
//  under a debugger.
//  What this is NOT: Promise.all. Every step waits for the one before it,
//  because each needs the previous value. Use Promise.all when steps are
//  independent — that is a different shape of problem.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export function pipeAsync(...fns) {
  return async (...args) => {
    if (fns.length === 0) return args[0];
    const [first, ...rest] = fns;
    let value = await first(...args);
    for (const fn of rest) value = await fn(value);
    return value;
  };
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
