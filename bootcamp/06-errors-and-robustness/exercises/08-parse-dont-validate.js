// ─────────────────────────────────────────────────────────────────────────
//  08 · parse, don't validate                                 ★★☆ core
//  concepts: parsing at the edge · narrowing · coercion traps
//  run: node 08-parse-dont-validate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `isValidAge(input)` returns true and hands you back the same messy
//  string you started with. A PARSER returns a value you can trust — or
//  throws. After it, nothing downstream needs to check again.
//
//    parseAge(input) → an integer 0-149, or throws
//        parseAge('41')    → 41          parseAge(41)     → 41
//        parseAge('  41 ') → 41
//        parseAge('old')   → throws 'age must be a number'
//        parseAge(true)    → throws 'age must be a number'
//        parseAge('3.5')   → throws 'age must be a whole number'
//        parseAge(200)     → throws 'age must be between 0 and 149'
//        parseAge('')      → throws 'age is required'
//
//    parseUser(raw) → { name, age } with the name trimmed
//        parseUser({ name: '  Ada ', age: '36' }) → { name:'Ada', age:36 }
//        parseUser({ name: '   ', age: 36 })      → throws 'name is
//                                                    required'
//
//  hint: Number('') is 0 and Number(null) is 0 — deal with missing input
//  BEFORE you convert anything.

import { test, eq } from '../../_lib/check.js';

export function parseAge(input) {
  throw new Error('TODO');
}

export function parseUser(raw) {
  throw new Error('TODO');
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
