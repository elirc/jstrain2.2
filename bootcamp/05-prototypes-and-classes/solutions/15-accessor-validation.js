// ─────────────────────────────────────────────────────────────────────────
//  15 · validating setters — SOLUTION                      ★★☆ core
//  run: node 15-accessor-validation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accessors are the only door to #name and #price. The
//  constructor writes `this.name = name`, which calls the setter, which
//  validates — so an invalid Product can never exist, not even for one
//  statement. applyDiscount does the same: it computes a new number and
//  assigns it to `this.price`, letting the same guard catch a 200% off.
//
//  Assigning `this.#price = value` directly would "work" and silently
//  bypass every rule. That is the classic wrong turn here.
//
//  Under the hood `get price()` is not a property holding a function: it
//  is an accessor descriptor on Product.prototype, so
//  Object.getOwnPropertyDescriptor(Product.prototype, 'price') shows
//  { get, set }, and the instance itself has no own keys at all.
//
//  Note displayPrice has a getter and no setter, so writing to it throws
//  in strict mode — modules are always strict.

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Product {
  #name;
  #price;

  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  get name() {
    return this.#name;
  }

  set name(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError('name cannot be empty');
    }
    this.#name = value.trim();
  }

  get price() {
    return this.#price;
  }

  set price(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('price must be a number');
    }
    if (value < 0) throw new RangeError('price cannot be negative');
    this.#price = value;
  }

  get displayPrice() {
    return `$${this.#price.toFixed(2)}`;
  }

  applyDiscount(percent) {
    this.price = this.#price * (1 - percent / 100);
    return this;
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
