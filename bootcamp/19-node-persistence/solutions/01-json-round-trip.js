// ─────────────────────────────────────────────────────────────────────────
//  01 · what survives JSON — SOLUTION                       ★☆☆ warm-up
//  run: node 01-json-round-trip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `JSON.parse(JSON.stringify(v))` is the whole round trip.
//  The interesting part is the loss list. `JSON.stringify` returns the
//  *value* `undefined` — not the string '"undefined"' — for anything it
//  cannot represent: undefined, functions, symbols. So the test for "this
//  key will disappear" is literally `JSON.stringify(value) === undefined`.
//  In an array there is no way to drop a slot, so those same values are
//  written as `null` instead. A Map is an object with no own enumerable
//  properties, so it stringifies to `{}` and the entries silently vanish —
//  that one has eaten many afternoons. If you need Dates and Maps back,
//  you need a replacer/reviver pair or a different format.

import { test, eq, ok } from '../../_lib/check.js';

export function roundTrip(value) {
  return JSON.parse(JSON.stringify(value));
}

export function lostKeys(obj) {
  return Object.keys(obj).filter((key) => JSON.stringify(obj[key]) === undefined);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('plain data survives untouched', () => {
  eq(roundTrip({ id: 7, name: 'ada', tags: ['a', 'b'], ok: true, x: null }), {
    id: 7,
    name: 'ada',
    tags: ['a', 'b'],
    ok: true,
    x: null,
  });
});

test('a Date comes back as a string, not a Date', () => {
  const out = roundTrip({ when: new Date(0) });
  eq(out.when, '1970-01-01T00:00:00.000Z');
  ok(!(out.when instanceof Date));
});

test('NaN and Infinity become null', () => {
  eq(roundTrip({ a: NaN, b: Infinity, c: -Infinity }), {
    a: null,
    b: null,
    c: null,
  });
});

test('undefined and function values vanish from objects', () => {
  eq(roundTrip({ id: 1, tmp: undefined, run: () => {} }), { id: 1 });
});

test('but inside an array the same values become null', () => {
  eq(roundTrip({ list: [1, undefined, 2] }), { list: [1, null, 2] });
});

test('a Map serializes to an empty object — the data is gone', () => {
  eq(roundTrip({ m: new Map([['a', 1]]), s: new Set([1, 2]) }), {
    m: {},
    s: {},
  });
});

test('lostKeys names exactly the keys that disappear', () => {
  eq(lostKeys({ id: 1, cb: () => {}, tmp: undefined, sym: Symbol('x') }), [
    'cb',
    'tmp',
    'sym',
  ]);
});

test('lostKeys is empty when nothing is lost', () => {
  eq(lostKeys({ id: 1, name: 'ada', m: new Map() }), []);
});
