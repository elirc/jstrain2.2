// ─────────────────────────────────────────────────────────────────────────
//  26 · JSON round-trips                                   ★★☆ core
//  concepts: JSON.stringify · JSON.parse · reviver
//  run: node 26-json-round-trip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  JSON is the wire format for everything, and it quietly loses data on
//  the way through. Three helpers:
//
//      pretty({ a: 1 })            → '{\n  "a": 1\n}'
//      roundTrip({ a: 1, b: undefined, c() {} })  → { a: 1 }
//      roundTrip([1, undefined, 3])               → [1, null, 3]
//      parseWithDates('{"at":"2020-01-02T03:04:05.000Z"}')
//        → { at: Date }   a real Date, not a string
//
//  Note the asymmetry in the second and third lines: an undefined PROPERTY
//  disappears, an undefined ARRAY SLOT becomes null.
//
//  hint: `JSON.parse(text, reviver)` — the reviver gets (key, value) for
//  every parsed value and whatever it returns is used instead.

import { test, eq, ok } from '../../_lib/check.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function pretty(value) {
  throw new Error('TODO');
}

export function roundTrip(value) {
  throw new Error('TODO');
}

export function parseWithDates(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('pretty indents with two spaces', () => {
  eq(pretty({ a: 1 }), '{\n  "a": 1\n}');
});

test('pretty indents nested structures too', () => {
  eq(pretty({ a: [1] }), '{\n  "a": [\n    1\n  ]\n}');
});

test('roundTrip returns equal plain data', () => {
  const data = { name: 'Ada', tags: ['a', 'b'], nested: { n: 1 } };
  eq(roundTrip(data), data);
});

test('roundTrip drops undefined, functions and symbols', () => {
  eq(roundTrip({ a: 1, b: undefined, c: () => {}, d: Symbol('s') }), { a: 1 });
});

test('an undefined array slot becomes null instead of vanishing', () => {
  eq(roundTrip([1, undefined, 3]), [1, null, 3]);
});

test('a Date comes back as a string', () => {
  const out = roundTrip({ at: new Date('2020-01-02T03:04:05.000Z') });
  eq(out.at, '2020-01-02T03:04:05.000Z');
});

test('parseWithDates revives ISO strings into Date objects', () => {
  const out = parseWithDates('{"at":"2020-01-02T03:04:05.000Z","n":1}');
  ok(out.at instanceof Date);
  eq(out.at.toISOString(), '2020-01-02T03:04:05.000Z');
  eq(out.n, 1);
});

test('parseWithDates leaves ordinary strings alone', () => {
  const out = parseWithDates('{"sku":"2020-01","note":"hello"}');
  eq(out.sku, '2020-01');
  eq(out.note, 'hello');
});
