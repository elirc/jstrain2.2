// ─────────────────────────────────────────────────────────────────────────
//  13 · shape hierarchy                                    ★★☆ core
//  concepts: extends · super() · polymorphism · abstract base
//  run: node 13-shape-hierarchy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `extends` links two prototypes: Circle.prototype delegates to
//  Shape.prototype, so a Circle finds describe() there — while describe()
//  calls this.area() and lands back on Circle's version. That round trip
//  is polymorphism.
//
//  Build four classes:
//    Shape      constructor(name) stores this.name
//               area()      throws 'subclasses must implement area()'
//               describe()  → `${name} with area ${area, 2 decimals}`
//    Circle     extends Shape, constructor(radius), area = pi * r * r
//    Rectangle  extends Shape, constructor(width, height)
//    Square     extends Rectangle, constructor(side) — and its name is
//               'square', not 'rectangle'
//
//      new Circle(1).describe()      → 'circle with area 3.14'
//      new Square(4).describe()      → 'square with area 16.00'
//      new Square(4) instanceof Shape → true
//
//  hint: a subclass constructor must call super(...) BEFORE it touches
//  `this` — and Square's super() is Rectangle's, not Shape's

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Shape {
  constructor(name) {
    throw new Error('TODO');
  }

  area() {
    throw new Error('TODO');
  }

  describe() {
    throw new Error('TODO');
  }
}

export class Circle extends Shape {
  constructor(radius) {
    throw new Error('TODO');
  }

  area() {
    throw new Error('TODO');
  }
}

export class Rectangle extends Shape {
  constructor(width, height) {
    throw new Error('TODO');
  }

  area() {
    throw new Error('TODO');
  }
}

export class Square extends Rectangle {
  constructor(side) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('each subclass computes its own area', () => {
  approx(new Circle(2).area(), Math.PI * 4);
  eq(new Rectangle(3, 4).area(), 12);
  eq(new Square(5).area(), 25);
});

test('describe is written once on the base and used by all', () => {
  eq(new Circle(1).describe(), 'circle with area 3.14');
  eq(new Rectangle(3, 4).describe(), 'rectangle with area 12.00');
  eq(new Square(4).describe(), 'square with area 16.00');
});

test('the inherited describe calls the subclass area', () => {
  const c = new Circle(1);
  eq(Object.hasOwn(Object.getPrototypeOf(c), 'describe'), false);
  ok(Object.hasOwn(Circle.prototype, 'area'));
});

test('the abstract base refuses to compute an area', () => {
  const blob = new Shape('blob');
  throws(() => blob.area(), 'subclasses must implement area()');
  throws(() => blob.describe(), 'subclasses must implement area()');
});

test('the prototype chain is three links deep for a Square', () => {
  const s = new Square(2);
  ok(s instanceof Square);
  ok(s instanceof Rectangle);
  ok(s instanceof Shape);
  ok(Object.getPrototypeOf(Square.prototype) === Rectangle.prototype);
  ok(Object.getPrototypeOf(Rectangle.prototype) === Shape.prototype);
});

test('Square reuses Rectangle by passing the side twice', () => {
  const s = new Square(3);
  eq(s.width, 3);
  eq(s.height, 3);
  eq(s.name, 'square');
});

test('a mixed list describes itself with no if-statements', () => {
  const shapes = [new Circle(1), new Rectangle(2, 3), new Square(4)];
  eq(shapes.map((s) => s.describe()), [
    'circle with area 3.14',
    'rectangle with area 6.00',
    'square with area 16.00',
  ]);
});
