// ─────────────────────────────────────────────────────────────────────────
//  06 · area — SOLUTION                                      ★★☆ core
//  run: node ../run.js solutions/06-shape-area.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a discriminated union needs three things — a shared
//  property name (`kind`), a distinct LITERAL type in every variant, and
//  a union of those variants. Get all three and `shape.kind === 'circle'`
//  narrows the whole object, not just the tag.
//
//  Why literals: `kind: string` would compile, but `'circle'` and
//  `'rect'` would be the same type and narrowing would do nothing. The
//  tag has to be a type the compiler can distinguish, which is why
//  literal types exist at all.
//
//  Why the mixed object is rejected: `{ kind: 'circle', radius, width }`
//  matches the circle variant but carries an extra member, and excess
//  property checking on a fresh object literal refuses it. That is the
//  union keeping your data honest — a shape cannot be half-circle.
//
//  `switch (shape.kind)` and a chain of `if`s narrow identically; switch
//  reads better once you have three or more variants, and it is the form
//  that pairs with the exhaustiveness check in exercise 09.

import { test, eq, approx } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export type Circle = { kind: 'circle'; radius: number };
export type Rect = { kind: 'rect'; width: number; height: number };
export type Square = { kind: 'square'; size: number };

export type Shape = Circle | Rect | Square;

const circle: Shape = { kind: 'circle', radius: 2 };
const rect: Shape = { kind: 'rect', width: 3, height: 4 };
const square: Shape = { kind: 'square', size: 5 };

export function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
    case 'square':
      return shape.size ** 2;
  }
}

export function describe(shape: Shape): string {
  switch (shape.kind) {
    case 'circle':
      return `circle r=${shape.radius}`;
    case 'rect':
      return `rect ${shape.width}x${shape.height}`;
    case 'square':
      return `square ${shape.size}`;
  }
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the area of a circle is pi r squared', () => {
  approx(area(circle), Math.PI * 4);
});

test('the area of a rectangle is width times height', () => {
  eq(area(rect), 12);
});

test('the area of a square is size squared', () => {
  eq(area(square), 25);
});

test('describe names a circle by its radius', () => {
  eq(describe(circle), 'circle r=2');
});

test('describe names a rectangle by both sides', () => {
  eq(describe(rect), 'rect 3x4');
});

test('describe names a square by its one side', () => {
  eq(describe(square), 'square 5');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Shape['kind'], 'circle' | 'rect' | 'square'>>;

function _typeTests() {
  const shape = circle;

  if (shape.kind === 'circle') {
    const p = probe(shape.radius);
    type _radius = Expect<Equal<typeof p, number>>;
    use(p);

    // @ts-expect-error — a circle has no width
    shape.width;
  } else if (shape.kind === 'rect') {
    const p = probe(shape);
    type _rect = Expect<Equal<typeof p, Rect>>;
    use(p, p.width, p.height);
  }

  // @ts-expect-error — a shape may not mix members from two variants
  const mixed: Shape = { kind: 'circle', radius: 1, width: 2 };

  // @ts-expect-error — 'triangle' is not one of the three kinds
  const unknownKind: Shape = { kind: 'triangle', base: 1, height: 2 };

  use(mixed, unknownKind);
}
use(_typeTests);
