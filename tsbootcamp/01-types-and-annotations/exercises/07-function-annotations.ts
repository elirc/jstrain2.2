// ─────────────────────────────────────────────────────────────────────────
//  07 · function annotations                                ★★☆ core
//  concepts: parameters · return types · optional & default params · void
//  run: node ../run.js exercises/07-function-annotations.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Parameters are the one place TypeScript cannot guess — annotate every
//  one. Return types it CAN infer, but on exported functions write them
//  down anyway: the annotation is the contract, and it catches the day
//  your body starts returning something else.
//
//      greet('Ada')              → 'Hello, Ada!'
//      greet('Ada', 'Hi')        → 'Hi, Ada!'      default parameter
//      truncate('typescript')    → 'typescri'      optional max, default 8
//      truncate('typescript', 4) → 'type'
//      truncate('ts')            → 'ts'
//      logLine('boot')           → nothing at all — it appends to `log`
//
//  hint: a default value (`= 'Hello'`) makes a parameter optional AND
//  gives it a type; `max?: number` makes it optional and hands you
//  `number | undefined` to deal with

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const log: string[] = [];

export function greet(name: TODO, greeting: TODO = 'Hello'): TODO {
  throw new Error('TODO');
}

export function truncate(text: TODO, max?: TODO): TODO {
  throw new Error('TODO');
}

export function logLine(line: TODO): TODO {
  throw new Error('TODO');
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
