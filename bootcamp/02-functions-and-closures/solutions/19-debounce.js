// ─────────────────────────────────────────────────────────────────────────
//  19 · debounce — SOLUTION                                ★★★ stretch
//  run: node 19-debounce.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the closure holds one timer id. Every call cancels the
//  pending timer and books a new one, so only the last call in a burst
//  survives — and because the arguments are captured by the arrow passed
//  to setTimeout, the surviving call carries the latest arguments.
//  Two classic wrong turns: forgetting clearTimeout (you get N calls
//  instead of one), and keeping the id outside the factory (all
//  debounced functions then fight over one timer). The wrapper cannot
//  return fn's value — at call time there is nothing to return yet.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function debounce(fn, ms) {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, ms);
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function', () => {
  const debounced = debounce(() => {}, 20);
  ok(typeof debounced === 'function');
});

test('does not call the function immediately', () => {
  const write = spy();
  const debounced = debounce(write, 20);
  debounced('a');
  debounced('b');
  eq(write.callCount, 0);
});

test('the wrapper returns undefined — the result comes later', () => {
  const write = spy(() => 'saved');
  const debounced = debounce(write, 20);
  eq(debounced('a'), undefined);
});

test('runs once after the quiet period with the last args', async () => {
  const write = spy();
  const debounced = debounce(write, 20);
  debounced('a');
  debounced('ab');
  debounced('abc');
  await sleep(60);
  eq(write.callCount, 1);
  eq(write.calls, [['abc']]);
});

test('every call restarts the clock', async () => {
  const write = spy();
  const debounced = debounce(write, 20);
  debounced(1);
  await sleep(10);
  debounced(2);
  await sleep(10);
  debounced(3);
  eq(write.callCount, 0);
  await sleep(60);
  eq(write.callCount, 1);
  eq(write.calls, [[3]]);
});

test('a new burst after the quiet period fires again', async () => {
  const write = spy();
  const debounced = debounce(write, 20);
  debounced('first');
  await sleep(60);
  debounced('second');
  await sleep(60);
  eq(write.callCount, 2);
  eq(write.calls, [['first'], ['second']]);
});
