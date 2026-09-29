// ─────────────────────────────────────────────────────────────────────────
//  13 · shape hierarchy — SOLUTION                         ★★☆ core
//  run: node 13-shape-hierarchy.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `class Circle extends Shape` sets up two links you could
//  write by hand — Object.setPrototypeOf(Circle.prototype,
//  Shape.prototype) for instance methods, and Object.setPrototypeOf(
//  Circle, Shape) so statics are inherited too.
//
//  `super(name)` calls Shape's constructor with the SAME `this`. In a
//  derived class `this` does not exist until super() returns, which is
//  why Square sets this.name only afterwards — touching `this` first is a
//  ReferenceError, not a warning.
//
//  describe() is the template-method pattern: base class owns the shape
//  of the answer, subclasses fill in one hole. It works because
//  `this.area()` is looked up on the instance at call time, so it finds
//  Circle.prototype.area before Shape.prototype.area. The base version
//  throws — the JS way to say "abstract", since there is no keyword.

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Shape {
  constructor(name) {
    this.name = name;
  }

  area() {
    throw new Error('subclasses must implement area()');
  }

  describe() {
    return `${this.name} with area ${this.area().toFixed(2)}`;
  }
}

export class Circle extends Shape {
  constructor(radius) {
    super('circle');
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}

export class Rectangle extends Shape {
  constructor(width, height) {
    super('rectangle');
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

export class Square extends Rectangle {
  constructor(side) {
    super(side, side);
    this.name = 'square';
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
