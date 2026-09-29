// ─────────────────────────────────────────────────────────────────────────
//  12 · cold rebuild · debounce + throttle                 ★★★ stretch
//  concepts: from memory
//  run: node 12-rebuild-debounce-throttle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You built these before — rebuild without looking; then diff against
//  your module-02 solutions (19-debounce, 20-throttle).
//
//    debounce(fn, ms)  waits for ms of silence, then calls fn ONCE with
//                      the arguments of the LAST call. Every new call
//                      restarts the clock. The wrapper returns undefined.
//
//    throttle(fn, ms)  calls fn immediately, then drops every call until
//                      ms have passed. No trailing catch-up call; a
//                      dropped call is simply lost.

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function debounce(fn, ms) {
  throw new Error('TODO');
}

export function throttle(fn, ms) {
  throw new Error('TODO');
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
