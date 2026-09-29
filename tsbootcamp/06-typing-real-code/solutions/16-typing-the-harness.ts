// ─────────────────────────────────────────────────────────────────────────
//  16 · type the harness itself — SOLUTION                 ★★★ stretch
//  run: node ../run.js solutions/16-typing-the-harness.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a type parameter is inferred from EVERY position it
//  appears in, and the compiler then picks a type that satisfies them
//  all. That is usually a gift and occasionally a disaster:
//
//      oneOf<T extends string>(values: readonly T[], fallback?: T)
//      oneOf(['red', 'green'], 'blue')   // T = 'red' | 'green' | 'blue' ✔
//
//  The mistake widened the very type that was supposed to catch it.
//  `NoInfer<T>` (TS 5.4+) marks a position as "check here, do not infer
//  here", so T is fixed by `values` and 'blue' is measured against it.
//  Reach for it whenever one argument is meant to be VALIDATED against
//  another: defaults, fallbacks, expected values, initial state.
//
//  `eqStrict(actual, expected: NoInfer<T>)` is the same move. Plain
//  `<T>(a: T, b: T)` already rejects `eqStrict(1, 'a')`, but it blames
//  whichever argument inference reached second and the message wanders.
//  Pinning T to `actual` makes the harness's errors always point at the
//  expectation — the argument the author is actually getting wrong. The
//  older trick, `<T, U extends T>(actual: T, expected: U)`, does the same
//  job and still shows up in libraries written before 5.4.
//
//  `tableTest` shows the other half of library-grade typing: derive, do
//  not repeat. `Parameters<F>` and `ReturnType<F>` read the case shape
//  straight off the function under test, so a table can never drift from
//  the thing it is testing. The `(...args: never[]) => unknown` bound is
//  the polite way to say "any function": every function is assignable to
//  it (parameters are contravariant, and `never` accepts nothing), while
//  `Function` or `(...args: any[]) => any` would let `any` leak back out.
//
//  Step back and look at what typing a real library involved across this
//  module. Almost none of it was clever types for their own sake. It was:
//  put ONE source of truth in a map or an interface; derive everything
//  else with keyof and indexed access; take the widest honest input and
//  return the narrowest honest output; quarantine the unavoidable `as` at
//  the boundary where data enters; and choose the encoding whose ERROR
//  MESSAGE you would want to read at 2am. Types are the API's contract —
//  the compiler is just the first user to complain.

import { isDeepStrictEqual } from 'node:util';
import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function eqStrict<T>(
  actual: T,
  expected: NoInfer<T>,
  message = 'values differ'
): void {
  if (isDeepStrictEqual(actual, expected)) return;
  throw new Error(
    `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  );
}

export function oneOf<T extends string>(
  values: readonly T[],
  fallback?: NoInfer<T>
): T {
  if (fallback !== undefined) return fallback;
  if (values.length === 0) throw new RangeError('oneOf needs at least one value');
  return values[0];
}

export type AnyFunction = (...args: never[]) => unknown;

export interface TestCase<F extends AnyFunction> {
  name: string;
  args: Parameters<F>;
  expected: ReturnType<F>;
}

export interface Report {
  passed: number;
  failed: string[];
}

export function tableTest<F extends AnyFunction>(
  fn: F,
  cases: readonly TestCase<F>[]
): Report {
  const report: Report = { passed: 0, failed: [] };
  for (const testCase of cases) {
    const actual = fn(...testCase.args);
    if (isDeepStrictEqual(actual, testCase.expected)) report.passed += 1;
    else report.failed.push(testCase.name);
  }
  return report;
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
