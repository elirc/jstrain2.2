// ─────────────────────────────────────────────────────────────────────────
//  20 · throttle — SOLUTION                                ★★★ stretch
//  run: node 20-throttle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one captured number — the time of the last accepted call.
//  Starting it at 0 (or -Infinity) makes the very first call pass, since
//  Date.now() is astronomically larger. Everything else is one comparison.
//  Note what is NOT here: no timer, no queue, no trailing call. Real
//  libraries add a trailing option, but the leading-edge version above is
//  the one worth being able to write from memory. The classic wrong turn
//  is putting `lastRun` outside the factory, which makes every throttled
//  function in the program share one window.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function throttle(fn, ms) {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= ms) {
      lastRun = now;
      fn(...args);
    }
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function', () => {
  const throttled = throttle(() => {}, 30);
  ok(typeof throttled === 'function');
});

test('the first call goes through immediately', () => {
  const send = spy();
  const throttled = throttle(send, 30);
  throttled('a');
  eq(send.callCount, 1);
  eq(send.calls, [['a']]);
});

test('calls inside the window are dropped', () => {
  const send = spy();
  const throttled = throttle(send, 30);
  throttled('a');
  throttled('b');
  throttled('c');
  eq(send.callCount, 1);
  eq(send.calls, [['a']]);
});

test('forwards every argument of an accepted call', () => {
  const send = spy();
  const throttled = throttle(send, 30);
  throttled(1, 2, 3);
  eq(send.calls, [[1, 2, 3]]);
});

test('a call after the window goes through', async () => {
  const send = spy();
  const throttled = throttle(send, 30);
  throttled('a');
  await sleep(60);
  throttled('b');
  eq(send.callCount, 2);
  eq(send.calls, [['a'], ['b']]);
});

test('each new window drops the extra calls again', async () => {
  const send = spy();
  const throttled = throttle(send, 30);
  throttled('a');
  throttled('ignored');
  await sleep(60);
  throttled('b');
  throttled('ignored too');
  eq(send.callCount, 2);
  eq(send.calls, [['a'], ['b']]);
});

test('two throttled wrappers keep their own window', () => {
  const send = spy();
  const first = throttle(send, 30);
  const second = throttle(send, 30);
  first('a');
  second('b');
  first('dropped');
  eq(send.calls, [['a'], ['b']]);
});
