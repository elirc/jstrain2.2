// ─────────────────────────────────────────────────────────────────────────
//  14 · super in overrides — SOLUTION                      ★★☆ core
//  run: node 14-super-overrides.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `super.total()` is not "the parent of this object" — it
//  is "the prototype of the object where this method was DEFINED", looked
//  up once, statically. So ExpressOrder.prototype.total finds
//  DiscountedOrder.prototype.total, which finds Order.prototype.total.
//  Three layers, each adding exactly one idea.
//
//  That static rule is also why `this` keeps pointing at the express
//  order the whole way down: super changes where the lookup starts, never
//  what `this` is. summary() proves it — ExpressOrder does not override
//  summary, so the inherited DiscountedOrder version runs, and its
//  `super.summary()` + `this.total()` mix parent formatting with the
//  express total.
//
//  Wrong turn: re-computing the subtotal inside DiscountedOrder. Then
//  adding a layer means editing every layer.

import { test, eq, ok, approx } from '../../_lib/check.js';

// ── scaffolding: one basket, reused by the tests ─────────────────────────

const items = [
  { name: 'mug', price: 10, qty: 2 },
  { name: 'pen', price: 5, qty: 2 },
];

export class Order {
  constructor(orderItems) {
    this.items = orderItems;
  }

  get subtotal() {
    return this.items.reduce((sum, line) => sum + line.price * line.qty, 0);
  }

  total() {
    return this.subtotal;
  }

  summary() {
    return `${this.items.length} items, $${this.total().toFixed(2)}`;
  }
}

export class DiscountedOrder extends Order {
  constructor(orderItems, percentOff) {
    super(orderItems);
    this.percentOff = percentOff;
  }

  total() {
    return super.total() * (1 - this.percentOff / 100);
  }

  summary() {
    return `${super.summary()} (${this.percentOff}% off)`;
  }
}

export class ExpressOrder extends DiscountedOrder {
  constructor(orderItems, percentOff, shipping) {
    super(orderItems, percentOff);
    this.shipping = shipping;
  }

  total() {
    return super.total() + this.shipping;
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
