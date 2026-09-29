// ─────────────────────────────────────────────────────────────────────────
//  20 · throttle                                           ★★★ stretch
//  concepts: closures · timers · rate limiting
//  run: node 20-throttle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Debounce waits for silence; throttle keeps a steady drip. throttle(fn,
//  ms) runs fn IMMEDIATELY on the first call, then ignores every call
//  until `ms` have passed — the shape you want for scroll handlers and
//  "save while dragging".
//
//      const ping = throttle(send, 30);
//      ping('a');   → send('a') right now
//      ping('b');   → dropped (too soon)
//      …30ms later…
//      ping('c');   → send('c')
//
//  Dropped calls are simply lost — no trailing catch-up call.
//
//  hint: remember the timestamp of the last accepted call and compare it
//  with Date.now(); no setTimeout needed

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function throttle(fn, ms) {
  throw new Error('TODO');
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
