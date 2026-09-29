// ─────────────────────────────────────────────────────────────────────────
//  34 · comparator factories                               ★★☆ core
//  concepts: comparators · sorting · factories
//  run: node 34-comparator-factories.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `sort` takes a comparator: a function of two items that answers "which
//  one comes first?" with a NEGATIVE number, 0, or a POSITIVE number.
//  Writing that by hand every time is noise — build the factories once.
//
//      const crew = [{ age: 36 }, { age: 28 }];
//      [...crew].sort(by('age'))               → 28 first
//      [...crew].sort(descending(by('age')))   → 36 first
//
//  `by(key)` must work for strings as well as numbers, and must report 0
//  for a tie so `sort` leaves tied items in their original order.
//  `descending(cmp)` takes any comparator and returns the reversed one —
//  it must not know or care what the original compares.
//
//  hint: `a[key] > b[key]` is a boolean, and `sort` reads `false` as 0 —
//  map the comparison to -1 / 0 / 1 yourself

import { test, eq, ok } from '../../_lib/check.js';

export function by(key) {
  throw new Error('TODO');
}

export function descending(cmp) {
  throw new Error('TODO');
}

// ── given: the fixture the tests sort ──
const crew = [
  { name: 'ada', age: 36 },
  { name: 'lin', age: 28 },
  { name: 'grace', age: 45 },
];

// ──────────────────────────── tests ──────────────────────────────────────

test('by sorts on a numeric key, smallest first', () => {
  eq(
    [...crew].sort(by('age')).map((p) => p.age),
    [28, 36, 45]
  );
});

test('by sorts on a string key too', () => {
  eq(
    [...crew].sort(by('name')).map((p) => p.name),
    ['ada', 'grace', 'lin']
  );
});

test('numbers are compared as numbers, not as text', () => {
  const rows = [{ n: 10 }, { n: 9 }, { n: 100 }];
  eq(
    [...rows].sort(by('n')).map((r) => r.n),
    [9, 10, 100],
    'the default sort would give 10, 100, 9'
  );
});

test('a comparator answers with a number, never a boolean', () => {
  const cmp = by('age');
  ok(cmp({ age: 1 }, { age: 2 }) < 0);
  ok(cmp({ age: 2 }, { age: 1 }) > 0);
  eq(cmp({ age: 7 }, { age: 7 }), 0);
});

test('ties keep the order they came in', () => {
  const rows = [
    { n: 1, tag: 'first' },
    { n: 1, tag: 'second' },
  ];
  eq(
    [...rows].sort(by('n')).map((r) => r.tag),
    ['first', 'second']
  );
});

test('descending flips whatever comparator it is given', () => {
  const cmp = descending(by('age'));
  ok(cmp({ age: 1 }, { age: 2 }) > 0);
  eq(
    [...crew].sort(cmp).map((p) => p.age),
    [45, 36, 28]
  );
});

test('descending works on a hand-written comparator as well', () => {
  const byLength = (a, b) => a.length - b.length;
  eq(['aaa', 'a', 'aa'].sort(descending(byLength)), ['aaa', 'aa', 'a']);
});

test('descending twice is the original order again', () => {
  eq(
    [...crew].sort(descending(descending(by('age')))).map((p) => p.age),
    [28, 36, 45]
  );
});
