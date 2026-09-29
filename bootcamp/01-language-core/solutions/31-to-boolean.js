// ─────────────────────────────────────────────────────────────────────────
//  31 · toBoolean — SOLUTION                                ★☆☆ warm-up
//  run: node 31-to-boolean.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: written as a type switch, ToBoolean stops being folklore.
//  Every falsy value belongs to exactly one branch — null/undefined, the
//  numeric zeroes plus NaN, 0n, and the empty string — and the final
//  `return true` covers every object, function and symbol there will ever
//  be. That last line is why `if ([])` runs and `if ({})` runs.
//
//  toFlag exists because truthiness is the wrong tool for configuration.
//  `Boolean('false')` is true, so `if (process.env.DEBUG)` turns DEBUG on
//  when someone carefully set it to 'false'. A word list, plus null for
//  "I could not read that", makes the mistake visible instead of silent.
//
//  Note the deliberate asymmetry: '' is a FALSE word (an unset variable
//  reads as off) while the number 1 is refused — a config value that is
//  not a string is a wiring bug, not a flag.

import { test, eq } from '../../_lib/check.js';

const TRUE_WORDS = new Set(['true', '1', 'yes', 'on']);
const FALSE_WORDS = new Set(['false', '0', 'no', 'off', '']);

export function toBoolean(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return !(value === 0 || Number.isNaN(value));
  if (typeof value === 'bigint') return value !== 0n;
  if (typeof value === 'string') return value.length > 0;
  return true;
}

export function toFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const word = value.trim().toLowerCase();
  if (TRUE_WORDS.has(word)) return true;
  if (FALSE_WORDS.has(word)) return false;
  return null;
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
