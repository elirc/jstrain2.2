// ─────────────────────────────────────────────────────────────────────────
//  31 · toBoolean                                           ★☆☆ warm-up
//  concepts: ToBoolean · the eight falsy values · env-var flags
//  run: node 31-to-boolean.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Write the spec's ToBoolean by hand, one branch per type — no Boolean(),
//  no `!!`, no `if (value)`. Pinning the table is the point:
//
//      undefined, null           → false
//      boolean                   → itself
//      number                    → false for 0, -0 and NaN, else true
//      bigint                    → false for 0n, else true
//      string                    → false for '' only ('0' is TRUE)
//      everything else           → true ([], {}, functions, symbols)
//
//  Then toFlag, for config strings — where truthiness is exactly the wrong
//  rule, because the string 'false' is truthy:
//
//      toFlag('true')  → true      toFlag('false') → false
//      toFlag(' YES ') → true      toFlag('off')   → false
//      toFlag('1')     → true      toFlag('')      → false
//      toFlag(true)    → true      toFlag('maybe') → null
//      toFlag(1)       → null      toFlag(null)    → null
//
//  Only booleans and strings are readable; anything else is null. Strings
//  are trimmed and lowercased before the word lists below are consulted.

import { test, eq } from '../../_lib/check.js';

const TRUE_WORDS = new Set(['true', '1', 'yes', 'on']);
const FALSE_WORDS = new Set(['false', '0', 'no', 'off', '']);

export function toBoolean(value) {
  throw new Error('TODO');
}

export function toFlag(value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the eight falsy values, and nothing else, are false', () => {
  for (const value of [false, 0, -0, 0n, '', null, undefined, NaN]) {
    eq(toBoolean(value), false, `expected ${String(value)} to be falsy`);
  }
});

test('the sneaky truthy ones are true', () => {
  for (const value of ['0', 'false', ' ', [], {}, -1, Infinity, 1n]) {
    eq(toBoolean(value), true, `expected ${String(value)} to be truthy`);
  }
});

test('objects, functions and symbols are always true', () => {
  eq(toBoolean(() => {}), true);
  eq(toBoolean(Symbol('s')), true);
  eq(toBoolean(new Date(0)), true);
  eq(toBoolean(new Map()), true);
});

test('it agrees with the built-in on every sample', () => {
  const samples = [0, -0, 1, NaN, '', '0', 'x', 0n, 2n, null, undefined,
    true, false, [], {}, [0]];
  for (const value of samples) {
    eq(toBoolean(value), Boolean(value), `disagreed on ${String(value)}`);
  }
});

test('toFlag reads the yes-words, trimmed and case-insensitively', () => {
  eq(toFlag('true'), true);
  eq(toFlag(' YES '), true);
  eq(toFlag('On'), true);
  eq(toFlag('1'), true);
});

test('toFlag is not fooled by "false", which is a truthy string', () => {
  eq(toFlag('false'), false);
  eq(toFlag('OFF'), false);
  eq(toFlag('no'), false);
  eq(toFlag('0'), false);
  eq(toFlag(''), false);
  eq(toBoolean('false'), true); // the bug you just avoided
});

test('real booleans pass straight through', () => {
  eq(toFlag(true), true);
  eq(toFlag(false), false);
});

test('anything it cannot read is null, not a guess', () => {
  eq(toFlag('maybe'), null);
  eq(toFlag(1), null);
  eq(toFlag(0), null);
  eq(toFlag(null), null);
  eq(toFlag(undefined), null);
  eq(toFlag([]), null);
});
