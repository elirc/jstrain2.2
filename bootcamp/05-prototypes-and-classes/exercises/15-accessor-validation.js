// ─────────────────────────────────────────────────────────────────────────
//  15 · validating setters                                 ★★☆ core
//  concepts: get/set in classes · invariants · fail fast
//  run: node 15-accessor-validation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A setter is the checkpoint every write has to pass. Put the rule there
//  once and no code path can sneak around it — including your own
//  constructor, if it assigns through the setter.
//
//  Build a Product with #name and #price behind accessors:
//
//      const p = new Product('  Mug ', 4.5);
//      p.name             → 'Mug'      (setter trims)
//      p.price            → 4.5
//      p.displayPrice     → '$4.50'    (read-only getter)
//      p.price = -1       → throws RangeError 'price cannot be negative'
//      p.price = '4'      → throws TypeError 'price must be a number'
//      p.name = '   '     → throws TypeError 'name cannot be empty'
//      p.applyDiscount(25)  → the product, price now 3.375
//      p.applyDiscount(200) → throws (it would go negative)
//
//  The constructor must reuse the setters, and applyDiscount must write
//  through `this.price` so the guard runs again.
//
//  hint: `this.price = value` inside the class calls the setter — that
//  is the whole trick. Writing `this.#price = value` skips it.

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Product {
  constructor(name, price) {
    throw new Error('TODO');
  }

  get name() {
    throw new Error('TODO');
  }

  set name(value) {
    throw new Error('TODO');
  }

  get price() {
    throw new Error('TODO');
  }

  set price(value) {
    throw new Error('TODO');
  }

  get displayPrice() {
    throw new Error('TODO');
  }

  applyDiscount(percent) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the setters run while constructing', () => {
  const p = new Product('  Mug ', 4.5);
  eq(p.name, 'Mug');
  eq(p.price, 4.5);
});

test('a bad price never becomes an object', () => {
  const p = new Product('Mug', 4.5);
  throws(() => new Product('Mug', -1), 'price cannot be negative');
  throws(() => new Product('Mug', '4'), 'price must be a number');
  throws(() => new Product('', 4.5), 'name cannot be empty');
});

test('rejected writes leave the old value in place', () => {
  const p = new Product('Mug', 4.5);
  throws(() => {
    p.price = -1;
  }, 'price cannot be negative');
  throws(() => {
    p.name = '   ';
  }, 'name cannot be empty');
  eq(p.price, 4.5);
  eq(p.name, 'Mug');
});

test('NaN is a number but not a price', () => {
  const p = new Product('Mug', 4.5);
  throws(() => {
    p.price = NaN;
  }, 'price must be a number');
});

test('displayPrice formats two decimals', () => {
  eq(new Product('Mug', 4.5).displayPrice, '$4.50');
  eq(new Product('Pen', 0).displayPrice, '$0.00');
  eq(new Product('Rug', 1200).displayPrice, '$1200.00');
});

test('applyDiscount writes through the setter and chains', () => {
  const p = new Product('Mug', 4.5);
  approx(p.applyDiscount(25).price, 3.375);
  eq(p.displayPrice, '$3.38');
});

test('a discount that would go negative is refused', () => {
  const p = new Product('Mug', 4.5);
  throws(() => p.applyDiscount(200), 'price cannot be negative');
  eq(p.price, 4.5);
});

test('all the state is private — only accessors are visible', () => {
  const p = new Product('Mug', 4.5);
  eq(Object.keys(p), []);
  eq(JSON.stringify(p), '{}');
  ok('price' in p, 'the accessor still lives on the prototype');
});
