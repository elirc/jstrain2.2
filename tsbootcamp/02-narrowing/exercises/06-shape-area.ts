// ─────────────────────────────────────────────────────────────────────────
//  06 · area                                                 ★★☆ core
//  concepts: discriminated unions · literal tags · switch narrowing
//  run: node ../run.js exercises/06-shape-area.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  The workhorse pattern of TypeScript. Every variant carries the same
//  property name holding a different LITERAL type — here `kind` — and
//  checking that one property tells the compiler everything about the
//  rest of the object.
//
//      { kind: 'circle', radius: 2 }         area → 12.566…
//      { kind: 'rect', width: 3, height: 4 } area → 12
//      { kind: 'square', size: 5 }           area → 25
//
//      describe(circle) → 'circle r=2'
//      describe(rect)   → 'rect 3x4'
//      describe(square) → 'square 5'
//
//  Write the three variant types. A tag must be a literal type
//  (`'circle'`), not `string` — `string` cannot be told apart from
//  anything.

import { test, eq, approx } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export type Circle = TODO;
export type Rect = TODO;
export type Square = TODO;

export type Shape = Circle | Rect | Square;

const circle: Shape = { kind: 'circle', radius: 2 };
const rect: Shape = { kind: 'rect', width: 3, height: 4 };
const square: Shape = { kind: 'square', size: 5 };

export function area(shape: Shape): number {
  throw new Error('TODO');
}

export function describe(shape: Shape): string {
  throw new Error('TODO');
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
