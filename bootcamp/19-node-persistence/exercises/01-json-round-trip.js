// ─────────────────────────────────────────────────────────────────────────
//  01 · what survives JSON                                 ★☆☆ warm-up
//  concepts: JSON · serialization fidelity
//  run: node 01-json-round-trip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Saving data means turning objects into bytes. JSON is the default way
//  to do that, and it is lossy in ways that bite months later. Before you
//  build a storage layer, learn exactly what the round trip destroys.
//
//      roundTrip({ n: 1 })          → { n: 1 }
//      roundTrip({ d: new Date(0) })→ { d: '1970-01-01T00:00:00.000Z' }
//      roundTrip({ n: NaN })        → { n: null }
//
//  lostKeys(obj) → the own keys that DISAPPEAR from the JSON output,
//  in their original order.
//
//      lostKeys({ id: 1, cb: () => {}, tmp: undefined })  → ['cb', 'tmp']
//      lostKeys({ id: 1 })                                → []

import { test, eq, ok } from '../../_lib/check.js';

export function roundTrip(value) {
  throw new Error('TODO');
}

export function lostKeys(obj) {
  throw new Error('TODO');
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
