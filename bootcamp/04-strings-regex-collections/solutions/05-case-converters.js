// ─────────────────────────────────────────────────────────────────────────
//  05 · case converters — SOLUTION                           ★★★ stretch
//  run: node 05-case-converters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: nine conversions (3 styles × 3 inputs) collapse into one
//  normalizer plus three joins. `words()` does the normalizing:
//    1. /([a-z0-9])([A-Z])/g → '$1 $2' puts a space before an interior
//       capital, so camelCase and address2Line become separate words;
//    2. split(/[\s_-]+/) cuts on any run of spaces, underscores, hyphens;
//    3. filter(Boolean) drops the empty strings a leading separator
//       leaves behind, and toLowerCase() flattens the casing.
//  After that snake and kebab are one join, and camel is "first word as
//  is, capitalize the rest". The classic wrong turn is writing three
//  independent regexes and discovering they disagree about digits.
//  (Note: ALLCAPS acronyms like 'parseHTMLTag' need a second rule —
//  /([A-Z]+)([A-Z][a-z])/ — which is why real libraries are 40 lines.)

import { test, eq } from '../../_lib/check.js';

function words(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toCamelCase(text) {
  const [first, ...rest] = words(text);
  if (first === undefined) return '';
  return first + rest.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

export function toSnakeCase(text) {
  return words(text).join('_');
}

export function toKebabCase(text) {
  return words(text).join('-');
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
