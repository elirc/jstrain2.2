// ─────────────────────────────────────────────────────────────────────────
//  02 · reactive store                                      ★★★ capstone
//  concepts: closures · immutability · Object.is · scheduling
//  time: 40–50 min · 4 stages · 24 tests
//  run: node 02-reactive-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  Redux, Zustand, Svelte stores, Pinia — all the same 40 lines: one piece
//  of state, a set of subscribers, and a rule for when to tell them. The
//  interesting part is never "store a value"; it is knowing when NOT to
//  notify, and how to make ten writes produce one render.
//
//  STAGES — do them in order, run the file after each one
//    1. get / set / subscribe ... the core loop
//    2. updaters + no-op writes . set(fn), and silence when nothing changed
//    3. computed ............... derived values that only fire on change
//    4. batch ★ ................ many writes → exactly one notification
//
//  THE SPEC
//
//      const store = createStore({ n: 0, user: null });
//      store.get()                     → { n: 0, user: null }
//      store.set({ n: 1 })             // shallow-merged patch
//      store.set((s) => ({ n: s.n + 1 }))   // updater form
//      const stop = store.subscribe((next, prev) => ...);   // stop() later
//
//    State is always a plain object and is replaced, never mutated:
//    `{ ...state, ...patch }`. If that produces a state shallow-equal to
//    the old one, keep the OLD object and tell nobody — a store that
//    notifies on every write makes every UI re-render forever.
//
//      const total = computed(store, (s) => s.items.length);
//      total.get()                     → 0
//      total.subscribe((next, prev) => ...);
//
//    computed only notifies when its OWN value changes, even if the store
//    around it changed ten times.
//
//      batch(() => { store.set({ a: 1 }); store.set({ b: 2 }); });
//      // → subscribers were called exactly once, with both changes
//
//    batch returns whatever its callback returned, nests, and still
//    flushes if the callback throws.
//
//  hint (stage 4): batch needs two module-level variables — a depth
//  counter and a Set of pending flush functions. A Set means "schedule
//  this store's flush" is naturally idempotent.

import { test, eq, ok, throws } from '../../_lib/check.js';

// stage 2 — true when a and b have the same keys and Object.is values.
export function shallowEqual(a, b) {
  throw new Error('TODO');
}

// stage 1 — returns { get, set, subscribe }.
export function createStore(initial) {
  throw new Error('TODO');
}

// stage 3 — returns { get, subscribe } for selector(state).
export function computed(store, selector) {
  throw new Error('TODO');
}

// stage 4 — run fn with notifications held back until it finishes.
export function batch(fn) {
  throw new Error('TODO');
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
