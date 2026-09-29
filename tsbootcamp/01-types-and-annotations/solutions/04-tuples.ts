// ─────────────────────────────────────────────────────────────────────────
//  04 · tuples — SOLUTION                                  ★☆☆ warm-up
//  run: node ../run.js solutions/04-tuples.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `[x: number, y: number]` says three things `number[]`
//  never says — there are exactly two elements, element 0 is x, element 1
//  is y. That is why `point.length` is the literal type `2` and why
//  `const [x, y] = origin()` gives you two numbers instead of two
//  `number | undefined`s.
//
//  Labels are erased: `[x: number, y: number]` and `[number, number]` are
//  the same type, which is why the type test can compare against the
//  unlabelled form. Write the labels anyway — they show up in editor
//  hints at every call site.
//
//  The classic wrong turn is `number[]` "because a tuple is an array".
//  Assignment only flows one way: a `[number, number]` is a fine
//  `number[]`, but a `number[]` is not a Point — the compiler has no idea
//  how many elements are in there.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Point = [x: number, y: number];
export type Entry = [name: string, score: number];

export function origin(): Point {
  return [0, 0];
}

export function shift(point: Point, dx: number, dy: number): Point {
  return [point[0] + dx, point[1] + dy];
}

export function toEntry(name: string, score: number): Entry {
  return [name, score];
}

export function entryLabel(entry: Entry): string {
  const [name, score] = entry;
  return `${name}: ${score}`;
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
