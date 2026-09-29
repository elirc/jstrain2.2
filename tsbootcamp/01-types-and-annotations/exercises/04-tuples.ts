// ─────────────────────────────────────────────────────────────────────────
//  04 · tuples                                             ★☆☆ warm-up
//  concepts: tuple types · labels · destructuring
//  run: node ../run.js exercises/04-tuples.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A tuple is an array with a fixed length where each position has its
//  own type. Labels (`[x: number, y: number]`) are documentation for
//  humans and editors — they don't change the type, but write them
//  anyway: `[x, y]` beats `[number, number]` at a call site.
//
//      origin()                  → [0, 0]
//      shift([1, 2], 3, 4)       → [4, 6]
//      toEntry('ada', 91)        → ['ada', 91]
//      entryLabel(['ada', 91])   → 'ada: 91'
//
//  Point is [x, y] of numbers. Entry is [name, score].
//
//  hint: `[number, number]` and `number[]` are very different types —
//  only one of them promises there are exactly two elements

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Point = TODO;
export type Entry = TODO;

export function origin(): Point {
  throw new Error('TODO');
}

export function shift(point: TODO, dx: TODO, dy: TODO): TODO {
  throw new Error('TODO');
}

export function toEntry(name: TODO, score: TODO): Entry {
  throw new Error('TODO');
}

export function entryLabel(entry: Entry): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('origin is the zero point', () => {
  eq(origin(), [0, 0]);
});

test('shift moves a point by dx and dy', () => {
  eq(shift([1, 2], 3, 4), [4, 6]);
});

test('shift returns a new tuple', () => {
  const point: [number, number] = [1, 2];
  shift(point, 3, 4);
  eq(point, [1, 2]);
});

test('toEntry pairs a name with a score', () => {
  eq(toEntry('ada', 91), ['ada', 91]);
});

test('entryLabel renders name and score', () => {
  eq(entryLabel(['ada', 91]), 'ada: 91');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Point, [number, number]>>;
type _2 = Expect<Equal<Entry, [string, number]>>;
type _3 = Expect<Equal<Point['length'], 2>>;
type _4 = Expect<Equal<ReturnType<typeof shift>, Point>>;

function _typeTests() {
  const [x, y] = origin(); // destructuring keeps each position typed
  const sum: number = x + y;
  use(sum);

  // @ts-expect-error — a Point has exactly two elements
  const three: Point = [1, 2, 3];
  use(three);

  // @ts-expect-error — Entry is [name, score], not [score, name]
  const flipped: Entry = [91, 'ada'];
  use(flipped);

  const pair: number[] = [1, 2];
  // @ts-expect-error — number[] has no fixed length, so it is not a Point
  const fromArray: Point = pair;
  use(fromArray);
}
use(_typeTests);
