// ─────────────────────────────────────────────────────────────────────────
//  02 · reactive store — SOLUTION                           ★★★ capstone
//  concepts: closures · immutability · Object.is · scheduling
//  time: 40–50 min · 4 stages · 24 tests
//  run: node 02-reactive-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. A store is three closures over two variables: `state`
//  (the current object) and `listeners` (a Set). Everything else is
//  policy — when do we replace `state`, and when do we tell anyone. The
//  whole file has exactly one write path (`set`) and exactly one notify
//  path (`flush`), which is why batching later costs four lines.
//
//  Stage 1 — the core loop. `set` builds `{ ...state, ...patch }` instead
//  of assigning into `state`. Immutable replacement is what makes
//  `prev !== next` a reliable "did this change" signal — and it is why
//  React's `useSyncExternalStore` and Redux both insist on it.
//
//  Stage 2 — silence is a feature. A store that notifies on every write
//  re-renders the world on every keystroke. So: build the candidate next
//  state, shallow-compare it against the current one, and if nothing moved,
//  throw the candidate away and keep the OLD object. Note "shallow":
//  `{user:{name:'ada'}}` and a fresh `{name:'ada'}` are different objects,
//  so that IS a change. Identity, not deep equality — deep-comparing every
//  write is how stores get slow.
//
//  Stage 3 — computed. A derived value is just a subscriber that keeps a
//  cache and forwards only when its cached value moved. `get()` recomputes
//  from the live state so it can never go stale; the cache exists purely
//  to answer "should I notify?". This is the memoized-selector pattern
//  (reselect, Zustand's `subscribeWithSelector`).
//
//  Stage 4 ★ — batching. Two module-level variables: a depth counter and a
//  Set of pending flush functions. `set` calls `schedule(flush)` instead of
//  `flush()`; when the depth is 0 that runs immediately, otherwise it drops
//  the flush into the Set — where duplicates collapse for free. The
//  outermost `batch` drains the Set in a `finally`, so a throwing callback
//  cannot leave the depth counter stuck above 0 and wedge the store
//  forever. The `lastSeen` variable makes flush idempotent: a second flush
//  with no further writes is a no-op, so nothing double-fires.
//
//  Classic wrong turn: making `set` notify and having batch collect the
//  notifications. Then the LAST write wins and the intermediate states get
//  delivered anyway. Defer the flush, not the payload.

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 4 — the scheduler's whole state.
let batchDepth = 0;
const pendingFlushes = new Set();

function schedule(flush) {
  if (batchDepth > 0) pendingFlushes.add(flush);
  else flush();
}

// stage 2 — same keys, and every value identical by Object.is.
export function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
}

