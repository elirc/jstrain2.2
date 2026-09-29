// ─────────────────────────────────────────────────────────────────────────
//  06 · optional and rest tuple elements                    ★★☆ core
//  concepts: optional tuple elements · rest elements · readonly tuples
//  run: node ../run.js exercises/06-tuple-rest-and-optional.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Tuples do more than fixed pairs. An element can be optional (`port?:
//  number`, always last-ish), a rest element can soak up "and then any
//  number of these" (`...values: number[]`), and the whole tuple can be
//  `readonly`.
//
//      Route   [method, path] with an optional port
//      Row     [label, ...values] — a label then any number of numbers
//      Rgb     a readonly triple of numbers
//
//      formatRoute(['GET', '/users'])        → 'GET /users'
//      formatRoute(['GET', '/users', 8080])  → 'GET /users:8080'
//      rowTotal(['q1', 1, 2, 3])             → 6
//      rowTotal(['q1'])                      → 0
//      brightness([30, 60, 90])              → 60
//
//  hint: `const [, ...values] = row` gives you the rest with its element
//  type intact — and an optional element reads as `T | undefined`

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Route = TODO;
export type Row = TODO;
export type Rgb = TODO;

export function formatRoute(route: Route): string {
  throw new Error('TODO');
}

export function rowTotal(row: Row): number {
  throw new Error('TODO');
}

export function brightness(rgb: Rgb): number {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('formatRoute leaves the port out when there is none', () => {
  eq(formatRoute(['GET', '/users']), 'GET /users');
});

test('formatRoute appends the port when there is one', () => {
  eq(formatRoute(['GET', '/users', 8080]), 'GET /users:8080');
});

test('rowTotal sums every value after the label', () => {
  eq(rowTotal(['q1', 1, 2, 3]), 6);
});

test('rowTotal of a label-only row is 0', () => {
  eq(rowTotal(['q1']), 0);
});

test('brightness averages the three channels', () => {
  eq(brightness([30, 60, 90]), 60);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Route['length'], 2 | 3>>;
type _2 = Expect<Equal<Row[0], string>>;
type _3 = Expect<Equal<Rgb, readonly [number, number, number]>>;

function _typeTests() {
  const short: Route = ['GET', '/users'];
  const long: Route = ['GET', '/users', 8080];
  use(short, long);

  // @ts-expect-error — a Route has at most three elements
  const extra: Route = ['GET', '/users', 8080, 'nope'];
  use(extra);

  const bare: Row = ['q1']; // the rest part may be empty
  const full: Row = ['q1', 1, 2, 3];
  use(bare, full);

  // @ts-expect-error — every element after the label is a number
  const mixed: Row = ['q1', 'two'];
  use(mixed);

  const rgb: Rgb = [10, 20, 30];
  // @ts-expect-error — a readonly tuple has no writable elements
  rgb[0] = 99;
}
use(_typeTests);
