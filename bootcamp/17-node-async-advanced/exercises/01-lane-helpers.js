// ─────────────────────────────────────────────────────────────────────────
//  01 · defer to a lane                                     ★☆☆ warm-up
//  concepts: process.nextTick · queueMicrotask · setImmediate · setTimeout
//  run: node 01-lane-helpers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Node has four "run this later" buttons and they do NOT mean the same
//  thing. Build one function that presses whichever one you name:
//
//      defer('tick', fn)       → process.nextTick(fn)
//      defer('micro', fn)      → queueMicrotask(fn)
//      defer('immediate', fn)  → setImmediate(fn)      (libuv check phase)
//      defer('timeout', fn)    → setTimeout(fn, 0)     (libuv timers phase)
//      defer('later', fn)      → throws Error('unknown lane: later')
//
//  Nothing runs synchronously: defer returns before fn is ever called.
//
//  hint: a lookup object of lane → scheduler function beats a switch, and
//  wrap each scheduler in an arrow so it keeps its own receiver

import { test, eq, ok, throws, spy, sleep } from '../../_lib/check.js';

export function defer(lane, fn) {
  throw new Error('TODO');
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
