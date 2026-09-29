// ─────────────────────────────────────────────────────────────────────────
//  01 · defer to a lane — SOLUTION                          ★☆☆ warm-up
//  run: node 01-lane-helpers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a lookup object turns "which lane?" into data instead of
//  control flow, so adding a lane is one line and an unknown lane is one
//  check. Each entry is wrapped in an arrow for two reasons: setTimeout
//  needs its 0 delay supplied, and passing a bare `process.nextTick`
//  around detaches it from `process`. The ordering test is the real
//  lesson: from inside a callback the nextTick queue drains first, then
//  the microtask queue, and only then does libuv reach the check phase
//  where setImmediate lives. Wrong turn: assuming 'micro' and 'tick' are
//  the same lane. They are two separate queues, and nextTick wins.

import { test, eq, ok, throws, spy, sleep } from '../../_lib/check.js';

export function defer(lane, fn) {
  const lanes = {
    tick: (cb) => process.nextTick(cb),
    micro: (cb) => queueMicrotask(cb),
    immediate: (cb) => setImmediate(cb),
    timeout: (cb) => setTimeout(cb, 0),
  };
  const schedule = lanes[lane];
  if (!schedule) throw new Error(`unknown lane: ${lane}`);
  schedule(fn);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('does not call the function synchronously', () => {
  const fn = spy();
  defer('tick', fn);
  eq(fn.callCount, 0);
});

test("the 'tick' lane runs the function", async () => {
  const fn = spy();
  defer('tick', fn);
  await sleep(20);
  eq(fn.callCount, 1);
});

test("the 'micro' lane runs the function", async () => {
  const fn = spy();
  defer('micro', fn);
  await sleep(20);
  eq(fn.callCount, 1);
});

test("the 'immediate' lane runs the function", async () => {
  const fn = spy();
  defer('immediate', fn);
  await sleep(20);
  eq(fn.callCount, 1);
});

test("the 'timeout' lane runs the function", async () => {
  const fn = spy();
  defer('timeout', fn);
  await sleep(20);
  eq(fn.callCount, 1);
});

test('an unknown lane throws instead of silently doing nothing', () => {
  throws(() => defer('later', () => {}), 'later');
});

test('from a callback: tick beats micro, and micro beats immediate', async () => {
  const order = await new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const seen = [];
        const note = (name) => () => {
          seen.push(name);
          if (seen.length === 3) resolve(seen);
        };
        defer('immediate', note('immediate'));
        defer('micro', note('micro'));
        defer('tick', note('tick'));
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
  eq(order, ['tick', 'micro', 'immediate']);
});

test('the lanes are independent — every one of them fires', async () => {
  const seen = [];
  for (const lane of ['timeout', 'immediate', 'micro', 'tick']) {
    defer(lane, () => seen.push(lane));
  }
  await sleep(30);
  ok(seen.length === 4, 'all four lanes should have run');
});
