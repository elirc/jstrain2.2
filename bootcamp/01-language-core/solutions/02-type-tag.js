// ─────────────────────────────────────────────────────────────────────────
//  02 · typeTag — SOLUTION                                      ★★☆ core
//  run: node 02-type-tag.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every object has an internal tag that
//  Object.prototype.toString exposes as '[object X]'. `.call(value)` is
//  required — calling toString on the value itself would hit the value's
//  own overridden toString. slice(8, -1) drops '[object ' and ']'.
//
//  "Plain" is a prototype question, not a tag question: a class instance
//  also tags as 'Object'. A literal's prototype is Object.prototype and
//  Object.create(null) has none — anything else is a class instance.

import { test, eq } from '../../_lib/check.js';

class Point {
  constructor(x) {
    this.x = x;
  }
}

export function typeTag(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export function isPlainObject(value) {
  if (typeTag(value) !== 'Object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('tags the built-in object types', () => {
  eq(typeTag(new Date()), 'Date');
  eq(typeTag(new Map()), 'Map');
  eq(typeTag(new Set()), 'Set');
  eq(typeTag(/ab+/), 'RegExp');
});

test('tags null and undefined distinctly', () => {
  eq(typeTag(null), 'Null');
  eq(typeTag(undefined), 'Undefined');
});

test('tags primitives by their wrapper name', () => {
  eq(typeTag(1), 'Number');
  eq(typeTag(NaN), 'Number');
  eq(typeTag('hi'), 'String');
  eq(typeTag(false), 'Boolean');
});

test('separates arrays from functions from objects', () => {
  eq(typeTag([]), 'Array');
  eq(typeTag(() => {}), 'Function');
  eq(typeTag({}), 'Object');
});

test('isPlainObject accepts literals and null-prototype bags', () => {
  eq(isPlainObject({}), true);
  eq(isPlainObject({ a: 1 }), true);
  eq(isPlainObject(Object.create(null)), true);
});

test('isPlainObject rejects arrays, dates, null and class instances', () => {
  eq(isPlainObject([]), false);
  eq(isPlainObject(new Date()), false);
  eq(isPlainObject(new Map()), false);
  eq(isPlainObject(null), false);
  eq(isPlainObject(new Point(1)), false);
});
