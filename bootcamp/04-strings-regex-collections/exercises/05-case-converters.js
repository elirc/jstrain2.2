// ─────────────────────────────────────────────────────────────────────────
//  05 · case converters                                      ★★★ stretch
//  concepts: regex replace · split · case mapping
//  run: node 05-case-converters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every API boundary needs these: the DB says user_first_name, the CSS
//  says user-first-name, the JS says userFirstName. Write all three, and
//  make each one accept ANY of the three input styles (plus plain words).
//
//      toCamelCase('user_first_name')  → 'userFirstName'
//      toCamelCase('user-first-name')  → 'userFirstName'
//      toCamelCase('User first name')  → 'userFirstName'
//      toSnakeCase('userFirstName')    → 'user_first_name'
//      toKebabCase('userFirstName')    → 'user-first-name'
//      toSnakeCase('address2Line')     → 'address2_line'
//
//  The move is to normalize FIRST: turn any input into a list of
//  lowercase words, then re-join it in the style you want. Write that
//  word-splitting helper once and call it from all three.
//
//  hint: insert a space before an interior capital with
//  .replace(/([a-z0-9])([A-Z])/g, '$1 $2'), then split on /[\s_-]+/

import { test, eq } from '../../_lib/check.js';

export function toCamelCase(text) {
  throw new Error('TODO');
}

export function toSnakeCase(text) {
  throw new Error('TODO');
}

export function toKebabCase(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('toCamelCase converts snake_case', () => {
  eq(toCamelCase('user_first_name'), 'userFirstName');
});

test('toCamelCase converts kebab-case', () => {
  eq(toCamelCase('user-first-name'), 'userFirstName');
});

test('toCamelCase converts spaced words and lowers the first one', () => {
  eq(toCamelCase('User first name'), 'userFirstName');
});

test('toSnakeCase splits camelCase at the capitals', () => {
  eq(toSnakeCase('userFirstName'), 'user_first_name');
  eq(toSnakeCase('apiKey'), 'api_key');
});

test('toSnakeCase splits after a digit too', () => {
  eq(toSnakeCase('address2Line'), 'address2_line');
});

test('toSnakeCase accepts kebab-case input', () => {
  eq(toSnakeCase('user-first-name'), 'user_first_name');
});

test('toKebabCase converts camelCase', () => {
  eq(toKebabCase('userFirstName'), 'user-first-name');
});

test('the converters round-trip', () => {
  eq(toCamelCase(toSnakeCase('userFirstName')), 'userFirstName');
  eq(toKebabCase(toCamelCase('user_first_name')), 'user-first-name');
});
