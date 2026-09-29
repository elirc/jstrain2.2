// ─────────────────────────────────────────────────────────────────────────
//  40 · a tiny store — SOLUTION                            ★★☆ core
//  run: node 40-tiny-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `state` and `listeners` live in the factory call, and the
//  three returned methods are three closures over them — no `this`, no
//  class, nothing a caller can reach except through the API.
//  Three details separate a toy from a usable store. Merging with
//  `{ ...state, ...patch }` replaces the binding rather than mutating the
//  object, so listeners that captured the previous snapshot still see the
//  old one — the immutability that makes change detection cheap. Returning
//  `{ ...state }` from `get` means a caller's stray mutation cannot corrupt
//  you. And iterating `[...listeners]` protects the loop against the very
//  common "unsubscribe on first event" listener, which otherwise mutates
//  the list you are walking and skips whoever comes next.
//  A Set makes unsubscribing idempotent for free; with an array you would
//  `indexOf` and `splice`, and calling `off()` twice could then remove an
//  innocent bystander that shifted into the old index.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();
  const snapshot = () => ({ ...state });

  return {
    get: snapshot,
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of [...listeners]) listener(snapshot());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
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
