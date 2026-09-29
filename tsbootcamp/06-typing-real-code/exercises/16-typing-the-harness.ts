// ─────────────────────────────────────────────────────────────────────────
//  16 · type the harness itself                            ★★★ stretch
//  concepts: NoInfer · inference sites · table-driven tests
//  run: node ../run.js exercises/16-typing-the-harness.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  The finale: type the thing you have been running for six modules. A
//  test helper is a library like any other — its whole value is the error
//  it gives you when you use it wrong.
//
//      eqStrict(1, 2)            → throws 'values differ'
//      eqStrict(1, 'a')          → COMPILE error, which is the point
//      oneOf(['red','green'])          → 'red'
//      oneOf(['red','green'], 'green') → 'green'
//      oneOf(['red','green'], 'blue')  → COMPILE error
//      tableTest(add, [{ name: 'adds', args: [1, 2], expected: 3 }])
//                                → { passed: 1, failed: [] }
//
//  The interesting word is `NoInfer` (TS 5.4+). A type parameter collects
//  candidates from EVERY position it appears in, so `oneOf<T extends
//  string>(values: T[], fallback?: T)` happily infers `T = 'red' | 'green'
//  | 'blue'` from the mistake itself and reports nothing. Wrap the second
//  position in `NoInfer<T>` and it becomes a checking site rather than an
//  inference site — T is decided by `values` alone, and 'blue' is
//  measured against it.
//
//  `tableTest` is the other half: `args` must be the function's parameter
//  tuple and `expected` its return type, both read off the function you
//  pass in.
//
//  hint: to accept "any function at all" without `any`, constrain to
//  `(...args: never[]) => unknown` — every function is assignable to it,
//  and `Parameters`/`ReturnType` still work through it

import { isDeepStrictEqual } from 'node:util';
import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function eqStrict(actual: TODO, expected: TODO, message: TODO = 'values differ'): TODO {
  throw new Error('TODO');
}

export function oneOf(values: TODO, fallback?: TODO): TODO {
  throw new Error('TODO');
}

export type AnyFunction = TODO;

export interface TestCase<F extends AnyFunction> {
  name: TODO;
  args: TODO;
  expected: TODO;
}

export interface Report {
  passed: number;
  failed: string[];
}

export function tableTest(fn: TODO, cases: TODO): TODO {
  throw new Error('TODO');
}

const add = (a: number, b: number): number => a + b;

// ─────────────────────────── runtime tests ───────────────────────────────

test('eqStrict is quiet when two values are deeply equal', () => {
  eqStrict({ a: [1, 2] }, { a: [1, 2] });
  eqStrict('same', 'same');
  ok(true, 'no throw');
});

test('eqStrict throws, and says which message it was given', () => {
  throws(() => eqStrict(1, 2), 'values differ');
  throws(() => eqStrict([1], [2], 'lists differ'), 'lists differ');
});

test('oneOf falls back to the first value when given nothing', () => {
  eq(oneOf(['red', 'green']), 'red');
  eq(oneOf(['solo']), 'solo');
});

test('oneOf prefers the fallback it was handed', () => {
  eq(oneOf(['red', 'green'], 'green'), 'green');
});

test('oneOf refuses an empty list at runtime too', () => {
  throws(() => oneOf([]), 'at least one');
});

test('tableTest runs every case and counts the passes', () => {
  const report = tableTest(add, [
    { name: 'adds', args: [1, 2], expected: 3 },
    { name: 'zero', args: [0, 0], expected: 0 },
  ]);
  eq(report, { passed: 2, failed: [] });
});

test('tableTest names the cases that failed', () => {
  const report = tableTest(add, [
    { name: 'adds', args: [1, 2], expected: 3 },
    { name: 'wrong', args: [1, 2], expected: 4 },
    { name: 'also wrong', args: [2, 2], expected: 5 },
  ]);
  eq(report.passed, 1);
  eq(report.failed, ['wrong', 'also wrong']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _h1 = Expect<Equal<TestCase<typeof add>['args'], [a: number, b: number]>>;
type _h2 = Expect<Equal<TestCase<typeof add>['expected'], number>>;

function _typeTests() {
  eqStrict(1, 2);
  eqStrict('a', 'b');
  eqStrict([1, 2], [3, 4]);

  // @ts-expect-error — expected has to have the actual's type
  eqStrict(1, 'a');

  // @ts-expect-error — and naming T explicitly must not rescue it
  eqStrict<number>(1, 'a');

  const colour: 'red' | 'green' = oneOf(['red', 'green'] as const, 'green');
  use(colour);

  // @ts-expect-error — 'blue' was never on the list
  oneOf(['red', 'green'], 'blue');

  const report: Report = tableTest(add, [{ name: 'adds', args: [1, 2], expected: 3 }]);
  use(report);

  // @ts-expect-error — args must match the function's parameters
  tableTest(add, [{ name: 'x', args: [1, '2'], expected: 3 }]);

  // @ts-expect-error — expected must match the function's return type
  tableTest(add, [{ name: 'x', args: [1, 2], expected: 'three' }]);
}
use(_typeTests);
