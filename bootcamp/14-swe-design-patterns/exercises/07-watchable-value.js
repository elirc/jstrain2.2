// ─────────────────────────────────────────────────────────────────────────
//  07 · createWatchable                                     ★☆☆ warm-up
//  concepts: observer · state container · change detection
//  run: node exercises/07-watchable-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A tiny store: one value, and anybody can ask to be told when it
//  changes. This is the whole idea behind every state library you have
//  ever used.
//
//      const theme = createWatchable('light');
//      const stop = theme.watch((next, prev) => ...);
//      theme.get()          → 'light'
//      theme.set('dark')    → watchers called with ('dark', 'light')
//      theme.set('dark')    → nobody is called: nothing changed
//      stop()               → that watcher is done
//
//  hint: `Object.is(next, current)` is the change check — it treats
//  NaN as equal to NaN, which `===` does not

import { test, eq, spy } from '../../_lib/check.js';

export function createWatchable(initial) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('get returns the initial value', () => {
  eq(createWatchable('light').get(), 'light');
});

test('set replaces the value', () => {
  const theme = createWatchable('light');
  theme.set('dark');
  eq(theme.get(), 'dark');
});

test('watchers are called with next and previous', () => {
  const theme = createWatchable('light');
  const seen = spy();
  theme.watch(seen);
  theme.set('dark');
  eq(seen.calls, [['dark', 'light']]);
});

test('every watcher hears the change', () => {
  const count = createWatchable(0);
  const a = spy();
  const b = spy();
  count.watch(a);
  count.watch(b);
  count.set(1);
  count.set(2);
  eq(a.callCount, 2);
  eq(b.calls, [[1, 0], [2, 1]]);
});

test('setting the same value notifies nobody', () => {
  const count = createWatchable(0);
  const seen = spy();
  count.watch(seen);
  count.set(0);
  count.set(NaN);
  count.set(NaN);
  eq(seen.callCount, 1);
});

test('the function returned by watch stops that watcher only', () => {
  const count = createWatchable(0);
  const stopped = spy();
  const kept = spy();
  const stop = count.watch(stopped);
  count.watch(kept);
  stop();
  count.set(1);
  eq(stopped.callCount, 0);
  eq(kept.callCount, 1);
});
