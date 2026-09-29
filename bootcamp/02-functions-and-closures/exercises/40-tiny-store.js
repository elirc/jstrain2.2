// ─────────────────────────────────────────────────────────────────────────
//  40 · a tiny store                                       ★★☆ core
//  concepts: closures · subscriptions · encapsulation
//  run: node 40-tiny-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Redux, Zustand, Svelte stores, the React `useSyncExternalStore` contract
//  — they are all the same forty lines you are about to write: state in a
//  closure, three methods over it.
//
//      const store = createStore({ user: 'ada', theme: 'dark' });
//      store.get()                    → { user: 'ada', theme: 'dark' }
//
//      const off = store.subscribe((state) => render(state));
//      store.set({ theme: 'light' })  // merges, then notifies every listener
//      store.get()                    → { user: 'ada', theme: 'light' }
//      off()                          // unsubscribed; no more notifications
//
//  Rules: `set` MERGES a patch into the state (it does not replace it) and
//  notifies every current listener with the new state. `subscribe` returns
//  its own unsubscribe function. `get` hands out a copy, so a caller
//  cannot reach in and edit the state behind your back.
//
//  hint: notify a COPY of the listener list — a listener that unsubscribes
//  itself during a notification would otherwise make the loop skip its
//  neighbour

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createStore(initialState = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('get reports the state it was created with', () => {
  const store = createStore({ user: 'ada', theme: 'dark' });
  eq(store.get(), { user: 'ada', theme: 'dark' });
  eq(createStore().get(), {});
});

test('set merges the patch instead of replacing the state', () => {
  const store = createStore({ user: 'ada', theme: 'dark' });
  store.set({ theme: 'light' });
  eq(store.get(), { user: 'ada', theme: 'light' });
});

test('every listener is notified with the new state', () => {
  const store = createStore({ n: 0 });
  const a = spy();
  const b = spy();
  store.subscribe(a);
  store.subscribe(b);
  store.set({ n: 1 });
  eq(a.calls, [[{ n: 1 }]]);
  eq(b.calls, [[{ n: 1 }]]);
});

test('subscribe hands back an unsubscribe function', () => {
  const store = createStore({ n: 0 });
  const listener = spy();
  const off = store.subscribe(listener);
  ok(typeof off === 'function');
  store.set({ n: 1 });
  off();
  store.set({ n: 2 });
  eq(listener.callCount, 1);
  eq(store.get(), { n: 2 }, 'the state still updates');
});

test('unsubscribing twice is harmless', () => {
  const store = createStore({ n: 0 });
  const kept = spy();
  const off = store.subscribe(() => {});
  store.subscribe(kept);
  off();
  off();
  store.set({ n: 1 });
  eq(kept.callCount, 1, 'the second off() must not drop another listener');
});

test('get hands out a copy of the state', () => {
  const store = createStore({ n: 0 });
  const snapshot = store.get();
  snapshot.n = 99;
  eq(store.get(), { n: 0 });
  ok(store.get() !== store.get(), 'a fresh object each time');
});

test('a listener may unsubscribe itself mid-notification', () => {
  const store = createStore({ n: 0 });
  const seen = [];
  const off = store.subscribe(() => {
    seen.push('a');
    off();
  });
  store.subscribe(() => seen.push('b'));
  store.set({ n: 1 });
  eq(seen, ['a', 'b'], 'b must not be skipped');
  store.set({ n: 2 });
  eq(seen, ['a', 'b', 'b']);
});

test('two stores share nothing', () => {
  const a = createStore({ n: 0 });
  const b = createStore({ n: 0 });
  const listener = spy();
  a.subscribe(listener);
  b.set({ n: 5 });
  eq(a.get(), { n: 0 });
  eq(listener.callCount, 0);
});
