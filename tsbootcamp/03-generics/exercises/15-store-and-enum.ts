// ─────────────────────────────────────────────────────────────────────────
//  15 · createStore & makeEnum                            ★★★ stretch
//  concepts: generic factories · inference from `as const`
//  run: node ../run.js exercises/15-store-and-enum.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Factories: one generic function that builds a whole typed API.
//
//      const store = createStore({ count: 0 });
//      store.get()                        → { count: 0 }
//      store.set({ count: 5 });
//      store.update(s => ({ count: s.count + 1 }));
//      store.set({ count: '5' })          → compile error
//
//  `makeEnum` turns a list of names into a lookup object whose keys and
//  values are the literal names:
//
//      makeEnum(['red', 'green'] as const)
//        → { red: 'red', green: 'green' }
//        typed { red: 'red'; green: 'green' }
//
//  The `as const` matters: without it the argument is `string[]`, T[number]
//  is `string`, and you get a useless `{ [x: string]: string }`. Exercise
//  17 shows how to move that burden off the caller.
//
//  hint: `T extends readonly string[]` accepts a frozen tuple; the return
//  type is the mapped type `{ [K in T[number]]: K }`

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function createStore(initial: TODO): TODO {
  throw new Error('TODO');
}

export function makeEnum(values: TODO): TODO {
  throw new Error('TODO');
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
