// ─────────────────────────────────────────────────────────────────────────
//  10 · once                                               ★★☆ core
//  concepts: closures · guards · spies
//  run: node 10-once.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Wrap a function so it can only ever run one time — the classic guard
//  for "initialise the connection", "charge the card", "show the intro".
//  Every later call is a no-op that hands back the first result.
//
//      const init = once(connect);
//      init('db')   → 'connected to db'   (connect ran)
//      init('db')   → 'connected to db'   (connect did NOT run again)
//
//  hint: track "did I already run?" in its own variable — do not infer it
//  from the cached result, because the first result may be undefined

import { test, eq, ok, spy } from '../../_lib/check.js';

export function once(fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function', () => {
  const guarded = once(() => 1);
  ok(typeof guarded === 'function');
});

test('runs the wrapped function on the first call only', () => {
  const fn = spy(() => 'ok');
  const guarded = once(fn);
  guarded();
  guarded();
  guarded();
  eq(fn.callCount, 1);
});

test('hands back the first result every time', () => {
  let n = 0;
  const guarded = once(() => (n += 1));
  eq(guarded(), 1);
  eq(guarded(), 1);
  eq(guarded(), 1);
});

test('forwards the first call arguments', () => {
  const fn = spy((host, port) => `${host}:${port}`);
  const guarded = once(fn);
  eq(guarded('db', 5432), 'db:5432');
  eq(fn.calls, [['db', 5432]]);
});

test('ignores the arguments of later calls', () => {
  const fn = spy((label) => label);
  const guarded = once(fn);
  eq(guarded('first'), 'first');
  eq(guarded('second'), 'first');
  eq(fn.callCount, 1);
});

test('caches an undefined result instead of re-running', () => {
  const fn = spy(() => undefined);
  const guarded = once(fn);
  eq(guarded(), undefined);
  eq(guarded(), undefined);
  eq(fn.callCount, 1);
});

test('each wrapper has its own state', () => {
  const fn = spy((x) => x);
  const a = once(fn);
  const b = once(fn);
  eq(a('a'), 'a');
  eq(b('b'), 'b');
  eq(a('again'), 'a');
  eq(fn.callCount, 2);
});
