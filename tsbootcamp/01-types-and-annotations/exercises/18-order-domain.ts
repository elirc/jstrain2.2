// ─────────────────────────────────────────────────────────────────────────
//  18 · modelling an order                                  ★★★ stretch
//  concepts: domain modelling · literal unions · readonly · optional
//  run: node ../run.js exercises/18-order-domain.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything from this module in one small domain. Model it from the
//  business rules, not from the sample JSON:
//
//      OrderStatus   'draft' | 'placed' | 'shipped' | 'cancelled'
//      LineItem      sku (readonly — it identifies the line), qty,
//                    unitCents
//      Order         id (readonly), status, items (a readonly array of
//                    LineItem), note (optional)
//
//  Money is integer cents everywhere; only the display function divides.
//
//      subtotalCents(order)      → sum of qty * unitCents
//      addItem(order, item)      → a NEW order with the item appended
//      withStatus(order, 'placed') → a NEW order with the new status
//      describeOrder(order)      → 'o1 placed $5.00 (1 item)'
//                                → 'o1 placed $14.00 (2 items)'
//
//  Both update functions copy: nothing an existing order holds may be
//  reassigned in place.
//
//  hint: `readonly LineItem[]` blocks `push`, so build the new array with
//  a spread — `[...order.items, item]` — and let the copy carry the
//  readonly id along

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type OrderStatus = TODO;
export type LineItem = TODO;
export type Order = TODO;

export function subtotalCents(order: Order): number {
  throw new Error('TODO');
}

export function addItem(order: Order, item: LineItem): Order {
  throw new Error('TODO');
}

export function withStatus(order: Order, status: OrderStatus): Order {
  throw new Error('TODO');
}

export function describeOrder(order: Order): string {
  throw new Error('TODO');
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
