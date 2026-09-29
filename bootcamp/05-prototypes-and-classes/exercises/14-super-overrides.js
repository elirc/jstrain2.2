// ─────────────────────────────────────────────────────────────────────────
//  14 · super in overrides                                 ★★☆ core
//  concepts: method overriding · super.method() · layering
//  run: node 14-super-overrides.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Overriding does not mean replacing. `super.total()` runs the parent's
//  version and hands you the result, so each layer only adds its own
//  twist. Build a three-deep order chain:
//
//    Order(items)             items are { name, price, qty }
//      get subtotal()         sum of price * qty
//      total()                the subtotal
//      summary()              `${n} items, $${total, 2 decimals}`
//                             where n is the number of LINES, not units
//
//    DiscountedOrder(items, percentOff) extends Order
//      total()                parent total minus percentOff percent
//      summary()              parent summary + ` (${percentOff}% off)`
//
//    ExpressOrder(items, percentOff, shipping) extends DiscountedOrder
//      total()                parent total plus shipping
//
//      const items = [{ name: 'mug', price: 10, qty: 2 }];
//      new Order(items).total()                    → 20
//      new DiscountedOrder(items, 10).total()      → 18
//      new ExpressOrder(items, 10, 5).total()      → 23
//      new DiscountedOrder(items, 10).summary()
//                                → '1 items, $18.00 (10% off)'
//
//  hint: never re-derive the subtotal in a subclass — every override
//  should start from super.total()

import { test, eq, ok, approx } from '../../_lib/check.js';

// ── scaffolding: one basket, reused by the tests ─────────────────────────

const items = [
  { name: 'mug', price: 10, qty: 2 },
  { name: 'pen', price: 5, qty: 2 },
];

export class Order {
  constructor(orderItems) {
    throw new Error('TODO');
  }

  get subtotal() {
    throw new Error('TODO');
  }

  total() {
    throw new Error('TODO');
  }

  summary() {
    throw new Error('TODO');
  }
}

export class DiscountedOrder extends Order {
  constructor(orderItems, percentOff) {
    throw new Error('TODO');
  }

  total() {
    throw new Error('TODO');
  }

  summary() {
    throw new Error('TODO');
  }
}

export class ExpressOrder extends DiscountedOrder {
  constructor(orderItems, percentOff, shipping) {
    throw new Error('TODO');
  }

  total() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the base order totals its lines', () => {
  const o = new Order(items);
  eq(o.subtotal, 30);
  eq(o.total(), 30);
});

test('the discount layer overrides total', () => {
  const o = new DiscountedOrder(items, 10);
  approx(o.total(), 27);
  eq(o.subtotal, 30, 'the inherited getter is untouched');
});

test('express stacks shipping on top of the discounted total', () => {
  const o = new ExpressOrder(items, 10, 4.99);
  approx(o.total(), 31.99, 1e-9);
});

test('summary chains through super too', () => {
  eq(new Order(items).summary(), '2 items, $30.00');
  eq(new DiscountedOrder(items, 10).summary(), '2 items, $27.00 (10% off)');
});

test('express inherits the discounted summary but not its total', () => {
  const o = new ExpressOrder(items, 10, 4.99);
  eq(o.summary(), '2 items, $31.99 (10% off)');
  eq(Object.hasOwn(ExpressOrder.prototype, 'summary'), false);
});

test('an express order is all three types at once', () => {
  const o = new ExpressOrder(items, 10, 5);
  ok(o instanceof ExpressOrder);
  ok(o instanceof DiscountedOrder);
  ok(o instanceof Order);
});

test('the base class is unaffected by its subclasses', () => {
  const plain = new Order(items);
  const cheap = new DiscountedOrder(items, 50);
  approx(cheap.total(), 15);
  eq(plain.total(), 30);
});
