// ─────────────────────────────────────────────────────────────────────────
//  19 · debounce                                           ★★★ stretch
//  concepts: closures · timers
//  run: node 19-debounce.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A search box fires on every keystroke; you only want to hit the server
//  once the typing stops. debounce(fn, ms) returns a wrapper that delays
//  fn until `ms` have passed with no new call — and every new call
//  restarts the clock. When it finally fires, it uses the arguments of
//  the LAST call.
//
//      const save = debounce(write, 20);
//      save('a'); save('ab'); save('abc');
//      …20ms later → write('abc')   once, not three times
//
//  hint: setTimeout returns an id and clearTimeout(id) cancels it — keep
//  that id in the closure

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function debounce(fn, ms) {
  throw new Error('TODO');
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
