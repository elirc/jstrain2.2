// ─────────────────────────────────────────────────────────────────────────
//  26 · JSON round-trips — SOLUTION                        ★★☆ core
//  run: node 26-json-round-trip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `JSON.stringify(value, replacer, indent)` — pass null for
//  the replacer and 2 for the indent to pretty-print. The round trip is a
//  lossy clone: undefined, functions and symbols vanish from objects, and
//  because an array cannot have a hole in the middle of its JSON, those
//  same values become null in arrays. Dates survive as ISO strings (their
//  `toJSON` runs), which is why a reviver is the only way to get real Dates
//  back — JSON has no date type. Keep the ISO test strict: a loose /\d{4}/
//  reviver will happily turn a product code into a Date.

import { test, eq, ok } from '../../_lib/check.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function pretty(value) {
  return JSON.stringify(value, null, 2);
}

export function roundTrip(value) {
  return JSON.parse(JSON.stringify(value));
}

export function parseWithDates(text) {
  return JSON.parse(text, (key, value) =>
    typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value
  );
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
