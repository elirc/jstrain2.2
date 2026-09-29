// ─────────────────────────────────────────────────────────────────────────
//  07 · function annotations — SOLUTION                     ★★☆ core
//  run: node ../run.js solutions/07-function-annotations.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two ways to make a parameter optional, and they are not
//  interchangeable.
//
//  A default (`greeting = 'Hello'`) types the parameter from the default
//  value and makes it optional at the call site — inside the body it is
//  plain `string`, never undefined. An optional marker (`max?: number`)
//  makes it optional too, but inside the body you hold `number |
//  undefined` and must supply the fallback yourself: `max ?? 8`.
//
//  Use a default when there is an obvious value; use `?` when "absent"
//  is genuinely different from any value you could pick.
//
//  `void` is the return type of a function called for its side effect. It
//  is not `undefined`: `void` means "I return nothing you should look
//  at", which is why assigning the result to a string is an error even
//  though the value is undefined at runtime. (It also lets a `() => void`
//  callback be satisfied by a function that does return something — see
//  the next exercise.)

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const log: string[] = [];

export function greet(name: string, greeting = 'Hello'): string {
  return `${greeting}, ${name}!`;
}

export function truncate(text: string, max?: number): string {
  return text.slice(0, max ?? 8);
}

export function logLine(line: string): void {
  log.push(line);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('greet uses the default greeting', () => {
  eq(greet('Ada'), 'Hello, Ada!');
});

test('greet uses the greeting it is given', () => {
  eq(greet('Ada', 'Hi'), 'Hi, Ada!');
});

test('truncate cuts at 8 characters by default', () => {
  eq(truncate('typescript'), 'typescri');
});

test('truncate honours an explicit max', () => {
  eq(truncate('typescript', 4), 'type');
});

test('truncate leaves a short string alone', () => {
  eq(truncate('ts'), 'ts');
});

test('logLine appends to the log and returns nothing', () => {
  const result: unknown = logLine('boot');
  eq(result, undefined);
  eq(log, ['boot']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<
  Equal<Parameters<typeof greet>, [name: string, greeting?: string]>
>;
type _2 = Expect<Equal<ReturnType<typeof greet>, string>>;
type _3 = Expect<Equal<Parameters<typeof truncate>[1], number | undefined>>;
type _4 = Expect<Equal<Parameters<typeof truncate>['length'], 1 | 2>>;
type _5 = Expect<Equal<ReturnType<typeof logLine>, void>>;

function _typeTests() {
  greet('Ada'); // the default makes the second argument optional
  greet('Ada', 'Hi');

  // @ts-expect-error — greeting is a string
  greet('Ada', 42);

  // @ts-expect-error — max is optional, but it is still a number
  truncate('typescript', '4');

  // @ts-expect-error — logLine returns void: there is nothing to keep
  const kept: string = logLine('x');
  use(kept);
}
use(_typeTests);
