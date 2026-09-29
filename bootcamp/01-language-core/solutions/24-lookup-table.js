// ─────────────────────────────────────────────────────────────────────────
//  24 · lookup tables — SOLUTION                                ★★☆ core
//  run: node 24-lookup-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the table lives outside the function so it is built once
//  and reads as data. `Object.hasOwn` is the guard that makes the lookup
//  honest — `STATUS[code] ?? 'unknown'` looks equivalent but walks the
//  prototype chain, so statusLabel('toString') would return a function
//  and statusLabel('__proto__') would return Object.prototype. Both are
//  truthy, so `||` does not save you either. (A `new Map()` avoids the
//  whole issue, and is the better choice for user-supplied keys.)
//
//  Ranges cannot be keys, so grade uses an ordered list and returns on
//  the first threshold it clears — descending order is what makes the
//  first match the right one. NaN fails every comparison, so it falls
//  through to 'F' without a special case.
//
//  Object keys are always strings, which is why 404 and '404' land on
//  the same entry for free.

import { test, eq } from '../../_lib/check.js';

const STATUS = {
  200: 'ok',
  301: 'moved',
  404: 'not found',
  500: 'server error',
};

const GRADES = [
  [90, 'A'],
  [80, 'B'],
  [70, 'C'],
];

export function statusLabel(code) {
  return Object.hasOwn(STATUS, code) ? STATUS[code] : 'unknown';
}

export function grade(score) {
  for (const [threshold, letter] of GRADES) {
    if (score >= threshold) return letter;
  }
  return 'F';
}

// ──────────────────────────── tests ──────────────────────────────────────

test('maps the known status codes', () => {
  eq(statusLabel(200), 'ok');
  eq(statusLabel(301), 'moved');
  eq(statusLabel(404), 'not found');
  eq(statusLabel(500), 'server error');
});

test('an unknown code falls back to "unknown"', () => {
  eq(statusLabel(418), 'unknown');
  eq(statusLabel(0), 'unknown');
  eq(statusLabel(undefined), 'unknown');
});

test('numbers and their string forms hit the same entry', () => {
  eq(statusLabel('404'), 'not found');
});

test('inherited keys never leak out of the table', () => {
  eq(statusLabel('toString'), 'unknown');
  eq(statusLabel('constructor'), 'unknown');
  eq(statusLabel('__proto__'), 'unknown');
  eq(statusLabel('hasOwnProperty'), 'unknown');
});

test('grade picks the right band', () => {
  eq(grade(100), 'A');
  eq(grade(90), 'A');
  eq(grade(85), 'B');
  eq(grade(70), 'C');
  eq(grade(69), 'F');
});

test('grade gets the boundaries exactly right', () => {
  eq(grade(89.99), 'B');
  eq(grade(80), 'B');
  eq(grade(79.99), 'C');
});

test('nonsense scores land in F rather than crashing', () => {
  eq(grade(-5), 'F');
  eq(grade(0), 'F');
  eq(grade(NaN), 'F');
});
