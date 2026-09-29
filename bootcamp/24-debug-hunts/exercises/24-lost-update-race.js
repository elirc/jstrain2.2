// ─────────────────────────────────────────────────────────────────────────
//  24 · the view counter that loses views                   ★★★ stretch
//  concepts: async · read-modify-write · lost update
//  run: node 24-lost-update-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  recordView(store, postId) bumps a post's view counter by one and
//  returns the new total. Every call must count:
//
//      ten calls on one post → the stored total is 10
//
//  The counter looked right in every manual test and drifted low in
//  production — badly on popular posts, never on quiet ones, and always
//  DOWN. Nobody could reproduce it locally, where they clicked once.
//
//  The store is given. Read its API before you read the bug: `get` and
//  `set` are two separate round-trips, and `add` applies a delta
//  without giving the store's turn away in between.
//
//  Two tests are red. The fix is one line. Do not add a queue, a lock,
//  or a retry.
//
//  hint: write out the interleaving for two calls that both start
//  before either finishes. What number does each of them read, and what
//  number does each of them then write?

import { test, eq, ok } from '../../_lib/check.js';

// ─── the store: every call is a round-trip, like a real database ─────────

const makeStore = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  const roundTrip = () => new Promise((resolve) => setTimeout(resolve, 1));
  return {
    async get(key) {
      await roundTrip();
      return data.get(key) ?? 0;
    },
    async set(key, value) {
      await roundTrip();
      data.set(key, value);
    },
    // one round-trip, and the read-add-write inside it is uninterrupted
    async add(key, delta) {
      await roundTrip();
      const next = (data.get(key) ?? 0) + delta;
      data.set(key, next);
      return next;
    },
    peek(key) {
      return data.get(key) ?? 0;
    },
  };
};

export async function recordView(store, postId) {
  const current = await store.get(postId);
  await store.set(postId, current + 1);
  return current + 1;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one view counts one', async () => {
  const store = makeStore();
  eq(await recordView(store, 'p1'), 1);
  eq(store.peek('p1'), 1);
});

test('views one after another accumulate', async () => {
  const store = makeStore({ p1: 5 });
  await recordView(store, 'p1');
  await recordView(store, 'p1');
  eq(store.peek('p1'), 7);
});

test('ten simultaneous views all count', async () => {
  const store = makeStore();
  await Promise.all(
    Array.from({ length: 10 }, () => recordView(store, 'p1'))
  );
  eq(store.peek('p1'), 10);
});

test('each caller is told a different total', async () => {
  const store = makeStore();
  const totals = await Promise.all(
    Array.from({ length: 10 }, () => recordView(store, 'p1'))
  );
  eq(new Set(totals).size, 10, 'two callers were handed the same total');
  ok(Math.max(...totals) === store.peek('p1'));
});

test('simultaneous views on different posts do not interfere', async () => {
  const store = makeStore();
  await Promise.all([recordView(store, 'p1'), recordView(store, 'p2')]);
  eq([store.peek('p1'), store.peek('p2')], [1, 1]);
});
