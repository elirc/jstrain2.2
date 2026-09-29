// ─────────────────────────────────────────────────────────────────────────
//  15 · createStore & makeEnum — SOLUTION                 ★★★ stretch
//  run: node ../run.js solutions/15-store-and-enum.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `createStore<S>(initial: S): Store<S>` infers the whole
//  state shape from ONE argument and hands back an API where every method
//  already knows it. That is the factory pattern in TypeScript: annotate
//  the data, and the functions come out typed for free. Naming the
//  product (`interface Store<S>`) beats an inline return type as soon as
//  anything else needs to accept a store.
//
//  `makeEnum<T extends readonly string[]>` is the other half of the
//  lesson: what inference is GIVEN. `['red', 'green']` infers as
//  `string[]` — literals are widened for a mutable array — so
//  `T[number]` is `string` and the mapped type degrades to
//  `{ [x: string]: string }`. Add `as const` and T becomes
//  `readonly ['red', 'green']`, `T[number]` is `'red' | 'green'`, and the
//  result names its own keys.
//
//  Requiring `as const` at every call site is a real cost. Exercise 17
//  shows the TS 5 fix: a `const` type parameter that does it for you.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Store<S> {
  get(): S;
  set(next: S): void;
  update(fn: (prev: S) => S): void;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  return {
    get: () => state,
    set: (next: S) => {
      state = next;
    },
    update: (fn: (prev: S) => S) => {
      state = fn(state);
    },
  };
}

export function makeEnum<T extends readonly string[]>(values: T): { [K in T[number]]: K } {
  const out = {} as { [K in T[number]]: K };
  for (const value of values) {
    // the mapped type guarantees key === value; the loop cannot prove it
    (out as Record<string, string>)[value] = value;
  }
  return out;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the store starts at the initial state', () => {
  eq(createStore({ count: 0 }).get(), { count: 0 });
});

test('set replaces the state', () => {
  const store = createStore({ count: 0 });
  store.set({ count: 5 });
  eq(store.get(), { count: 5 });
});

test('update reads the previous state', () => {
  const store = createStore({ count: 1 });
  store.update((prev: { count: number }) => ({ count: prev.count + 1 }));
  store.update((prev: { count: number }) => ({ count: prev.count + 1 }));
  eq(store.get(), { count: 3 });
});

test('two stores keep their own state', () => {
  const a = createStore(0);
  const b = createStore(0);
  a.set(9);
  eq(b.get(), 0);
});

test('makeEnum maps every name to itself', () => {
  eq(makeEnum(['red', 'green'] as const), { red: 'red', green: 'green' });
});

test('makeEnum of an empty list is an empty object', () => {
  eq(makeEnum([] as const), {});
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<
    ReturnType<typeof makeEnum<readonly ['a', 'b']>>,
    { a: 'a'; b: 'b' }
  >
>;

function _typeTests() {
  const store = createStore({ count: 0 });
  const state = store.get();
  type _s = Expect<Equal<typeof state, { count: number }>>;
  use(state);

  store.set({ count: 5 });
  store.update((prev) => ({ count: prev.count + 1 }));

  // @ts-expect-error — the state shape is fixed by the initial value
  store.set({ count: '5' });

  // @ts-expect-error — update must return a whole state, not a fragment
  store.update(() => ({}));

  const colors = makeEnum(['red', 'green'] as const);
  type _c = Expect<Equal<typeof colors, { red: 'red'; green: 'green' }>>;
  const red: 'red' = colors.red;
  use(colors, red);

  // @ts-expect-error — blue was never in the list
  colors.blue;

  // without `as const` the literals are gone before the generic sees them
  const loose = makeEnum(['red', 'green']);
  type _l = Expect<Equal<typeof loose, { [x: string]: string }>>;
  use(loose);
}
use(_typeTests);
