// ─────────────────────────────────────────────────────────────────────────
//  24 · the view counter that loses views — SOLUTION        ★★★ stretch
//  concepts: async · read-modify-write · lost update
//  run: node 24-lost-update-race.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: lost update — a read-modify-write split across an await.
//  `get` returns, the function yields, another call runs the same `get`
//  and reads the SAME number, and both then write that number plus one.
//  Two views, one increment. Ten simultaneous views on a hot post can
//  land as one, which is why the drift was always downward and always
//  worse under traffic.
//  The tell: `const x = await read(); await write(x + 1);`. Between
//  those two lines the value is stale and anyone may change it. Every
//  await is a place where the world moves on without you — a check you
//  made before it is a fact about the past.
//  The minimal fix: never carry the value through user space. Ask the
//  store to do the arithmetic in one uninterrupted step:
//      return store.add(postId, 1);
//  The SQL version of the same line is `UPDATE posts SET views =
//  views + 1 WHERE id = ?` — one statement, one round-trip, no window.
//  When the store has no atomic operation, the alternatives are a
//  compare-and-set retry loop (write only if the value is still what
//  you read) or a row lock; a JavaScript-side "lock" is not one of
//  them, because the next process gets its own copy of it.
//  Why the tests could not see it: every test awaited each call before
//  starting the next, so no two overlapped. Concurrency bugs need a
//  test that starts N calls before awaiting any — `Promise.all` over
//  the same key is the whole trick, and it is deterministic.
//  In the wild: counters, inventory decrements, "last updated by",
//  balance adjustments, JSON blobs read-modified-written in full, and
//  every optimistic-locking bug that ends with a version column being
//  added.

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
  return store.add(postId, 1);
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
