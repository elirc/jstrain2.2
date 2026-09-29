// ─────────────────────────────────────────────────────────────────────────
//  12 · cold rebuild · debounce + throttle — SOLUTION      ★★★ stretch
//  run: node 12-rebuild-debounce-throttle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both are one closure variable and a decision.
//
//  debounce remembers a TIMER ID. Every call clears the pending timer and
//  starts a new one, so only a call followed by `ms` of silence survives.
//  Capture `...args` in the closure the timer callback reads, and the
//  "last args win" rule falls out for free. Two classic wrong turns:
//  forgetting `clearTimeout` (every keystroke fires, just late), and
//  using a plain `function` for the callback so `this` is lost — an arrow
//  keeps whatever `this` the wrapper was called with.
//
//  throttle remembers a TIMESTAMP. Compare `Date.now()` with the last
//  accepted call; if the gap is big enough, run and re-stamp, otherwise
//  drop. No timer is needed at all for the leading-edge version, which is
//  the tell that debounce and throttle are different shapes, not
//  variations. Seeding `lastRun = 0` (not `Date.now()`) is what lets the
//  very first call through.
//
//  Both wrappers return undefined: the result arrives later, or never.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function debounce(fn, ms) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, ms);
  };
}

export function throttle(fn, ms) {
  let lastRun = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastRun >= ms) {
      lastRun = now;
      fn.apply(this, args);
    }
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('debounce · nothing runs during the burst', () => {
  const write = spy();
  const save = debounce(write, 15);
  save('a');
  save('ab');
  eq(write.callCount, 0);
  eq(save('abc'), undefined, 'the wrapper answers later, not now');
});

test('debounce · one call lands after the quiet period, last args win', async () => {
  const write = spy();
  const save = debounce(write, 15);
  save('a');
  save('ab');
  save('abc');
  await sleep(35);
  eq(write.callCount, 1);
  eq(write.calls, [['abc']]);
});

test('debounce · a fresh burst after the first fire runs again', async () => {
  const write = spy();
  const save = debounce(write, 15);
  save('a');
  save('b');
  await sleep(35);
  save('c');
  await sleep(35);
  eq(write.calls, [['b'], ['c']]);
});

test('debounce · two wrappers keep separate timers', async () => {
  const first = spy();
  const second = spy();
  const a = debounce(first, 15);
  const b = debounce(second, 15);
  a('x');
  b('y');
  a('z');
  await sleep(35);
  eq(first.calls, [['z']]);
  eq(second.calls, [['y']]);
});

test('throttle · the first call goes straight through', () => {
  const send = spy();
  const ping = throttle(send, 20);
  ping('a', 1);
  eq(send.callCount, 1);
  eq(send.calls, [['a', 1]], 'every argument is forwarded');
});

test('throttle · calls inside the window are dropped, not queued', async () => {
  const send = spy();
  const ping = throttle(send, 20);
  ping('a');
  ping('b');
  ping('c');
  eq(send.callCount, 1);
  await sleep(30);
  eq(send.callCount, 1, 'a dropped call never fires late');
});

test('throttle · the window reopens after the interval', async () => {
  const send = spy();
  const ping = throttle(send, 20);
  ping('a');
  ping('b');
  await sleep(30);
  ping('c');
  eq(send.calls, [['a'], ['c']]);
});

test('throttle · two wrappers do not share a window', () => {
  const scroll = spy();
  const drag = spy();
  const onScroll = throttle(scroll, 20);
  const onDrag = throttle(drag, 20);
  onScroll('s');
  onDrag('d');
  onScroll('s2');
  eq(scroll.calls, [['s']]);
  eq(drag.calls, [['d']]);
  ok(typeof onScroll === 'function' && typeof onDrag === 'function');
});