// stage 1 — returns { get, set, subscribe }.
export function createStore(initial) {
  let state = initial;
  let lastSeen = initial; // the state subscribers were last told about
  const listeners = new Set();

  // stage 4 — idempotent on purpose: flushing twice notifies once.
  const flush = () => {
    if (Object.is(state, lastSeen)) return;
    const prev = lastSeen;
    lastSeen = state;
    for (const listener of [...listeners]) listener(state, prev);
  };

  return {
    get: () => state,

    set(patchOrFn) {
      const patch =
        typeof patchOrFn === 'function' ? patchOrFn(state) : patchOrFn;
      if (!patch) return;
      const next = { ...state, ...patch };
      if (shallowEqual(next, state)) return; // stage 2: nothing moved
      state = next;
      schedule(flush); // stage 1 flushes now, stage 4 may defer
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// stage 3 — a subscriber with a cache, exposing the same tiny interface.
export function computed(store, selector) {
  let cached = selector(store.get());
  const listeners = new Set();

  store.subscribe((state) => {
    const next = selector(state);
    if (Object.is(next, cached)) return; // the store moved, we did not
    const prev = cached;
    cached = next;
    for (const listener of [...listeners]) listener(next, prev);
  });

  return {
    get: () => selector(store.get()),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// stage 4 — hold the flushes, then drain them exactly once.
export function batch(fn) {
  batchDepth += 1;
  try {
    return fn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) {
      const queue = [...pendingFlushes];
      pendingFlushes.clear();
      for (const flush of queue) flush();
    }
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: get / set / subscribe ───────────────────────────────────────

test('get returns the initial state', () => {
  const store = createStore({ n: 0 });
  eq(store.get(), { n: 0 });
});

test('set shallow-merges a partial patch', () => {
  const store = createStore({ n: 0, name: 'ada' });
  store.set({ n: 7 });
  eq(store.get(), { n: 7, name: 'ada' });
});

test('set replaces the state object instead of mutating it', () => {
  const initial = { n: 0 };
  const store = createStore(initial);
  store.set({ n: 1 });
  eq(initial, { n: 0 });
  ok(store.get() !== initial);
});

test('subscribers are called with the next and previous state', () => {
  const store = createStore({ n: 0 });
  const seen = [];
  store.subscribe((next, prev) => seen.push([next.n, prev.n]));
  store.set({ n: 1 });
  store.set({ n: 2 });
  eq(seen, [
    [1, 0],
    [2, 1],
  ]);
});

test('subscribe returns a working unsubscribe function', () => {
  const store = createStore({ n: 0 });
  let calls = 0;
  const stop = store.subscribe(() => (calls += 1));
  store.set({ n: 1 });
  stop();
  store.set({ n: 2 });
  eq(calls, 1);
});

test('every subscriber hears about a change', () => {
  const store = createStore({ n: 0 });
  const seen = [];
  store.subscribe(() => seen.push('a'));
  store.subscribe(() => seen.push('b'));
  store.set({ n: 1 });
  eq(seen, ['a', 'b']);
});

// ── stage 2: updater functions and silent no-op writes ───────────────────

test('set accepts an updater function of the current state', () => {
  const store = createStore({ n: 1 });
  store.set((s) => ({ n: s.n + 1 }));
  store.set((s) => ({ n: s.n + 1 }));
  eq(store.get(), { n: 3 });
});

test('the updater sees every other key too', () => {
  const store = createStore({ first: 'Ada', last: 'Lovelace' });
  store.set((s) => ({ full: `${s.first} ${s.last}` }));
  eq(store.get().full, 'Ada Lovelace');
});

test('shallowEqual compares one level deep with Object.is', () => {
  eq(shallowEqual({ a: 1 }, { a: 1 }), true);
  eq(shallowEqual({ a: 1 }, { a: 2 }), false);
  eq(shallowEqual({ a: 1 }, { a: 1, b: 2 }), false);
  eq(shallowEqual({ a: {} }, { a: {} }), false);
});

test('writing the value a key already has notifies nobody', () => {
  const store = createStore({ n: 0, name: 'ada' });
  let calls = 0;
  store.subscribe(() => (calls += 1));
  store.set({ n: 0 });
  store.set({ name: 'ada' });
  store.set((s) => ({ n: s.n }));
  eq(calls, 0);
});

test('a no-op write keeps the very same state object', () => {
  const store = createStore({ n: 0 });
  const before = store.get();
  store.set({ n: 0 });
  ok(store.get() === before);
});

test('an equal-looking new object still counts as a change', () => {
  const store = createStore({ user: { name: 'ada' } });
  let calls = 0;
  store.subscribe(() => (calls += 1));
  store.set({ user: { name: 'ada' } });
  eq(calls, 1);
});

// ── stage 3: computed values ─────────────────────────────────────────────

test('computed derives a value from the current state', () => {
  const store = createStore({ items: [1, 2, 3] });
  const count = computed(store, (s) => s.items.length);
  eq(count.get(), 3);
});

test('computed is up to date after the store changes', () => {
  const store = createStore({ items: [1, 2, 3] });
  const count = computed(store, (s) => s.items.length);
  store.set({ items: [1] });
  eq(count.get(), 1);
});

test('computed notifies subscribers with the new and old value', () => {
  const store = createStore({ n: 1 });
  const doubled = computed(store, (s) => s.n * 2);
  const seen = [];
  doubled.subscribe((next, prev) => seen.push([next, prev]));
  store.set({ n: 5 });
  eq(seen, [[10, 2]]);
});

test('computed stays quiet when its own value did not change', () => {
  const store = createStore({ n: 1, unrelated: 'a' });
  const doubled = computed(store, (s) => s.n * 2);
  let calls = 0;
  doubled.subscribe(() => (calls += 1));
  store.set({ unrelated: 'b' });
  store.set({ unrelated: 'c' });
  eq(calls, 0);
  eq(doubled.get(), 2);
});

test('unsubscribing from a computed stops the notifications', () => {
  const store = createStore({ n: 1 });
  const doubled = computed(store, (s) => s.n * 2);
  let calls = 0;
  const stop = doubled.subscribe(() => (calls += 1));
  store.set({ n: 2 });
  stop();
  store.set({ n: 3 });
  eq(calls, 1);
});

// ── stage 4: batching ★ ──────────────────────────────────────────────────

test('batch turns several writes into one notification', () => {
  const store = createStore({ a: 0, b: 0 });
  let calls = 0;
  store.subscribe(() => (calls += 1));
  batch(() => {
    store.set({ a: 1 });
    store.set({ b: 2 });
    store.set({ a: 3 });
  });
  eq(calls, 1);
});

test('the one notification carries the final state', () => {
  const store = createStore({ a: 0, b: 0 });
  const seen = [];
  store.subscribe((next, prev) => seen.push([next, prev]));
  batch(() => {
    store.set({ a: 1 });
    store.set({ b: 2 });
  });
  eq(seen, [[{ a: 1, b: 2 }, { a: 0, b: 0 }]]);
});

test('reads inside a batch see the writes immediately', () => {
  const store = createStore({ n: 0 });
  const inside = [];
  batch(() => {
    store.set({ n: 1 });
    inside.push(store.get().n);
    store.set((s) => ({ n: s.n + 1 }));
    inside.push(store.get().n);
  });
  eq(inside, [1, 2]);
  eq(store.get().n, 2);
});

test('batch returns whatever its callback returned', () => {
  const store = createStore({ n: 0 });
  const out = batch(() => {
    store.set({ n: 1 });
    return 'done';
  });
  eq(out, 'done');
});

test('a batch that changes nothing notifies nobody', () => {
  const store = createStore({ n: 0 });
  let calls = 0;
  store.subscribe(() => (calls += 1));
  batch(() => {
    store.set({ n: 0 });
  });
  eq(calls, 0);
});

test('nested batches flush only when the outermost one exits', () => {
  const store = createStore({ n: 0 });
  let calls = 0;
  store.subscribe(() => (calls += 1));
  batch(() => {
    store.set({ n: 1 });
    batch(() => {
      store.set({ n: 2 });
    });
    eq(calls, 0);
  });
  eq(calls, 1);
  eq(store.get().n, 2);
});

test('a batch that throws still flushes the writes it made', () => {
  const store = createStore({ n: 0 });
  const seen = [];
  store.subscribe((next) => seen.push(next.n));
  throws(() => {
    batch(() => {
      store.set({ n: 1 });
      throw new Error('boom');
    });
  }, 'boom');
  eq(seen, [1]);
  batch(() => store.set({ n: 2 }));
  eq(seen, [1, 2]);
});
