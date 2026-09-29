// ─────────────────────────────────────────────────────────────────────────
//  07 · createWatchable — SOLUTION                          ★☆☆ warm-up
//  concepts: observer · state container · change detection
//  run: node solutions/07-watchable-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — wrap one value so reads go through `get` and writes can be
//  announced. Observer again, narrowed to a single subject.
//  The change guard (`Object.is`) is the part juniors skip, and it is
//  the reason a UI does not repaint on every keystroke that changed
//  nothing. `Object.is` beats `===` on the two weird values: it says
//  NaN equals NaN, and -0 does not equal 0.
//  When NOT to use: this only detects *reference* change. `set` with a
//  mutated array you already held will look identical — for objects you
//  need immutable updates (`set([...items, x])`), which is exactly the
//  rule Redux and React state enforce.
//  In the wild: Svelte stores, Vue `ref`, Zustand, `useSyncExternalStore`.

import { test, eq, spy } from '../../_lib/check.js';

export function createWatchable(initial) {
  let value = initial;
  const watchers = new Set();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      const prev = value;
      value = next;
      for (const watcher of [...watchers]) watcher(next, prev);
    },
    watch(fn) {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
  };
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
