// ─────────────────────────────────────────────────────────────────────────
//  13 · a read-only public surface — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/13-readonly-boundary.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Readonly<T>` is one level deep, which is almost never
//  what you meant — `Readonly<CartState>` still lets anyone call
//  `state.items.push(...)`. The recursive version is three branches, and
//  the ORDER of the first two is the trap: arrays are objects, so the
//  array branch has to come first or every array turns into a mapped type
//  over its numeric keys.
//
//    T extends (infer U)[]  → readonly DeepReadonly<U>[]
//    T extends object       → { readonly [K in keyof T]: DeepReadonly<T[K]> }
//    otherwise              → T   (primitives, null, undefined)
//
//  Because it distributes over unions, `DeepReadonly<string | null>` stays
//  `string | null` — a naked type parameter in a conditional splits the
//  union apart and rebuilds it.
//
//  Now the design point. The getter returns the SAME object the module
//  mutates — no copy, no freeze, no cost. The readonly-ness is a claim
//  made at the boundary and enforced by the compiler on callers, while
//  the module's own code holds a `CartState` and edits it freely. That is
//  what "types are your API contract" means in practice: one value, two
//  views, and the narrow one is the one you export.
//
//  Two honest caveats to keep in your head. It is compile-time only — a
//  JS caller, or anyone with an `as`, can still mutate; use
//  `Object.freeze` too if the input is hostile. And this lite version
//  mangles anything exotic: a function-valued property becomes a mapped
//  type and loses its call signature, which is why library versions
//  (`type-fest`'s ReadonlyDeep) carry extra branches for functions, Map,
//  Set and Date.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface CartItem {
  sku: string;
  qty: number;
  price: number;
}
export interface CartState {
  items: CartItem[];
  coupon: string | null;
}

export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export interface Cart {
  add(sku: string, price: number, qty?: number): void;
  remove(sku: string): void;
  applyCoupon(code: string | null): void;
  total(): number;
  readonly state: DeepReadonly<CartState>;
}

export function createCart(): Cart {
  // internal, mutable, private to this closure
  const state: CartState = { items: [], coupon: null };

  return {
    add(sku, price, qty = 1) {
      const line = state.items.find((item) => item.sku === sku);
      if (line) line.qty += qty;
      else state.items.push({ sku, qty, price });
    },

    remove(sku) {
      state.items = state.items.filter((item) => item.sku !== sku);
    },

    applyCoupon(code) {
      state.coupon = code;
    },

    total() {
      const sum = state.items.reduce((run, item) => run + item.price * item.qty, 0);
      return state.coupon === 'SAVE10' ? Math.round(sum * 0.9) : sum;
    },

    // the same object, exposed through a narrower type
    get state() {
      return state;
    },
  };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('add creates one line per sku', () => {
  const cart = createCart();
  cart.add('apple', 100);
  cart.add('pear', 50, 3);
  eq(cart.state.items.length, 2);
  eq(cart.state.items[1], { sku: 'pear', qty: 3, price: 50 });
});

test('adding the same sku bumps the quantity instead of duplicating', () => {
  const cart = createCart();
  cart.add('apple', 100);
  cart.add('apple', 100);
  cart.add('apple', 100, 2);
  eq(cart.state.items.length, 1);
  eq(cart.state.items[0].qty, 4);
});

test('remove drops the whole line', () => {
  const cart = createCart();
  cart.add('apple', 100);
  cart.add('pear', 50);
  cart.remove('apple');
  eq(cart.state.items.map((i: CartItem) => i.sku), ['pear']);
  cart.remove('ghost');
  eq(cart.state.items.length, 1);
});

test('total multiplies price by quantity across lines', () => {
  const cart = createCart();
  cart.add('apple', 100, 2);
  cart.add('pear', 50, 3);
  eq(cart.total(), 350);
});

test('a coupon changes the total and can be cleared', () => {
  const cart = createCart();
  cart.add('apple', 100, 2);
  cart.applyCoupon('SAVE10');
  eq(cart.total(), 180);
  eq(cart.state.coupon, 'SAVE10');
  cart.applyCoupon(null);
  eq(cart.total(), 200);
});

test('an unknown coupon is stored but changes nothing', () => {
  const cart = createCart();
  cart.add('apple', 100);
  cart.applyCoupon('NOPE');
  eq(cart.total(), 100);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _d1 = Expect<
  Equal<DeepReadonly<{ a: { b: number[] } }>, { readonly a: { readonly b: readonly number[] } }>
>;
type _d2 = Expect<Equal<DeepReadonly<string | null>, string | null>>;

function _typeTests() {
  const cart = createCart();
  const view = cart.state;

  const qty: number = view.items[0].qty;
  const coupon: string | null = view.coupon;
  use(qty, coupon);

  // @ts-expect-error — the public view is a readonly array
  view.items.push({ sku: 'x', qty: 1, price: 1 });

  // @ts-expect-error — and its elements cannot be replaced
  view.items[0] = { sku: 'x', qty: 1, price: 1 };

  // @ts-expect-error — nor edited in place
  view.items[0].qty = 99;

  // @ts-expect-error — nor can the top level be reassigned
  view.coupon = 'FREE';

  // @ts-expect-error — the whole state is exposed read-only
  cart.state = { items: [], coupon: null };
}
use(_typeTests);
