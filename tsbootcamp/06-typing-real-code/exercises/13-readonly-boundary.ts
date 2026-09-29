// ─────────────────────────────────────────────────────────────────────────
//  13 · a read-only public surface                         ★★☆ core
//  concepts: DeepReadonly · recursive conditional types · API boundaries
//  run: node ../run.js exercises/13-readonly-boundary.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A module that owns state should hand out a view nobody can edit — not
//  by copying on every read, but by TYPING the boundary. Internally the
//  cart mutates a plain `CartState`; the `state` getter exposes the very
//  same object as `DeepReadonly<CartState>`.
//
//      const cart = createCart();
//      cart.add('sku-1', 100);      cart.add('sku-1', 100);
//      cart.state.items[0].qty      → 2
//      cart.state.items.push(...)   → compile error
//      cart.state.items[0].qty = 9  → compile error
//      cart.state.coupon = 'X'      → compile error
//      cart.total()                 → 200
//      cart.applyCoupon('SAVE10');  cart.total() → 180
//
//  `Readonly<T>` only freezes the top level, so build the recursive one:
//  arrays become `readonly U[]`, objects get `readonly` on every key,
//  everything else is left alone.
//
//  hint: three branches with `infer` in the first —
//  `T extends (infer U)[] ? ... : T extends object ? ... : T`. Order
//  matters: arrays ARE objects, so test for them first

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface CartItem {
  sku: string;
  qty: number;
  price: number;
}
export interface CartState {
  items: CartItem[];
  coupon: string | null;
}

export type DeepReadonly<T> = TODO;

export interface Cart {
  add: TODO;
  remove: TODO;
  applyCoupon: TODO;
  total: TODO;
  readonly state: TODO;
}

export function createCart(): TODO {
  throw new Error('TODO');
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
