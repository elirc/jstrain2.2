// ─────────────────────────────────────────────────────────────────────────
//  08 · parse, don't validate — SOLUTION                      ★★☆ core
//  run: node 08-parse-dont-validate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape of every parser is the same — reject what you
//  cannot handle, convert once, then narrow with the specific rules. The
//  return type is the promise: past this line `age` is an integer in
//  range, so no caller ever writes `if (typeof age === 'number')` again.
//  Order matters because JS coercion lies: Number('') and Number(null)
//  are both 0, Number(true) is 1, Number([]) is 0. Handle "missing"
//  first and refuse non-string, non-number input outright, and none of
//  those traps can reach you.
//  Classic wrong turn: `if (isNaN(input))` as the only check — it says
//  a blank string, an empty array and `true` are all fine ages.

import { test, eq } from '../../_lib/check.js';

export function parseAge(input) {
  if (input === null || input === undefined) {
    throw new Error('age is required');
  }

  let value;
  if (typeof input === 'number') {
    value = input;
  } else if (typeof input === 'string') {
    const text = input.trim();
    if (text === '') throw new Error('age is required');
    value = Number(text);
  } else {
    throw new Error('age must be a number');
  }

  if (!Number.isFinite(value)) throw new Error('age must be a number');
  if (!Number.isInteger(value)) throw new Error('age must be a whole number');
  if (value < 0 || value > 149) {
    throw new Error('age must be between 0 and 149');
  }
  return value;
}

export function parseUser(raw) {
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  if (name === '') throw new Error('name is required');
  return { name, age: parseAge(raw.age) };
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parses a numeric string into a real number', () => {
  eq(parseAge('41'), 41);
});

test('passes a number straight through', () => {
  eq(parseAge(41), 41);
});

test('ignores surrounding whitespace', () => {
  eq(parseAge('  41  '), 41);
});

test('rejects text with a clear message', () => {
  eq(thrownBy(() => parseAge('old')).message, 'age must be a number');
});

test('booleans are not numbers, whatever Number() thinks', () => {
  eq(thrownBy(() => parseAge(true)).message, 'age must be a number');
});

test('rejects fractions and impossible ages separately', () => {
  eq(thrownBy(() => parseAge('3.5')).message, 'age must be a whole number');
  eq(
    thrownBy(() => parseAge(200)).message,
    'age must be between 0 and 149'
  );
});

test('missing or blank input says "required", not "not a number"', () => {
  eq(thrownBy(() => parseAge(undefined)).message, 'age is required');
  eq(thrownBy(() => parseAge(null)).message, 'age is required');
  eq(thrownBy(() => parseAge('   ')).message, 'age is required');
});

test('parseUser builds a clean record and refuses a blank name', () => {
  eq(parseUser({ name: '  Ada ', age: '36' }), { name: 'Ada', age: 36 });
  eq(
    thrownBy(() => parseUser({ name: '   ', age: 36 })).message,
    'name is required'
  );
});
