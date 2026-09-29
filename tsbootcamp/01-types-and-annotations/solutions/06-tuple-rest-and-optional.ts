// ─────────────────────────────────────────────────────────────────────────
//  06 · optional and rest tuple elements — SOLUTION         ★★☆ core
//  run: node ../run.js solutions/06-tuple-rest-and-optional.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three tuple powers, one each.
//
//  `port?: number` makes the third slot optional, so `Route['length']` is
//  `2 | 3` — the compiler tracks both shapes at once. Reading it gives
//  `number | undefined`, which is why formatRoute must ask `port ===
//  undefined` before interpolating (`if (port)` would also drop port 0).
//
//  `...values: number[]` is a rest element: one label, then any number of
//  numbers. Destructuring with `const [, ...values] = row` hands you a
//  `number[]` — the label is skipped by the hole, and the rest keeps its
//  element type. `row.slice(1)` would have widened to `(string |
//  number)[]`, which is the classic wrong turn here.
//
//  `readonly [number, number, number]` is a fixed triple you can read but
//  not write. Note the spelling: the `readonly` goes in front of the
//  whole tuple, not on each element.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Route = [method: string, path: string, port?: number];
export type Row = [label: string, ...values: number[]];
export type Rgb = readonly [number, number, number];

export function formatRoute(route: Route): string {
  const [method, path, port] = route;
  return port === undefined ? `${method} ${path}` : `${method} ${path}:${port}`;
}

export function rowTotal(row: Row): number {
  const [, ...values] = row;
  return values.reduce((sum, value) => sum + value, 0);
}

export function brightness(rgb: Rgb): number {
  return Math.round((rgb[0] + rgb[1] + rgb[2]) / 3);
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
