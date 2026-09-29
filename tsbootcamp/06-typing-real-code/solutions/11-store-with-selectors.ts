// ─────────────────────────────────────────────────────────────────────────
//  11 · a store with typed selectors — SOLUTION            ★★☆ core
//  run: node ../run.js solutions/11-store-with-selectors.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two type parameters at two different levels. `S` belongs
//  to the store and is fixed the moment you call `createStore`. `R`
//  belongs to a single `select` or `subscribe` CALL, and is inferred from
//  the selector's return type. That is the whole ergonomic trick: you
//  never annotate a selector, and the listener's parameters are typed for
//  free because they are stated in terms of R.
//
//  Read `select<R>(selector: (state: S) => R): R` out loud — "give me a
//  function from my state to anything, and I give you back that anything".
//  Inference flows left to right through the callback, which is why
//  `subscribe(s => s.user.name, (name, previous) => ...)` types `name`
//  without help.
//
//  `set` accepts a value or an updater, and `typeof updater === 'function'`
//  is the only way to tell them apart at runtime. The assertion after the
//  check is unavoidable: narrowing a generic `S | ((prev: S) => S)` by
//  typeof cannot prove S itself is not a function type. Worth knowing —
//  a store whose state IS a function needs a different API, which is
//  exactly why React's `setState` has the same caveat.
//
//  The `Object.is` comparison is what makes subscriptions cheap: a set
//  that leaves the selected slice untouched notifies nobody. Copying the
//  watcher set before iterating protects against a listener
//  unsubscribing mid-notify.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Store<S> {
  get(): S;
  set(updater: S | ((prev: S) => S)): void;
  select<R>(selector: (state: S) => R): R;
  subscribe<R>(
    selector: (state: S) => R,
    listener: (value: R, previous: R) => void
  ): () => void;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const watchers = new Set<() => void>();

  return {
    get: () => state,

    set(updater) {
      const next =
        typeof updater === 'function' ? (updater as (prev: S) => S)(state) : updater;
      if (Object.is(next, state)) return;
      state = next;
      for (const watcher of [...watchers]) watcher();
    },

    select(selector) {
      return selector(state);
    },

    subscribe(selector, listener) {
      let previous = selector(state);
      const watcher = () => {
        const next = selector(state);
        if (Object.is(next, previous)) return;
        const old = previous;
        previous = next;
        listener(next, old);
      };
      watchers.add(watcher);
      return () => {
        watchers.delete(watcher);
      };
    },
  };
}

interface AppState {
  count: number;
  user: { name: string };
}

const initialState: AppState = { count: 0, user: { name: 'ada' } };

// ─────────────────────────── runtime tests ───────────────────────────────

test('get returns what it was created with', () => {
  const store = createStore(initialState);
  eq(store.get(), { count: 0, user: { name: 'ada' } });
});

test('set replaces the state, in both forms', () => {
  const store = createStore(initialState);
  store.set({ count: 5, user: { name: 'bo' } });
  eq(store.get().count, 5);
  store.set((prev: AppState) => ({ ...prev, count: prev.count + 1 }));
  eq(store.get().count, 6);
  eq(store.get().user.name, 'bo');
});

test('select projects without subscribing to anything', () => {
  const store = createStore(initialState);
  eq(store.select((s: AppState) => s.user.name), 'ada');
  eq(store.select((s: AppState) => s.count * 2), 0);
});

test('a subscriber fires only when its own slice changes', () => {
  const store = createStore(initialState);
  const seen: string[] = [];
  store.subscribe((s: AppState) => s.user.name, (name: string) => seen.push(name));
  store.set((prev: AppState) => ({ ...prev, count: prev.count + 1 }));
  eq(seen, []);
  store.set((prev: AppState) => ({ ...prev, user: { name: 'bo' } }));
  eq(seen, ['bo']);
});

test('the listener is handed the new value and the old one', () => {
  const store = createStore(initialState);
  const pairs: string[] = [];
  store.subscribe(
    (s: AppState) => s.count,
    (next: number, previous: number) => pairs.push(`${previous}->${next}`)
  );
  store.set({ count: 1, user: { name: 'ada' } });
  store.set({ count: 7, user: { name: 'ada' } });
  eq(pairs, ['0->1', '1->7']);
});

test('unsubscribing stops the notifications', () => {
  const store = createStore(initialState);
  let hits = 0;
  const stop = store.subscribe((s: AppState) => s.count, () => { hits += 1; });
  store.set({ count: 1, user: { name: 'ada' } });
  stop();
  store.set({ count: 2, user: { name: 'ada' } });
  eq(hits, 1);
  ok(store.get().count === 2, 'the store itself keeps updating');
});

// ──────────────────────────── type tests ─────────────────────────────────

declare const typedStore: Store<AppState>;
type _t1 = Expect<Equal<ReturnType<typeof typedStore.get>, AppState>>;
type _t2 = Expect<Equal<ReturnType<typeof typedStore.select<string>>, string>>;

function _typeTests() {
  const store = createStore(initialState);

  const count: number = store.select((s) => s.count);
  const name: string = store.select((s) => s.user.name);
  use(count, name);

  store.subscribe(
    (s) => s.user.name,
    (value, previous) => {
      const both: string = value + previous;
      use(both);
    }
  );

  // @ts-expect-error — 'nope' is not part of the state
  store.select((s) => s.nope);

  // @ts-expect-error — the selected slice is a number, not a string
  const wrong: string = store.select((s) => s.count);
  use(wrong);

  // @ts-expect-error — set takes the whole state, not a patch
  store.set({ count: 1 });
}
use(_typeTests);
