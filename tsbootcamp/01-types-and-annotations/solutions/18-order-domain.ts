// ─────────────────────────────────────────────────────────────────────────
//  18 · modelling an order — SOLUTION                       ★★★ stretch
//  run: node ../run.js solutions/18-order-domain.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each modifier in this model encodes one business rule,
//  and each one turns a class of bug into a compile error.
//
//  · `OrderStatus` as a literal union: a typo'd status is caught at the
//    call site, and adding 'refunded' later shows you every switch that
//    has to change.
//  · `readonly id` / `readonly sku`: identity is assigned once. You can
//    still build a new order carrying the same id — readonly stops
//    reassignment, not copying.
//  · `items: readonly LineItem[]`: no `push` anywhere, so every change
//    goes through `addItem` and produces a new array. Callers cannot
//    quietly mutate an order they were handed.
//  · `note?: string`: absent and empty are different things.
//
//  Both updaters are one spread each — `{ ...order, items: [...] }` — and
//  they type-check precisely because the readonly bits are copied into a
//  fresh object rather than written through the old one.
//
//  Money stays in integer cents until the moment it is displayed. Floats
//  are for physics, not invoices: 0.1 + 0.2 is not 0.3, and a rounding
//  error in a subtotal is a bug report from finance.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type OrderStatus = 'draft' | 'placed' | 'shipped' | 'cancelled';

export type LineItem = {
  readonly sku: string;
  qty: number;
  unitCents: number;
};

export type Order = {
  readonly id: string;
  status: OrderStatus;
  items: readonly LineItem[];
  note?: string;
};

export function subtotalCents(order: Order): number {
  return order.items.reduce(
    (total, item) => total + item.qty * item.unitCents,
    0
  );
}

export function addItem(order: Order, item: LineItem): Order {
  return { ...order, items: [...order.items, item] };
}

export function withStatus(order: Order, status: OrderStatus): Order {
  return { ...order, status };
}

export function describeOrder(order: Order): string {
  const money = (subtotalCents(order) / 100).toFixed(2);
  const count = order.items.length;
  const items = count === 1 ? '1 item' : `${count} items`;
  return `${order.id} ${order.status} $${money} (${items})`;
}

// ─────────────────────────── runtime tests ───────────────────────────────

const tea: LineItem = { sku: 'tea', qty: 2, unitCents: 250 };
const mug: LineItem = { sku: 'mug', qty: 1, unitCents: 900 };
const draft: Order = { id: 'o1', status: 'draft', items: [tea] };

test('subtotalCents multiplies quantity by unit price', () => {
  eq(subtotalCents(draft), 500);
});

test('subtotalCents of an empty order is 0', () => {
  eq(subtotalCents({ id: 'o2', status: 'draft', items: [] }), 0);
});

test('addItem appends without touching the original', () => {
  const bigger = addItem(draft, mug);
  eq(subtotalCents(bigger), 1400);
  eq(bigger.items.length, 2);
  eq(draft.items.length, 1);
});

test('withStatus changes only the status', () => {
  const placed = withStatus(draft, 'placed');
  eq(placed.status, 'placed');
  eq(placed.id, 'o1');
  eq(draft.status, 'draft');
});

test('describeOrder renders id, status, money and count', () => {
  eq(describeOrder(draft), 'o1 draft $5.00 (1 item)');
});

test('describeOrder pluralises the item count', () => {
  const twoItems = withStatus(addItem(draft, mug), 'placed');
  eq(describeOrder(twoItems), 'o1 placed $14.00 (2 items)');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<
  Equal<OrderStatus, 'draft' | 'placed' | 'shipped' | 'cancelled'>
>;
type _2 = Expect<Equal<keyof Order, 'id' | 'status' | 'items' | 'note'>>;
type _3 = Expect<Equal<Order['items'], readonly LineItem[]>>;
type _4 = Expect<Equal<Order['note'], string | undefined>>;
type _5 = Expect<
  Equal<LineItem, { readonly sku: string; qty: number; unitCents: number }>
>;
type _6 = Expect<Equal<ReturnType<typeof addItem>, Order>>;

function _typeTests() {
  // note is optional, so this is a complete Order
  const order: Order = { id: 'o1', status: 'draft', items: [] };
  withStatus(order, 'shipped');

  // @ts-expect-error — the id is assigned once, by whoever created the order
  order.id = 'o2';

  // @ts-expect-error — 'refunded' is not an OrderStatus
  withStatus(order, 'refunded');

  // @ts-expect-error — items is a readonly array: rebuild it instead
  order.items.push({ sku: 'tea', qty: 1, unitCents: 250 });

  // @ts-expect-error — a line item's sku is readonly too
  order.items[0].sku = 'mug';

  // @ts-expect-error — qty is a number
  const broken: LineItem = { sku: 'tea', qty: '1', unitCents: 250 };
  use(broken);

  // @ts-expect-error — every order needs a status
  const statusless: Order = { id: 'o3', items: [] };
  use(statusless);
}
use(_typeTests);
